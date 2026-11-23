
const pool = require('../config/db');

// Kolom yang wajib diisi ketika membuat laporan
const REQUIRED_FIELDS = [
    'category_id',
    'area_id',
    'title',
    'description',
    'location',
];

// Query dasar laporan
const BASE_SELECT = `
    SELECT
        r.report_id,
        r.user_id,
        u.name AS reporter_name,
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
    JOIN users u ON u.user_id = r.user_id
    JOIN report_categories c ON c.category_id = r.category_id
    JOIN report_statuses s ON s.status_id = r.status_id
    JOIN areas a ON a.area_id = r.area_id
`;

// Validasi ID
function parseId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0
        ? id
        : null;
}

// Penanganan error database
function handleDbError(res, error) {
    if (error.code === '23503') {
        return res.status(400).json({
            message: 'Data yang terhubung tidak ditemukan di database.',
            detail: error.detail,
        });
    }

    if (error.code === '23514') {
        return res.status(400).json({
            message: 'Data tidak valid. Periksa latitude dan longitude.',
            detail: error.constraint,
        });
    }

    if (error.code === '23505') {
        return res.status(409).json({
            message: 'Data sudah terdaftar.',
        });
    }

    if (error.code === '22P02' || error.code === '22003') {
        return res.status(400).json({
            message: 'Format data angka tidak valid.',
        });
    }

    console.error('Database error:', error.message);

    return res.status(500).json({
        message: 'Terjadi kesalahan pada server.',
    });
}

