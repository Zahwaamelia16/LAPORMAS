const fs = require('fs');
const pool = require('../config/db');
const { findAreaByCoordinates } = require('./locationController');

// Controller laporan untuk warga:
//   POST /api/reports              -> kirim laporan baru (+ foto, area otomatis dari GPS)
//   GET  /api/reports/mine         -> daftar laporan milik warga yang login
//   GET  /api/reports/track/:code  -> lacak laporan pakai nomor laporan (publik)

const REPORT_SELECT = `
    SELECT
        r.report_id,
        'LPM-' || LPAD(r.report_id::text, 5, '0') AS report_code,
        r.category_id,
        c.category_name,
        r.status_id,
        s.status_name,
        r.area_id,
        a.village_name,
        a.district_name,
        a.regency_name,
        r.title,
        r.description,
        r.location,
        r.latitude,
        r.longitude,
        r.created_at,
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'image_id', ri.image_id,
                        'image_url', ri.image_url,
                        'uploaded_at', ri.uploaded_at
                    )
                    ORDER BY ri.uploaded_at
                )
                FROM report_images ri
                WHERE ri.report_id = r.report_id
            ),
            '[]'::json
        ) AS images
    FROM reports r
    JOIN report_categories c ON c.category_id = r.category_id
    JOIN report_statuses s ON s.status_id = r.status_id
    JOIN areas a ON a.area_id = r.area_id
`;

// Riwayat penanganan (tanpa data pribadi petugas, aman untuk publik)
async function getUpdates(reportId) {
    const result = await pool.query(`
        SELECT
            old_s.status_name AS old_status,
            new_s.status_name AS new_status,
            ru.notes,
            ru.updated_at
        FROM report_updates ru
        LEFT JOIN report_statuses old_s ON old_s.status_id = ru.old_status_id
        JOIN report_statuses new_s ON new_s.status_id = ru.new_status_id
        WHERE ru.report_id = $1
        ORDER BY ru.updated_at DESC, ru.update_id DESC
    `, [reportId]);

    return result.rows;
}

