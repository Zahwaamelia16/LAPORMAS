
const pool = require('../config/db');

// GET /api/areas
async function getAreas(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                area_id,
                village_name,
                district_name,
                regency_name
            FROM areas
            ORDER BY regency_name, district_name, village_name
        `);

        res.status(200).json({
            message: 'Berhasil mengambil data wilayah',
            areas: result.rows,
        });
    } catch (error) {
        console.error('Gagal mengambil wilayah:', error.message);
        res.status(500).json({
            message: 'Gagal mengambil data wilayah',
        });
    }
}

// GET /api/categories
async function getCategories(req, res) {
    try {
        const result = await pool.query(`
            SELECT category_id, category_name, description
            FROM report_categories
            ORDER BY category_id
        `);

        res.status(200).json({
            message: 'Berhasil mengambil kategori laporan',
            categories: result.rows,
        });
    } catch (error) {
        console.error('Gagal mengambil kategori:', error.message);
        res.status(500).json({
            message: 'Gagal mengambil kategori laporan',
        });
    }
}

// GET /api/statuses
async function getStatuses(req, res) {
    try {
        const result = await pool.query(`
            SELECT status_id, status_name, description
            FROM report_statuses
            ORDER BY status_id
        `);

        res.status(200).json({
            message: 'Berhasil mengambil status laporan',
            statuses: result.rows,
        });
    } catch (error) {
        console.error('Gagal mengambil status:', error.message);
        res.status(500).json({
            message: 'Gagal mengambil status laporan',
        });
    }
}

module.exports = {
    getAreas,
    getCategories,
    getStatuses,
};
