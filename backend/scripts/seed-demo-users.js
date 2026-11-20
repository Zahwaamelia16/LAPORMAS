// Membuat 3 akun contoh yang BISA dipakai login:
//   warga@lapormas.id, pengelola@lapormas.id, admin@lapormas.id
// Kata sandi semua akun: lapormas123
//
// Jalankan dari folder backend:  npm run seed-users
// Aman dijalankan berulang kali (akun yang sudah ada hanya diperbarui).

const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const PASSWORD = 'lapormas123';

const accounts = [
    { name: 'Warga LAPORMAS', email: 'warga@lapormas.id', role: 'warga', phone: '081234567890', address: 'Jl. Ketintang, Surabaya', village: 'Ketintang' },
    { name: 'Pengelola Ketintang', email: 'pengelola@lapormas.id', role: 'pengelola', phone: '081298765432', address: 'Kantor Kelurahan Ketintang', village: 'Ketintang' },
    { name: 'Admin LAPORMAS', email: 'admin@lapormas.id', role: 'admin', phone: null, address: null, village: null },
];

async function seed() {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    for (const account of accounts) {
        const existing = await pool.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [account.email]);

        let userId;
        if (existing.rows.length) {
            userId = existing.rows[0].user_id;
            await pool.query(
                'UPDATE users SET name = $1, password_hash = $2, role = $3 WHERE user_id = $4',
                [account.name, passwordHash, account.role, userId]
            );
        } else {
            const inserted = await pool.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id',
                [account.name, account.email, passwordHash, account.role]
            );
            userId = inserted.rows[0].user_id;
        }

        let areaId = null;
        if (account.village) {
            const area = await pool.query('SELECT area_id FROM areas WHERE village_name = $1 LIMIT 1', [account.village]);
            areaId = area.rows[0]?.area_id || null;
        }

        await pool.query(`
            INSERT INTO user_profiles (user_id, phone, address, area_id, area_verification_status)
            VALUES ($1, $2, $3, $4, 'terverifikasi')
            ON CONFLICT (user_id) DO UPDATE SET
                phone = EXCLUDED.phone,
                address = EXCLUDED.address,
                area_id = EXCLUDED.area_id,
                area_verification_status = 'terverifikasi'
        `, [userId, account.phone, account.address, areaId]);

        console.log(`✓ ${account.role.padEnd(9)} ${account.email}`);
    }

    console.log(`\nSelesai. Kata sandi semua akun: ${PASSWORD}`);
}

seed()
    .catch((error) => {
        console.error('Gagal membuat akun contoh:', error.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
