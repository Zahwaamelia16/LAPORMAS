
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const uploadDir = path.resolve(__dirname, '../../uploads/staff-proofs');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

        cb(null, uniqueName);
    },
});

const allowedTypes = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
};

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = allowedTypes[file.mimetype] || [];

    if (allowedExtensions.includes(extension)) {
        return cb(null, true);
    }

    return cb(new Error('Format surat tugas harus PDF, JPG, atau PNG'));
};

const uploadStaffProof = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
});

module.exports = uploadStaffProof;