// "LPM-00012", "lpm00012", atau "12" -> 12
function parseReportCode(code) {
    const match = String(code || '').trim().match(/^(?:lpm-?)?0*(\d{1,12})$/i);
    if (!match) return null;
    const id = Number(match[1]);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Hapus foto yang sudah terlanjur tersimpan jika laporan gagal dibuat
function removeUploadedFiles(files = []) {
    files.forEach((file) => {
        fs.unlink(file.path, () => { });
    });
}

// GET /api/reports/mine  (wajib login)
async function getMyReports(req, res) {
    try {
        const result = await pool.query(
            `${REPORT_SELECT} WHERE r.user_id = $1 ORDER BY r.created_at DESC, r.report_id DESC`,
            [req.user.user_id]
        );

        return res.status(200).json({
            message: 'Berhasil mengambil laporan saya',
            total: result.rowCount,
            reports: result.rows,
        });
    } catch (error) {
        console.error('Gagal mengambil laporan saya:', error.message);
        return res.status(500).json({ message: 'Gagal mengambil laporan saya.' });
    }
}

// GET /api/reports/track/:code  (publik)
async function trackReport(req, res) {
    const reportId = parseReportCode(req.params.code);

    if (!reportId) {
        return res.status(400).json({ message: 'Format nomor laporan tidak valid. Contoh: LPM-00012.' });
    }

    try {
        const result = await pool.query(`${REPORT_SELECT} WHERE r.report_id = $1`, [reportId]);

        if (!result.rows.length) {
            return res.status(404).json({ message: 'Nomor laporan tidak ditemukan. Periksa kembali nomor laporanmu.' });
        }

        const report = result.rows[0];
        report.updates = await getUpdates(reportId);

        return res.status(200).json({ report });
    } catch (error) {
        console.error('Gagal melacak laporan:', error.message);
        return res.status(500).json({ message: 'Gagal melacak laporan.' });
    }
}

// POST /api/reports  (wajib login)
// Bisa JSON atau multipart/form-data (dari halaman Buat Laporan, dengan foto "images").
// Body: title, category_id, location, description, latitude, longitude, area_id (opsional)
async function createWargaReport(req, res) {
    const files = req.files || [];
    const body = req.body || {};

    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const location = String(body.location || '').trim();
    const categoryId = Number(body.category_id);
    const latitude = body.latitude === undefined || body.latitude === '' ? null : Number(body.latitude);
    const longitude = body.longitude === undefined || body.longitude === '' ? null : Number(body.longitude);
    const areaIdInput = body.area_id === undefined || body.area_id === '' ? null : Number(body.area_id);

    const fail = (status, message) => {
        removeUploadedFiles(files);
        return res.status(status).json({ message });
    };

    if (!title || !description || !location || !body.category_id) {
        return fail(400, 'Lengkapi judul, kategori, lokasi, dan deskripsi laporan.');
    }

    if (title.length > 150) {
        return fail(400, 'Judul laporan maksimal 150 karakter.');
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return fail(400, 'Kategori laporan tidak valid.');
    }

    const hasCoordinates = latitude !== null && longitude !== null;

    if (hasCoordinates && (
        !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
    )) {
        return fail(400, 'Koordinat lokasi kejadian tidak valid.');
    }

    if (!areaIdInput && !hasCoordinates) {
        return fail(400, 'Deteksi GPS lokasi kejadian terlebih dahulu.');
    }

    try {
        // Tentukan area laporan: dari area_id (jika dikirim) atau dari koordinat GPS
        let area = null;

        if (areaIdInput) {
            const found = await pool.query(
                'SELECT area_id, village_name, district_name, regency_name FROM areas WHERE area_id = $1',
                [areaIdInput]
            );
            area = found.rows[0] || null;

            if (!area) {
                return fail(400, 'Area laporan tidak ditemukan.');
            }
        } else {
            let lookup;
            try {
                lookup = await findAreaByCoordinates(latitude, longitude);
            } catch (error) {
                return fail(502, error.message || 'Gagal mendeteksi wilayah dari lokasi GPS. Coba lagi.');
            }

            area = lookup.matchedArea;

            if (!area) {
                const detected = lookup.administrative
                    ? [lookup.administrative.village, lookup.administrative.district, lookup.administrative.regency].filter(Boolean).join(', ')
                    : '';
                return fail(400, `Lokasi kejadian${detected ? ` (${detected})` : ''} belum termasuk wilayah layanan LAPORMAS.`);
            }
        }

        const category = await pool.query('SELECT category_id FROM report_categories WHERE category_id = $1', [categoryId]);
        if (!category.rows.length) {
            return fail(400, 'Kategori laporan tidak ditemukan.');
        }

        const client = await pool.connect();
        let reportId;

        try {
            await client.query('BEGIN');

            // Status awal: Menunggu
            const status = await client.query(
                `SELECT status_id FROM report_statuses WHERE LOWER(status_name) = 'menunggu' LIMIT 1`
            );
            const statusId = status.rows[0]?.status_id || 1;

            const inserted = await client.query(`
                INSERT INTO reports (user_id, category_id, status_id, area_id, title, description, location, latitude, longitude)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING report_id
            `, [req.user.user_id, categoryId, statusId, area.area_id, title, description, location, latitude, longitude]);

            reportId = inserted.rows[0].report_id;

            for (const file of files) {
                await client.query(
                    'INSERT INTO report_images (report_id, image_url) VALUES ($1, $2)',
                    [reportId, `/uploads/reports/${file.filename}`]
                );
            }

            // Catatan pertama di riwayat penanganan
            await client.query(`
                INSERT INTO report_updates (report_id, updated_by, old_status_id, new_status_id, notes)
                VALUES ($1, $2, NULL, $3, $4)
            `, [reportId, req.user.user_id, statusId, 'Laporan diterima sistem dan menunggu verifikasi pengelola.']);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        const created = await pool.query(`${REPORT_SELECT} WHERE r.report_id = $1`, [reportId]);
        const report = created.rows[0];
        report.area = {
            area_id: area.area_id,
            village_name: area.village_name,
            district_name: area.district_name,
            regency_name: area.regency_name,
        };

        return res.status(201).json({
            message: 'Laporan berhasil dikirim.',
            report,
            data: report,
        });
    } catch (error) {
        removeUploadedFiles(files);
        console.error('Gagal membuat laporan:', error.message);
        return res.status(500).json({ message: 'Gagal mengirim laporan. Coba lagi.' });
    }
}

module.exports = {
    getMyReports,
    trackReport,
    createWargaReport,
};
