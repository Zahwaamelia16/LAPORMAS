
const express = require('express');

const adminController = require('../controllers/adminController');
const adminUserController = require('../controllers/adminUserController');

const {
    requireAuth,
    requireRole,
} = require('../middleware/auth');

const router = express.Router();

// Semua endpoint di file ini hanya untuk administrator
router.use(requireAuth, requireRole('admin'));

// Statistik dashboard
router.get('/summary', adminController.getSummary);
router.get('/report-trends', adminController.getReportTrends);

// Manajemen laporan
router.get('/reports', adminController.getReports);

// Manajemen pengguna
router.get('/users', adminUserController.getUsers);
router.patch('/users/:id', adminUserController.updateUser);
router.patch('/users/:id/status', adminUserController.setUserStatus);


// Verifikasi pengelola
router.get('/staff-requests', adminController.getStaffRequests);

router.patch(
    '/staff-requests/:id',
    adminController.decideStaffRequest
);

module.exports = router;

