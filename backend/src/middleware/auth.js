const jwt = require('jsonwebtoken');

// Kunci rahasia untuk token login. Isi JWT_SECRET di .env.
// Nilai cadangan di bawah hanya untuk pengembangan di laptop.
const JWT_SECRET = process.env.JWT_SECRET || 'lapormas-dev-secret-ganti-di-env';

if (!process.env.JWT_SECRET) {
    console.warn('Peringatan: JWT_SECRET belum diisi di .env, memakai kunci bawaan untuk pengembangan.');
}

// Membuat token setelah login berhasil (berlaku 7 hari)
function createToken(user) {
    return jwt.sign(
        { user_id: user.user_id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Middleware: wajib login (header Authorization: Bearer <token>)
function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Silakan masuk terlebih dahulu.' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = { user_id: payload.user_id, role: payload.role };
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Sesi berakhir. Silakan masuk kembali.' });
    }
}

// Middleware: hanya role tertentu, contoh requireRole('admin')
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Kamu tidak memiliki akses ke fitur ini.' });
        }
        return next();
    };
}

module.exports = {
    createToken,
    requireAuth,
    requireRole,
};
