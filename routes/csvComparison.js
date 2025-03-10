const express = require('express');
const router = express.Router();
const csvComparisonController = require('../controllers/csvComparisonController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/csv-comparison');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept CSV and TXT files
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv' || ext === '.txt' || 
      file.mimetype === 'text/csv' || 
      file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file CSV dan TXT yang diperbolehkan!'), false);
  }
};

// Configure upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// CSV upload fields
const fileUploadFields = [
  { name: 'hpuxFile', maxCount: 1 },
  { name: 'linuxFile', maxCount: 1 }
];

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// CSV/TXT Comparison routes
router.get('/', csvComparisonController.showComparisonForm);
router.post('/process', upload.fields(fileUploadFields), csvComparisonController.processComparison);
router.get('/results', csvComparisonController.showComparisonResults);
router.get('/results/:id', csvComparisonController.showComparisonResultsById);
router.get('/download/:id', csvComparisonController.downloadComparisonJSON);
router.get('/list', csvComparisonController.listComparisons);
router.delete('/:id', csvComparisonController.deleteComparison); // Tambahkan rute DELETE

module.exports = router;