// GET /api/reports
// Mengambil semua laporan dengan filter opsional
async function getAllReports(req, res) {
    try {
        const {
            regency,
            district,
            village,
            category,
            status,
            search,
        } = req.query;

        const conditions = [];
        const values = [];

        // Filter kota/kabupaten
        if (regency && regency.trim()) {
            values.push(regency.trim());
            conditions.push(
                `LOWER(a.regency_name) = LOWER($${values.length})`
            );
        }

        // Filter kecamatan
        if (district && district.trim()) {
            values.push(district.trim());
            conditions.push(
                `LOWER(a.district_name) = LOWER($${values.length})`
            );
        }

        // Filter desa/kelurahan
        if (village && village.trim()) {
            values.push(village.trim());
            conditions.push(
                `LOWER(a.village_name) = LOWER($${values.length})`
            );
        }

        // Filter kategori
        if (category) {
            const categoryId = parseId(category);

            if (!categoryId) {
                return res.status(400).json({
                    message: 'ID kategori tidak valid.',
                });
            }

            values.push(categoryId);
            conditions.push(
                `r.category_id = $${values.length}`
            );
        }

        // Filter status
        if (status) {
            const statusId = parseId(status);

            if (!statusId) {
                return res.status(400).json({
                    message: 'ID status tidak valid.',
                });
            }

            values.push(statusId);
            conditions.push(
                `r.status_id = $${values.length}`
            );
        }

        // Pencarian judul, alamat, atau ID laporan
        if (search && search.trim()) {
            values.push(`%${search.trim()}%`);

            conditions.push(`
                (
                    r.title ILIKE $${values.length}
                    OR r.location ILIKE $${values.length}
                    OR CAST(r.report_id AS TEXT) ILIKE $${values.length}
                )
            `);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const result = await pool.query(
            `${BASE_SELECT}
             ${whereClause}
             ORDER BY r.created_at DESC`,
            values
        );

        const reports = result.rows;

        res.status(200).json({
            message: 'Berhasil mengambil data laporan',
            total: reports.length,
            reports,
            data: reports,
        });

    } catch (error) {
        handleDbError(res, error);
    }
}

// GET /api/reports/:id
// Mengambil detail laporan
async function getReportById(req, res) {
    const id = parseId(req.params.id);

    if (!id) {
        return res.status(400).json({
            message: 'ID laporan harus berupa angka positif.',
        });
    }

    try {
        const result = await pool.query(
            `${BASE_SELECT} WHERE r.report_id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: `Laporan dengan ID ${id} tidak ditemukan.`,
            });
        }

        res.status(200).json({
            message: 'Berhasil mengambil data laporan',
            data: result.rows[0],
        });

    } catch (error) {
        handleDbError(res, error);
    }
}

// GET /api/reports/search?title=...
// Mencari laporan berdasarkan judul
async function getReportsByTitle(req, res) {
    const title = (req.query.title || '').trim();

    if (!title) {
        return res.status(400).json({
            message: 'Parameter title wajib diisi.',
        });
    }

    try {
        const result = await pool.query(
            `${BASE_SELECT}
             WHERE r.title ILIKE $1
             ORDER BY r.report_id ASC`,
            [`%${title}%`]
        );

        res.status(200).json({
            message: 'Berhasil mencari laporan',
            total: result.rowCount,
            data: result.rows,
        });

    } catch (error) {
        handleDbError(res, error);
    }
}

// POST /api/reports
// Membuat laporan baru dengan user login dan status awal Menunggu
async function createReport(req, res) {
    const body = req.body || {};

    const missing = REQUIRED_FIELDS.filter(
        (field) =>
            body[field] === undefined ||
            body[field] === null ||
            String(body[field]).trim() === ''
    );

    if (missing.length > 0) {
        return res.status(400).json({
            message: 'Data wajib belum lengkap.',
            missing_fields: missing,
        });
    }

    const {
        category_id,
        area_id,
        title,
        description,
        location,
        latitude = null,
        longitude = null,
    } = body;

    // User ID diambil dari token login
    const user_id = req.user.user_id;

    // Status awal laporan: Menunggu (status_id = 1)
    const status_id = 1;

    try {
        const insert = await pool.query(
            `INSERT INTO reports (
                user_id,
                category_id,
                status_id,
                area_id,
                title,
                description,
                location,
                latitude,
                longitude
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING report_id`,
            [
                user_id,
                category_id,
                status_id,
                area_id,
                title,
                description,
                location,
                latitude,
                longitude,
            ]
        );

        const created = await pool.query(
            `${BASE_SELECT} WHERE r.report_id = $1`,
            [insert.rows[0].report_id]
        );

        res.status(201).json({
            message: 'Laporan berhasil dibuat',
            report: created.rows[0],
            data: created.rows[0],
        });

    } catch (error) {
        handleDbError(res, error);
    }
}

// PUT /api/reports/:id
// Memperbarui laporan
async function updateReport(req, res) {
    const id = parseId(req.params.id);

    if (!id) {
        return res.status(400).json({
            message: 'ID laporan harus berupa angka positif.',
        });
    }

    const body = req.body || {};

    const allowed = [
        ...REQUIRED_FIELDS,
        'latitude',
        'longitude',
    ];

    const fields = allowed.filter(
        (field) => body[field] !== undefined
    );

    if (fields.length === 0) {
        return res.status(400).json({
            message: 'Tidak ada data yang dikirim untuk diperbarui.',
        });
    }

    const emptyRequired = fields.filter(
        (field) =>
            REQUIRED_FIELDS.includes(field) &&
            (
                body[field] === null ||
                String(body[field]).trim() === ''
            )
    );

    if (emptyRequired.length > 0) {
        return res.status(400).json({
            message: 'Kolom wajib tidak boleh kosong.',
            empty_fields: emptyRequired,
        });
    }

    const setClause = fields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(', ');

    const values = fields.map((field) => body[field]);
    values.push(id);

    try {
        const update = await pool.query(
            `UPDATE reports
             SET ${setClause}
             WHERE report_id = $${values.length}
             RETURNING report_id`,
            values
        );

        if (update.rowCount === 0) {
            return res.status(404).json({
                message: `Laporan dengan ID ${id} tidak ditemukan.`,
            });
        }

        const updated = await pool.query(
            `${BASE_SELECT} WHERE r.report_id = $1`,
            [id]
        );

        res.status(200).json({
            message: 'Laporan berhasil diperbarui',
            data: updated.rows[0],
        });

    } catch (error) {
        handleDbError(res, error);
    }
}

// DELETE /api/reports/:id
// Menghapus laporan
async function deleteReport(req, res) {
    const id = parseId(req.params.id);

    if (!id) {
        return res.status(400).json({
            message: 'ID laporan harus berupa angka positif.',
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM reports
             WHERE report_id = $1
             RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: `Laporan dengan ID ${id} tidak ditemukan.`,
            });
        }

        res.status(200).json({
            message: 'Laporan berhasil dihapus',
            data: result.rows[0],
        });

    } catch (error) {
        handleDbError(res, error);
    }
}

async function uploadReportImages(req, res) {
    try {
        const reportId = req.params.id;
        const userId = req.user.user_id;

        // Memastikan laporan milik pengguna yang sedang login
        const reportCheck = await pool.query(
            'SELECT report_id FROM reports WHERE report_id = $1 AND user_id = $2',
            [reportId, userId]
        );

        if (reportCheck.rows.length === 0) {
            return res.status(404).json({
                message: 'Laporan tidak ditemukan atau bukan milik Anda',
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: 'Tidak ada foto yang diunggah',
            });
        }

        // Memeriksa jumlah foto yang sudah tersimpan
        const existingImages = await pool.query(
            'SELECT COUNT(*) FROM report_images WHERE report_id = $1',
            [reportId]
        );

        const existingCount = parseInt(existingImages.rows[0].count, 10);

        if (existingCount + req.files.length > 5) {
            return res.status(400).json({
                message: 'Maksimal 5 foto untuk setiap laporan',
            });
        }

        // Menyimpan informasi foto ke database
        const uploadedImages = [];

        for (const file of req.files) {
            const imageUrl = `/uploads/reports/${file.filename}`;

            const result = await pool.query(
                `INSERT INTO report_images (report_id, image_url)
                 VALUES ($1, $2)
                 RETURNING *`,
                [reportId, imageUrl]
            );

            uploadedImages.push(result.rows[0]);
        }

        res.status(201).json({
            message: 'Foto laporan berhasil diunggah',
            images: uploadedImages,
        });
    } catch (error) {
        console.error('Upload report images error:', error.message);

        res.status(500).json({
            message: 'Gagal mengunggah foto laporan',
        });
    }
}

// Ekspor seluruh fungsi controller
module.exports = {
    getAllReports,
    getReportById,
    getReportsByTitle,
    createReport,
    updateReport,
    deleteReport,
    uploadReportImages,
};