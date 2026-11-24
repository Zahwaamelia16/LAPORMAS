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
            u.is_active,
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

        if (!user) {
        return res.status(401).json({
            message: 'Email atau password salah.',
        });
        }

        // CEK STATUS AKUN
        if (user.is_active === false) {
        return res.status(403).json({
            message: 'Akun Anda sedang dinonaktifkan. Silakan hubungi administrator.',
        });
        }

        // CEK PASSWORD
        const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
        );

        if (!isPasswordValid) {
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


// PATCH /api/auth/me  (wajib login)
// Body: { name, phone, address, area_id? }
// area_id hanya bisa diubah oleh warga (area tugas pengelola diatur admin).
async function updateMe(req, res) {
    const name = String(req.body?.name || '').trim();
    // undefined = field tidak dikirim, nilai lama dipertahankan
    const phone = req.body?.phone === undefined ? undefined : String(req.body.phone || '').trim();
    const address = req.body?.address === undefined ? undefined : String(req.body.address || '').trim();
    const rawAreaId = req.body?.area_id;

    if (!name) {
        return res.status(400).json({ message: 'Nama lengkap wajib diisi.' });
    }

    if (name.length > 150) {
        return res.status(400).json({ message: 'Nama lengkap maksimal 150 karakter.' });
    }

    if (phone && !/^[0-9+\s-]{8,20}$/.test(phone)) {
        return res.status(400).json({ message: 'Nomor telepon hanya boleh berisi angka, spasi, +, atau - (8-20 karakter).' });
    }

    let areaId;
    if (req.user.role === 'warga' && rawAreaId !== undefined) {
        if (rawAreaId === null || rawAreaId === '') {
            areaId = null;
        } else {
            areaId = Number(rawAreaId);
            if (!Number.isInteger(areaId) || areaId <= 0) {
                return res.status(400).json({ message: 'Area tempat tinggal tidak valid.' });
            }
        }
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        if (areaId) {
            const area = await client.query('SELECT village_name FROM areas WHERE area_id = $1', [areaId]);
            if (!area.rows.length) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'Area tempat tinggal tidak ditemukan.' });
            }
        }

        await client.query('UPDATE users SET name = $1 WHERE user_id = $2', [name, req.user.user_id]);

        // Buat baris profil jika belum ada, lalu perbarui
        await client.query(`
            INSERT INTO user_profiles (user_id, phone, address)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id) DO UPDATE SET
                phone = CASE WHEN $4 THEN EXCLUDED.phone ELSE user_profiles.phone END,
                address = CASE WHEN $5 THEN EXCLUDED.address ELSE user_profiles.address END
        `, [req.user.user_id, phone || null, address || null, phone !== undefined, address !== undefined]);

        if (areaId !== undefined) {
            await client.query(`
                UPDATE user_profiles
                SET area_id = $1,
                    village_name = (SELECT village_name FROM areas WHERE area_id = $1)
                WHERE user_id = $2
            `, [areaId, req.user.user_id]);
        }

        await client.query('COMMIT');

        const user = await findUserProfile('u.user_id = $1', [req.user.user_id]);

        return res.status(200).json({
            message: 'Profil berhasil diperbarui.',
            user: toPublicUser(user),
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Gagal memperbarui profil:', error.message);
        return res.status(500).json({ message: 'Gagal memperbarui profil.' });
    } finally {
        client.release();
    }
}

// PATCH /api/auth/me/password  (wajib login)
// Body: { current_password, new_password }
async function changePassword(req, res) {
    const currentPassword = String(req.body?.current_password || '');
    const newPassword = String(req.body?.new_password || '');

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Isi kata sandi lama dan kata sandi baru.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Kata sandi baru minimal 8 karakter.' });
    }

    if (newPassword === currentPassword) {
        return res.status(400).json({ message: 'Kata sandi baru harus berbeda dari kata sandi lama.' });
    }

    try {
        const result = await pool.query('SELECT password_hash FROM users WHERE user_id = $1', [req.user.user_id]);
        const row = result.rows[0];

        if (!row || !(await bcrypt.compare(currentPassword, row.password_hash))) {
            return res.status(400).json({ message: 'Kata sandi lama belum sesuai.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [passwordHash, req.user.user_id]);

        return res.status(200).json({ message: 'Kata sandi berhasil diganti.' });
    } catch (error) {
        console.error('Gagal mengganti kata sandi:', error.message);
        return res.status(500).json({ message: 'Gagal mengganti kata sandi.' });
    }
}

module.exports = {
    login,
    me,
    registerWarga,
    updateMe,
    changePassword,
};
