const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', authController.login);                    // Masuk (warga / pengelola / admin)
router.get('/me', requireAuth, authController.me);              // Data akun yang sedang login
router.patch('/me', requireAuth, authController.updateMe);      // Perbarui profil
router.patch('/me/password', requireAuth, authController.changePassword); // Ganti kata sandi
router.post('/register/warga', authController.registerWarga);   // Daftar akun warga

module.exports = router;
