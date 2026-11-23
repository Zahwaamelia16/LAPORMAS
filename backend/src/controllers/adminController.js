
const pool = require('../config/db');

// GET /api/admin/summary
// Statistik keseluruhan LAPORMAS
async function getSummary(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM reports)::int AS total,

                (
                    SELECT COUNT(*)
                    FROM reports r
                    JOIN report_statuses s
                        ON s.status_id = r.status_id
                    WHERE LOWER(TRIM(s.status_name))
                        IN ('menunggu', 'diverifikasi', 'diterima')
                )::int AS received,

                (
                    SELECT COUNT(*)
                    FROM reports r
                    JOIN report_statuses s
                        ON s.status_id = r.status_id
                    WHERE LOWER(TRIM(s.status_name)) = 'diproses'
                )::int AS processing,

                (
                    SELECT COUNT(*)
                    FROM reports r
                    JOIN report_statuses s
                        ON s.status_id = r.status_id
                    WHERE LOWER(TRIM(s.status_name)) = 'selesai'
                )::int AS completed,

                (
                    SELECT COUNT(*)
                    FROM staff_requests
                    WHERE status = 'pending'
                )::int AS pending_staff,

                (
                    SELECT COUNT(*)
                    FROM users
                    WHERE role = 'warga'
                )::int AS citizens
        `);

        return res.status(200).json({
            message: 'Berhasil mengambil ringkasan administrator.',
            summary: result.rows[0],
        });

    } catch (error) {
        console.error('Admin summary error:', error.message);

        return res.status(500).json({
            message: 'Gagal mengambil statistik administrator.',
        });
    }
}


// GET /api/admin/reports
// Seluruh laporan dari semua wilayah
async function getReports(req, res) {
    try {
        const result = await pool.query(`
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
            JOIN users u
                ON u.user_id = r.user_id
            JOIN report_categories c
                ON c.category_id = r.category_id
            JOIN report_statuses s
                ON s.status_id = r.status_id
            JOIN areas a
                ON a.area_id = r.area_id

            ORDER BY r.created_at DESC
        `);

        return res.status(200).json({
            message: 'Berhasil mengambil seluruh laporan.',
            total: result.rowCount,
            reports: result.rows,
        });

    } catch (error) {
        console.error('Admin reports error:', error.message);

        return res.status(500).json({
            message: 'Gagal mengambil seluruh laporan.',
        });
    }
}


// GET /api/admin/users
// Daftar semua akun tanpa password_hash
async function getUsers(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                u.user_id,
                u.name,
                u.email,
                u.role,
                u.created_at,
                p.phone,
                p.address,
                p.area_id,
                p.area_verification_status,
                a.village_name,
                a.district_name,
                a.regency_name

            FROM users u

            LEFT JOIN user_profiles p
                ON p.user_id = u.user_id

            LEFT JOIN areas a
                ON a.area_id = p.area_id

            ORDER BY u.created_at DESC
        `);

        return res.status(200).json({
            message: 'Berhasil mengambil data pengguna.',
            total: result.rowCount,
            users: result.rows,
        });

    } catch (error) {
        console.error('Admin users error:', error.message);

        return res.status(500).json({
            message: 'Gagal mengambil data pengguna.',
        });
    }
}


