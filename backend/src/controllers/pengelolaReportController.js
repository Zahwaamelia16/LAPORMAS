const pool = require('../config/db');

// Controller untuk pengelola (dan admin) menangani laporan:
//   GET   /api/reports/assigned        -> daftar laporan di wilayah tugas
//   GET   /api/reports/assigned/:id    -> detail laporan + riwayat penanganan
//   PATCH /api/reports/:id/status      -> ubah status + catatan penanganan
//
// Pengelola hanya bisa melihat & menangani laporan di area tugasnya.
// Admin bisa menangani laporan di semua wilayah.

const REPORT_SELECT = `
    SELECT
        r.report_id,
        'LPM-' || LPAD(r.report_id::text, 5, '0') AS report_code,
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

function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// Ambil area tugas pengelola yang sedang login.
// Hasil: { areaId } atau { error: { status, message } }
async function getTaskArea(user) {
    if (user.role === 'admin') {
        return { areaId: null }; // admin: semua wilayah
    }

    const result = await pool.query(`
        SELECT area_id, area_verification_status
        FROM user_profiles
        WHERE user_id = $1
    `, [user.user_id]);

    const profile = result.rows[0];

    if (!profile || !profile.area_id) {
        return { error: { status: 403, message: 'Akun pengelola belum memiliki area tugas. Hubungi admin.' } };
    }

    if (profile.area_verification_status !== 'terverifikasi') {
        return { error: { status: 403, message: 'Area tugas pengelola belum disetujui admin.' } };
    }

    return { areaId: profile.area_id };
}

// Ambil satu laporan beserta riwayat penanganannya
async function findReportWithUpdates(reportId) {
    const reportResult = await pool.query(`${REPORT_SELECT} WHERE r.report_id = $1`, [reportId]);
    const report = reportResult.rows[0];

    if (!report) return null;

    const updatesResult = await pool.query(`
        SELECT
            ru.update_id,
            old_s.status_name AS old_status,
            new_s.status_name AS new_status,
            ru.notes,
            ru.updated_at,
            ub.name AS updated_by_name
        FROM report_updates ru
        LEFT JOIN report_statuses old_s ON old_s.status_id = ru.old_status_id
        JOIN report_statuses new_s ON new_s.status_id = ru.new_status_id
        JOIN users ub ON ub.user_id = ru.updated_by
        WHERE ru.report_id = $1
        ORDER BY ru.updated_at DESC, ru.update_id DESC
    `, [reportId]);

    report.updates = updatesResult.rows;
    return report;
}

// GET /api/reports/assigned
// Query opsional: ?status_id=... &category_id=...
async function getAssignedReports(req, res) {
    try {
        const area = await getTaskArea(req.user);
        if (area.error) {
            return res.status(area.error.status).json({ message: area.error.message });
        }

        const conditions = [];
        const values = [];

        if (area.areaId) {
            values.push(area.areaId);
            conditions.push(`r.area_id = $${values.length}`);
        }

        const statusId = parseId(req.query.status_id);
        if (statusId) {
            values.push(statusId);
            conditions.push(`r.status_id = $${values.length}`);
        }

        const categoryId = parseId(req.query.category_id);
        if (categoryId) {
            values.push(categoryId);
            conditions.push(`r.category_id = $${values.length}`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `${REPORT_SELECT} ${where} ORDER BY r.created_at DESC, r.report_id DESC`,
            values
        );

        return res.status(200).json({
            message: 'Berhasil mengambil laporan wilayah tugas',
            total: result.rowCount,
            reports: result.rows,
        });
    } catch (error) {
        console.error('Gagal mengambil laporan wilayah tugas:', error.message);
        return res.status(500).json({ message: 'Gagal mengambil laporan wilayah tugas.' });
    }
}

// GET /api/reports/assigned/:id
async function getAssignedReportById(req, res) {
    const reportId = parseId(req.params.id);
    if (!reportId) {
        return res.status(400).json({ message: 'ID laporan harus berupa angka positif.' });
    }

    try {
        const area = await getTaskArea(req.user);
        if (area.error) {
            return res.status(area.error.status).json({ message: area.error.message });
        }

        const report = await findReportWithUpdates(reportId);

        if (!report) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
        }

        if (area.areaId && Number(report.area_id) !== Number(area.areaId)) {
            return res.status(403).json({ message: 'Laporan ini berada di luar wilayah tugasmu.' });
        }

        return res.status(200).json({ report });
    } catch (error) {
        console.error('Gagal mengambil detail laporan:', error.message);
        return res.status(500).json({ message: 'Gagal mengambil detail laporan.' });
    }
}

// PATCH /api/reports/:id/status
// Body: { status_name (atau status_id), notes }
async function updateReportStatus(req, res) {
    const reportId = parseId(req.params.id);
    if (!reportId) {
        return res.status(400).json({ message: 'ID laporan harus berupa angka positif.' });
    }

    const statusName = String(req.body?.status_name || '').trim();
    const statusIdInput = parseId(req.body?.status_id);
    const notes = String(req.body?.notes || '').trim();

    if (!statusName && !statusIdInput) {
        return res.status(400).json({ message: 'Pilih status terbaru laporan.' });
    }

    if (notes.length > 1000) {
        return res.status(400).json({ message: 'Catatan penanganan maksimal 1000 karakter.' });
    }

    const area = await getTaskArea(req.user).catch((error) => ({ error: { status: 500, message: error.message } }));
    if (area.error) {
        return res.status(area.error.status).json({ message: area.error.message });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Kunci baris laporan supaya tidak bentrok jika diubah bersamaan
        const current = await client.query(
            'SELECT report_id, status_id, area_id FROM reports WHERE report_id = $1 FOR UPDATE',
            [reportId]
        );

        if (!current.rows.length) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
        }

        const report = current.rows[0];

        if (area.areaId && Number(report.area_id) !== Number(area.areaId)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ message: 'Laporan ini berada di luar wilayah tugasmu.' });
        }

        const statusResult = statusIdInput
            ? await client.query('SELECT status_id, status_name FROM report_statuses WHERE status_id = $1', [statusIdInput])
            : await client.query('SELECT status_id, status_name FROM report_statuses WHERE LOWER(status_name) = LOWER($1)', [statusName]);

        const newStatus = statusResult.rows[0];

        if (!newStatus) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Status laporan tidak dikenal.' });
        }

        if (Number(newStatus.status_id) === Number(report.status_id) && !notes) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Status tidak berubah. Tambahkan catatan jika ingin mencatat perkembangan.' });
        }

        await client.query('UPDATE reports SET status_id = $1 WHERE report_id = $2', [newStatus.status_id, reportId]);

        await client.query(`
            INSERT INTO report_updates (report_id, updated_by, old_status_id, new_status_id, notes)
            VALUES ($1, $2, $3, $4, $5)
        `, [reportId, req.user.user_id, report.status_id, newStatus.status_id, notes || null]);

        await client.query('COMMIT');

        const updated = await findReportWithUpdates(reportId);

        return res.status(200).json({
            message: `Status laporan diperbarui menjadi ${newStatus.status_name}.`,
            report: updated,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Gagal memperbarui status laporan:', error.message);
        return res.status(500).json({ message: 'Gagal memperbarui status laporan.' });
    } finally {
        client.release();
    }
}

module.exports = {
    getAssignedReports,
    getAssignedReportById,
    updateReportStatus,
};
