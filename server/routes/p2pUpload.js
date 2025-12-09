const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// HTTP upload endpoint
// Mounted at / in index.js, so this handles POST /upload
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ ok: false, error: 'No file' });
        }
        const fileUrl = '/uploads/' + req.file.filename;
        return res.json({
            ok: true,
            url: fileUrl,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
        });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ ok: false, error: 'Upload failed' });
    }
});

module.exports = router;