// GET /api/admin/staff-requests
// Daftar pengajuan pengelola
async function getStaffRequests(req, res) {
    const status = String(req.query.status || 'pending').toLowerCase();

    const allowedStatuses = [
        'pending',
        'approved',
        'rejected',
        'semua',
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: 'Filter status pengajuan tidak valid.',
        });
    }

    try {
        const values = [];
        let whereClause = '';

        if (status !== 'semua') {
            values.push(status);
            whereClause = 'WHERE sr.status = $1';
        }

        const result = await pool.query(`
            SELECT
                sr.request_id,
                sr.user_id,
                u.name,
                u.email,
                p.phone,
                sr.agency,
                sr.unit_name,
                sr.office_address,
                sr.area_id,
                a.village_name,
                a.district_name,
                a.regency_name,
                sr.proof_url,
                sr.status,
                sr.admin_note,
                sr.reviewed_by,
                sr.created_at,
                sr.reviewed_at

            FROM staff_requests sr

            JOIN users u
                ON u.user_id = sr.user_id

            LEFT JOIN user_profiles p
                ON p.user_id = sr.user_id

            JOIN areas a
                ON a.area_id = sr.area_id

            ${whereClause}

            ORDER BY sr.created_at DESC
        `, values);

        return res.status(200).json({
            message: 'Berhasil mengambil data pengajuan pengelola.',
            total: result.rowCount,
            requests: result.rows,
        });

    } catch (error) {
        console.error('Admin staff requests error:', error.message);

        return res.status(500).json({
            message: 'Gagal mengambil pengajuan pengelola.',
        });
    }
}


// PATCH /api/admin/staff-requests/:id
// Menyetujui atau menolak pengajuan pengelola
async function decideStaffRequest(req, res) {
    const requestId = Number(req.params.id);
    const decision = String(req.body?.decision || '').toLowerCase();

    const note = String(req.body?.admin_note || '').trim();

    if (!Number.isSafeInteger(requestId) || requestId <= 0) {
        return res.status(400).json({
            message: 'ID pengajuan tidak valid.',
        });
    }

    if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({
            message: 'Keputusan harus approved atau rejected.',
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Kunci data selama proses verifikasi
        const check = await client.query(`
            SELECT
                sr.request_id,
                sr.user_id,
                sr.status

            FROM staff_requests sr

            JOIN users u
                ON u.user_id = sr.user_id

            JOIN user_profiles p
                ON p.user_id = sr.user_id

            WHERE sr.request_id = $1

            FOR UPDATE OF sr, u, p
        `, [requestId]);

        if (check.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                message: 'Pengajuan pengelola tidak ditemukan.',
            });
        }

        const request = check.rows[0];

        if (request.status !== 'pending') {
            await client.query('ROLLBACK');

            return res.status(409).json({
                message: 'Pengajuan ini sudah pernah diproses.',
            });
        }

        const profileStatus =
            decision === 'approved'
                ? 'terverifikasi'
                : 'ditolak';

        const finalNote = note || (
            decision === 'approved'
                ? 'Bukti penugasan telah diverifikasi.'
                : 'Pengajuan belum memenuhi persyaratan.'
        );

        // Update status pengajuan
        await client.query(`
            UPDATE staff_requests
            SET
                status = $1,
                admin_note = $2,
                reviewed_by = $3,
                reviewed_at = NOW()
            WHERE request_id = $4
        `, [
            decision,
            finalNote,
            req.user.user_id,
            requestId,
        ]);

        // Update status verifikasi profil pengelola
        await client.query(`
            UPDATE user_profiles
            SET area_verification_status = $1
            WHERE user_id = $2
        `, [
            profileStatus,
            request.user_id,
        ]);

        await client.query('COMMIT');

        return res.status(200).json({
            message: decision === 'approved'
                ? 'Pengajuan pengelola berhasil disetujui.'
                : 'Pengajuan pengelola berhasil ditolak.',
            request_id: requestId,
            status: decision,
        });

    } catch (error) {
        await client.query('ROLLBACK');

        console.error('Admin decision error:', error.message);

        return res.status(500).json({
            message: 'Gagal memproses pengajuan pengelola.',
        });

    } finally {
        client.release();
    }
}


