const express = require('express');
const authController = require('../controllers/authController');
const uploadStaffProof = require('../middleware/uploadStaffProof');
const { requireAuth } = require('../middleware/auth');
const locationController = require('../controllers/locationController');

const router = express.Router();

router.post('/login', authController.login);                    // Masuk (warga / pengelola / admin)
router.get('/me', requireAuth, authController.me);              // Data akun yang sedang login
router.patch('/me', requireAuth, authController.updateMe);      // Perbarui profil
router.patch('/me/password', requireAuth, authController.changePassword); // Ganti kata sandi
router.post('/register/warga', authController.registerWarga);   // Daftar akun warga
router.post(
    '/register/petugas',
    uploadStaffProof.single('proof'),
    authController.registerPetugas
);
router.post(
    '/reverse-geocode',
    locationController.reverseGeocode
);

module.exports = router;
