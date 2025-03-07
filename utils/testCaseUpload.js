const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const testCaseEvidenceDir = path.join(__dirname, '../public/uploads/evidence');

if (!fs.existsSync(testCaseEvidenceDir)) {
  fs.mkdirSync(testCaseEvidenceDir, { recursive: true });
}

// Define storage options for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, testCaseEvidenceDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'evidence-' + uniqueSuffix + ext);
  }
});

// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max size
  }
});

module.exports = {
  testCaseUploadMiddleware: upload.single('evidenceFile')
};