// GET /api/admin/report-trends?period=week|month|year
// Grafik tren jumlah laporan berdasarkan periode
async function getReportTrends(req, res) {
    const period = String(req.query.period || 'month').toLowerCase();

    const allowedPeriods = ['week', 'month', 'year'];

    if (!allowedPeriods.includes(period)) {
        return res.status(400).json({
            message: 'Periode grafik tidak valid.'
        });
    }

    try {
        const result = await pool.query(`
            WITH bounds AS (
                SELECT
                    CASE
                        WHEN $1 = 'year' THEN
                            date_trunc(
                                'month',
                                NOW() AT TIME ZONE 'Asia/Jakarta'
                            ) - INTERVAL '11 months'

                        WHEN $1 = 'month' THEN
                            (
                                (NOW() AT TIME ZONE 'Asia/Jakarta')::date
                                - 29
                            )::timestamp

                        ELSE
                            (
                                (NOW() AT TIME ZONE 'Asia/Jakarta')::date
                                - 6
                            )::timestamp
                    END AS start_at,

                    CASE
                        WHEN $1 = 'year' THEN
                            date_trunc(
                                'month',
                                NOW() AT TIME ZONE 'Asia/Jakarta'
                            ) + INTERVAL '1 month'

                        ELSE
                            (
                                (NOW() AT TIME ZONE 'Asia/Jakarta')::date
                                + 1
                            )::timestamp
                    END AS end_at
            ),

            calendar AS (
                SELECT
                    generate_series(
                        b.start_at,
                        b.end_at -
                            CASE
                                WHEN $1 = 'year'
                                THEN INTERVAL '1 month'
                                ELSE INTERVAL '1 day'
                            END,
                        CASE
                            WHEN $1 = 'year'
                            THEN INTERVAL '1 month'
                            ELSE INTERVAL '1 day'
                        END
                    )::date AS bucket

                FROM bounds b
            ),

            report_counts AS (
                SELECT
                    CASE
                        WHEN $1 = 'year' THEN
                            date_trunc(
                                'month',
                                r.created_at AT TIME ZONE 'Asia/Jakarta'
                            )::date

                        ELSE
                            (
                                r.created_at AT TIME ZONE 'Asia/Jakarta'
                            )::date
                    END AS bucket,

                    COUNT(*)::int AS total

                FROM reports r
                CROSS JOIN bounds b

                WHERE r.created_at >=
                    (b.start_at AT TIME ZONE 'Asia/Jakarta')

                  AND r.created_at <
                    (b.end_at AT TIME ZONE 'Asia/Jakarta')

                GROUP BY 1
            )

            SELECT
                c.bucket::text AS date,

                CASE
                    WHEN $1 = 'year' THEN
                        (
                            ARRAY[
                                'Jan', 'Feb', 'Mar', 'Apr',
                                'Mei', 'Jun', 'Jul', 'Agu',
                                'Sep', 'Okt', 'Nov', 'Des'
                            ]
                        )[EXTRACT(MONTH FROM c.bucket)::int]
                        || ' ' || TO_CHAR(c.bucket, 'YYYY')

                    ELSE
                        TO_CHAR(c.bucket, 'DD')
                        || ' ' ||
                        (
                            ARRAY[
                                'Jan', 'Feb', 'Mar', 'Apr',
                                'Mei', 'Jun', 'Jul', 'Agu',
                                'Sep', 'Okt', 'Nov', 'Des'
                            ]
                        )[EXTRACT(MONTH FROM c.bucket)::int]
                END AS label,

                COALESCE(rc.total, 0)::int AS total

            FROM calendar c

            LEFT JOIN report_counts rc
                ON rc.bucket = c.bucket

            ORDER BY c.bucket ASC
        `, [period]);

        return res.status(200).json({
            message: 'Berhasil mengambil tren laporan.',
            period,
            trend: result.rows
        });

    } catch (error) {
        console.error('Admin report trends error:', error.message);

        return res.status(500).json({
            message: 'Gagal mengambil tren laporan.'
        });
    }
}

module.exports = {
    getSummary,
    getReports,
    getUsers,
    getStaffRequests,
    decideStaffRequest,
    getReportTrends,
};
