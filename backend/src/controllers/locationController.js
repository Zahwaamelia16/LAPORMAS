
const https = require('https');
const pool = require('../config/db');

const CACHE_TTL = 24 * 60 * 60 * 1000;
const MIN_REQUEST_INTERVAL = 1100;

const cache = new Map();
const pendingRequests = new Map();

let requestQueue = Promise.resolve();
let lastRequestAt = 0;

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Normalisasi nama wilayah agar "Kota Surabaya"
// bisa dicocokkan dengan "Surabaya".
function normalizeName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(
            /^(kota administrasi|kabupaten|kecamatan|kelurahan|desa|kota)\s+/,
            ''
        )
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}

function uniqueNames(values) {
    return [
        ...new Set(
            values
                .map(normalizeName)
                .filter(Boolean)
        ),
    ];
}

// Request HTTPS ke Nominatim.
function requestNominatim(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(
            url,
            {
                headers: {
                    'User-Agent':
                        process.env.NOMINATIM_USER_AGENT ||
                        'LAPORMAS/1.0 (student project)',
                    'Accept-Language': 'id',
                },
            },
            (response) => {
                let body = '';

                response.setEncoding('utf8');

                response.on('data', (chunk) => {
                    body += chunk;
                });

                response.on('end', () => {
                    if (
                        response.statusCode < 200 ||
                        response.statusCode >= 300
                    ) {
                        return reject(
                            new Error(
                                response.statusCode === 429
                                    ? 'Layanan lokasi sedang sibuk. Coba beberapa saat lagi.'
                                    : 'Gagal mengambil informasi alamat dari OpenStreetMap.'
                            )
                        );
                    }

                    try {
                        const result = JSON.parse(body);

                        if (result.error) {
                            return reject(new Error(result.error));
                        }

                        resolve(result);
                    } catch {
                        reject(
                            new Error('Respons layanan alamat tidak valid.')
                        );
                    }
                });
            }
        );

        request.setTimeout(15000, () => {
            request.destroy(
                new Error('Waktu pencarian alamat habis.')
            );
        });

        request.on('error', reject);
    });
}

// Membatasi seluruh permintaan agar tidak lebih dari
// satu permintaan per detik ke server publik.
function queuedRequest(url) {
    const task = requestQueue.then(async () => {
        const elapsed = Date.now() - lastRequestAt;
        const remaining = MIN_REQUEST_INTERVAL - elapsed;

        if (remaining > 0) {
            await delay(remaining);
        }

        lastRequestAt = Date.now();

        return requestNominatim(url);
    });

    requestQueue = task.catch(() => null);

    return task;
}

async function getNominatimResult(latitude, longitude) {
    const cacheKey =
        `${latitude.toFixed(5)},${longitude.toFixed(5)}`;

    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
    }

    const url = new URL(
        'https://nominatim.openstreetmap.org/reverse'
    );

    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18');
    url.searchParams.set('accept-language', 'id');

    const promise = queuedRequest(url)
        .then((data) => {
            cache.set(cacheKey, {
                data,
                expiresAt: Date.now() + CACHE_TTL,
            });

            // Jaga ukuran cache tetap terbatas.
            if (cache.size > 500) {
                const oldestKey = cache.keys().next().value;
                cache.delete(oldestKey);
            }

            return data;
        })
        .finally(() => {
            pendingRequests.delete(cacheKey);
        });

    pendingRequests.set(cacheKey, promise);

    return promise;
}

function pickFirst(...values) {
    return values.find(
        (value) =>
            typeof value === 'string' &&
            value.trim()
    ) || '';
}

// GET lokasi administratif dari respons OpenStreetMap.
function extractAdministrative(address = {}) {
    return {
        village: pickFirst(
            address.village,
            address.suburb,
            address.hamlet,
            address.neighbourhood,
            address.quarter,
            address.residential,
            address.locality
        ),

        district: pickFirst(
            address.city_district,
            address.district,
            address.municipality,
            address.borough,
            address.county
        ),

        regency: pickFirst(
            address.city,
            address.town,
            address.state_district,
            address.municipality,
            address.county
        ),
    };
}

function candidateNames(address = {}) {
    return {
        villages: uniqueNames([
            address.village,
            address.suburb,
            address.hamlet,
            address.neighbourhood,
            address.quarter,
            address.residential,
            address.locality,
        ]),

        districts: uniqueNames([
            address.city_district,
            address.district,
            address.municipality,
            address.borough,
            address.county,
        ]),

        regencies: uniqueNames([
            address.city,
            address.town,
            address.state_district,
            address.municipality,
            address.county,
        ]),
    };
}

async function reverseGeocode(req, res) {
    const rawLatitude = req.body?.latitude;
    const rawLongitude = req.body?.longitude;

    if (
        rawLatitude === undefined ||
        rawLatitude === null ||
        String(rawLatitude).trim() === '' ||
        rawLongitude === undefined ||
        rawLongitude === null ||
        String(rawLongitude).trim() === ''
    ) {
        return res.status(400).json({
            message: 'Latitude dan longitude wajib diisi.',
        });
    }

    const latitude = Number(rawLatitude);
    const longitude = Number(rawLongitude);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return res.status(400).json({
            message: 'Koordinat latitude atau longitude tidak valid.',
        });
    }

    try {
        const result = await getNominatimResult(
            latitude,
            longitude
        );

        if (!result || !result.display_name) {
            return res.status(404).json({
                message: 'Alamat tidak ditemukan pada lokasi tersebut.',
            });
        }

        const address = result.address || {};

        console.log(
            '[NOMINATIM ADDRESS RAW]',
            JSON.stringify(address, null, 2)
        );
        const candidates = candidateNames(address);
        const administrative = extractAdministrative(address);

        // Cari kecocokan ketiga tingkat wilayah
        // dengan data master LAPORMAS.
        const areaResult = await pool.query(`
            SELECT
                area_id,
                village_name,
                district_name,
                regency_name
            FROM areas
        `);

        const matchedArea = areaResult.rows.find((area) =>
            candidates.villages.includes(
                normalizeName(area.village_name)
            ) &&
            candidates.districts.includes(
                normalizeName(area.district_name)
            ) &&
            candidates.regencies.includes(
                normalizeName(area.regency_name)
            )
        ) || null;

        const finalAdministrative = matchedArea
            ? {
                village: matchedArea.village_name,
                district: matchedArea.district_name,
                regency: matchedArea.regency_name,
            }
            : administrative;

        return res.status(200).json({
            message: matchedArea
                ? 'Alamat dan wilayah berhasil ditemukan.'
                : 'Alamat ditemukan, tetapi wilayah belum cocok dengan data LAPORMAS.',

            displayAddress: result.display_name,

            administrative: finalAdministrative,

            matchedArea,

            isAreaMatched: Boolean(matchedArea),

            attribution: '© OpenStreetMap contributors',
        });

    } catch (error) {
        console.error(
            'Gagal melakukan reverse geocoding:',
            error.message
        );

        return res.status(502).json({
            message: error.message ||
                'Gagal mendeteksi alamat. Silakan coba kembali.',
        });
    }
}

module.exports = { reverseGeocode };
