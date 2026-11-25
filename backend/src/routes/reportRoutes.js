const express = require('express');
const reportController = require('../controllers/reportController');
const pengelolaReportController = require('../controllers/pengelolaReportController');
const wargaReportController = require('../controllers/wargaReportController');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Upload foto laporan (field "images", maks. 3 foto) dengan pesan error yang jelas
function uploadReportPhotos(req, res, next) {
    upload.array('images', 3)(req, res, (error) => {
        if (!error) return next();
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'Ukuran setiap foto maksimal 5 MB.'
            : error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT'
                ? 'Maksimal 3 foto dalam satu laporan.'
                : error.message || 'Gagal mengunggah foto.';
        return res.status(400).json({ message });
    });
}

// Catatan: route /search harus ditulis SEBELUM /:id
// agar kata "search" tidak dianggap sebagai ID.
router.get('/', reportController.getAllReports);               // GET semua data
router.get('/search', reportController.getReportsByTitle);    // GET berdasarkan judul (?title=...)

// Warga: laporan saya & lacak laporan (SEBELUM /:id)
router.get('/mine', requireAuth, wargaReportController.getMyReports);
router.get('/track/:code', wargaReportController.trackReport);

// Pengelola (dan admin): laporan di wilayah tugas.
// Harus ditulis SEBELUM /:id agar "assigned" tidak dianggap sebagai ID.
router.get('/assigned', requireAuth, requireRole('pengelola', 'admin'), pengelolaReportController.getAssignedReports);
router.get('/assigned/:id', requireAuth, requireRole('pengelola', 'admin'), pengelolaReportController.getAssignedReportById);
router.patch('/:id/status', requireAuth, requireRole('pengelola', 'admin'), pengelolaReportController.updateReportStatus);

router.get('/:id', reportController.getReportById);           // GET berdasarkan ID

// Route yang memerlukan login
router.post('/', requireAuth, uploadReportPhotos, wargaReportController.createWargaReport); // Kirim laporan baru (+ foto)
router.post(
    '/:id/images',
    requireAuth,
    upload.array('photos', 5),
    reportController.uploadReportImages
);   // POST data baru
router.put('/:id', requireAuth, reportController.updateReport);  // PUT perbarui data
router.delete('/:id', requireAuth, reportController.deleteReport); // DELETE hapus data

module.exports = router;