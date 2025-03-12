const express = require('express');
const router = express.Router();
const nonIsoComparisonController = require('../controllers/nonIsoComparisonController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/non-iso-comparison');
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

// File filter - accept all files for non-ISO comparison
const fileFilter = (req, file, cb) => {
  // Accept all file types
  cb(null, true);
};

// Configure multer with 100MB limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload fields configuration
const fileUploadFields = [
  { name: 'hpuxFile', maxCount: 1 },
  { name: 'linuxFile', maxCount: 1 }
];

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Non-ISO comparison routes
router.get('/', nonIsoComparisonController.showComparisonForm);
router.post('/process', upload.fields(fileUploadFields), nonIsoComparisonController.processComparison);
router.get('/results/:id', nonIsoComparisonController.showComparisonResultsById);
router.get('/download/:id', nonIsoComparisonController.downloadComparisonJSON);
router.get('/list', nonIsoComparisonController.listComparisons);
router.delete('/:id', nonIsoComparisonController.deleteComparison);

module.exports = router;