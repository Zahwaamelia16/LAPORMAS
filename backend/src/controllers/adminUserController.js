
const pool = require('../config/db');

// Mengambil seluruh akun pengguna.
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        p.phone,
        p.address,
        p.area_id,
        p.area_verification_status,
        a.village_name,
        a.district_name,
        a.regency_name
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.user_id
      LEFT JOIN areas a ON a.area_id = p.area_id
      ORDER BY u.created_at DESC
    `);

    return res.json({
      message: 'Data pengguna berhasil dimuat.',
      total: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error('Gagal mengambil data pengguna:', error);
    return res.status(500).json({
      message: 'Gagal mengambil data pengguna.',
    });
  }
};

// Mengubah informasi dasar akun.
exports.updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  const { name, email, phone, address } = req.body;

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'ID pengguna tidak valid.' });
  }

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof email !== 'string' ||
    !email.trim()
  ) {
    return res.status(400).json({
      message: 'Nama dan email wajib diisi.',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      message: 'Format email tidak valid.',
    });
  }

  if (
    (phone != null && typeof phone !== 'string') ||
    (address != null && typeof address !== 'string')
  ) {
    return res.status(400).json({
      message: 'Format nomor telepon atau alamat tidak valid.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT user_id FROM users WHERE user_id = $1 FOR UPDATE',
      [userId]
    );

    if (existing.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: 'Pengguna tidak ditemukan.',
      });
    }

    const duplicate = await client.query(
      `SELECT user_id FROM users
       WHERE LOWER(email) = LOWER($1) AND user_id <> $2`,
      [normalizedEmail, userId]
    );

    if (duplicate.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: 'Email sudah digunakan oleh akun lain.',
      });
    }

    await client.query(
      `UPDATE users
       SET name = $1, email = $2
       WHERE user_id = $3`,
      [name.trim(), normalizedEmail, userId]
    );

    await client.query(
      `INSERT INTO user_profiles (user_id, phone, address)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET
         phone = EXCLUDED.phone,
         address = EXCLUDED.address`,
      [
        userId,
        phone?.trim() || null,
        address?.trim() || null,
      ]
    );

    await client.query('COMMIT');

    return res.json({
      message: 'Data pengguna berhasil diperbarui.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Gagal memperbarui pengguna:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Email sudah digunakan oleh akun lain.',
      });
    }

    return res.status(500).json({
      message: 'Gagal memperbarui data pengguna.',
    });
  } finally {
    client.release();
  }
};

// Mengaktifkan atau menonaktifkan akun tanpa menghapus datanya.
exports.setUserStatus = async (req, res) => {
  const userId = Number(req.params.id);
  const { is_active } = req.body;
  const currentAdminId = Number(req.user?.user_id || req.user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: 'ID pengguna tidak valid.' });
  }

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({
      message: 'Status akun tidak valid.',
    });
  }

  if (!is_active && currentAdminId === userId) {
    return res.status(400).json({
      message: 'Admin tidak dapat menonaktifkan akunnya sendiri.',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `SELECT user_id, role, is_active
       FROM users
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        message: 'Pengguna tidak ditemukan.',
      });
    }

    const targetUser = result.rows[0];

    if (
      targetUser.role === 'admin' &&
      targetUser.is_active &&
      !is_active
    ) {
      const adminCount = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM users
         WHERE role = 'admin' AND is_active = TRUE`
      );

      if (adminCount.rows[0].total <= 1) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          message: 'Admin terakhir tidak dapat dinonaktifkan.',
        });
      }
    }

    await client.query(
      'UPDATE users SET is_active = $1 WHERE user_id = $2',
      [is_active, userId]
    );

    await client.query('COMMIT');

    return res.json({
      message: is_active
        ? 'Akun berhasil diaktifkan kembali.'
        : 'Akun berhasil dinonaktifkan.',
      is_active,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Gagal mengubah status pengguna:', error);

    return res.status(500).json({
      message: 'Gagal mengubah status akun pengguna.',
    });
  } finally {
    client.release();
  }
};
