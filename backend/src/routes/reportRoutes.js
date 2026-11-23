const express = require('express');
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Catatan: route /search harus ditulis SEBELUM /:id
// agar kata "search" tidak dianggap sebagai ID.
router.get('/', reportController.getAllReports);               // GET semua data
router.get('/search', reportController.getReportsByTitle);    // GET berdasarkan judul (?title=...)
router.get('/:id', reportController.getReportById);           // GET berdasarkan ID

// Route yang memerlukan login
router.post('/', requireAuth, reportController.createReport); 
router.post(
    '/:id/images',
    requireAuth,
    upload.array('photos', 5),
    reportController.uploadReportImages
);   // POST data baru
router.put('/:id', requireAuth, reportController.updateReport);  // PUT perbarui data
router.delete('/:id', requireAuth, reportController.deleteReport); // DELETE hapus data

module.exports = router;