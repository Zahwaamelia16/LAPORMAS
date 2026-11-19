
const pool = require('../config/db');

// GET /api/stats
async function getStats(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM reports)::int AS total,

                (
                    SELECT COUNT(*)
                    FROM reports r
                    JOIN report_statuses s
                        ON s.status_id = r.status_id
                    WHERE LOWER(s.status_name) = 'selesai'
                )::int AS completed,

                (SELECT COUNT(*) FROM areas)::int AS areas
        `);

        const total = Number(result.rows[0].total);
        const completed = Number(result.rows[0].completed);
        const areas = Number(result.rows[0].areas);

        const rate = total > 0
            ? Math.round((completed / total) * 100)
            : 0;

        res.status(200).json({
            message: 'Berhasil mengambil statistik LAPORMAS',
            stats: {
                total,
                completed,
                rate,
                areas,
            },
        });
    } catch (error) {
        console.error('Gagal mengambil statistik:', error.message);

        res.status(500).json({
            message: 'Gagal mengambil statistik LAPORMAS',
        });
    }
}

module.exports = { getStats };
