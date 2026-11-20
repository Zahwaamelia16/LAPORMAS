const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { createToken } = require('../middleware/auth');

// Frontend memakai nama role 'petugas', database memakai 'pengelola'
function normalizeRole(role) {
    return role === 'petugas' ? 'pengelola' : role;
}

// Data akun lengkap (users + user_profiles + areas) dengan nama field
// yang sesuai kebutuhan frontend.
async function findUserProfile(whereSql, params) {
    const result = await pool.query(`
        SELECT
            u.user_id,
            u.name,
            u.email,
            u.password_hash,
            u.role,
            u.created_at,
            p.phone,
            p.address,
            p.area_id,
            p.area_verification_status,
            COALESCE(a.village_name, p.village_name) AS village_name,
            a.district_name,
            a.regency_name
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.user_id
        LEFT JOIN areas a ON a.area_id = p.area_id
        WHERE ${whereSql}
        LIMIT 1
    `, params);

    return result.rows[0] || null;
}

// Hapus password_hash dan tambahkan field khusus per role
function toPublicUser(row) {
    const { password_hash, ...user } = row;

    user.citizen_phone = user.phone;

    if (user.role === 'warga') {
        user.citizen_area_id = user.area_id;
    }

    if (user.role === 'pengelola') {
        user.task_area_id = user.area_id;
        user.task_village = user.village_name;
        user.task_district = user.district_name;
    }

    return user;
}

// POST /api/auth/login
// Body: { identifier (email / no. telepon), password, role }
async function login(req, res) {
    const identifier = String(req.body?.identifier || '').trim();
    const password = String(req.body?.password || '');
    const role = normalizeRole(req.body?.role || 'warga');

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Masukkan email/nomor telepon dan kata sandi.' });
    }

    try {
        const user = await findUserProfile(
            `(LOWER(u.email) = LOWER($1) OR REPLACE(p.phone, ' ', '') = REPLACE($1, ' ', ''))`,
            [identifier]
        );

        const passwordOk = user && await bcrypt.compare(password, user.password_hash);

        if (!passwordOk) {
            return res.status(401).json({ message: 'Email atau kata sandi belum sesuai.' });
        }

        if (user.role !== role) {
            const label = user.role === 'pengelola' ? 'Pengelola' : user.role === 'admin' ? 'Admin' : 'Warga';
            return res.status(403).json({ message: `Akun ini terdaftar sebagai ${label}. Pilih jenis akun yang sesuai.` });
        }

        if (user.role === 'pengelola' && user.area_verification_status !== 'terverifikasi') {
            return res.status(403).json({ message: 'Akun pengelola belum disetujui admin.' });
        }

        return res.status(200).json({
            message: 'Berhasil masuk',
            token: createToken(user),
            user: toPublicUser(user),
        });
    } catch (error) {
        console.error('Gagal login:', error.message);
        return res.status(500).json({ message: 'Terjadi kesalahan saat masuk.' });
    }
}

// GET /api/auth/me  (wajib login)
async function me(req, res) {
    try {
        const user = await findUserProfile('u.user_id = $1', [req.user.user_id]);

        if (!user) {
            return res.status(401).json({ message: 'Akun tidak ditemukan. Silakan masuk kembali.' });
        }

        return res.status(200).json({ user: toPublicUser(user) });
    } catch (error) {
        console.error('Gagal mengambil akun:', error.message);
        return res.status(500).json({ message: 'Gagal mengambil data akun.' });
    }
}

// POST /api/auth/register/warga
// Body: { name, email, phone, address, password, latitude?, longitude? }
async function registerWarga(req, res) {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const address = String(req.body?.address || '').trim();
    const password = String(req.body?.password || '');

    if (!name || !email || !phone || !address || !password) {
        return res.status(400).json({ message: 'Lengkapi nama, email, nomor telepon, alamat, dan kata sandi.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Format email belum benar.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Kata sandi minimal 8 karakter.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const passwordHash = await bcrypt.hash(password, 10);

        const userResult = await client.query(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, 'warga')
            RETURNING user_id
        `, [name, email, passwordHash]);

        await client.query(`
            INSERT INTO user_profiles (user_id, phone, address)
            VALUES ($1, $2, $3)
        `, [userResult.rows[0].user_id, phone, address]);

        await client.query('COMMIT');

        return res.status(201).json({ message: 'Akun warga berhasil dibuat. Silakan masuk.' });
    } catch (error) {
        await client.query('ROLLBACK');

        if (error.code === '23505') {
            return res.status(409).json({ message: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.' });
        }

        console.error('Gagal mendaftar warga:', error.message);
        return res.status(500).json({ message: 'Gagal membuat akun warga.' });
    } finally {
        client.release();
    }
}

module.exports = {
    login,
    me,
    registerWarga,
};
