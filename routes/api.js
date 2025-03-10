const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');
const { uploadMiddleware } = require('../utils/fileUpload');

// Process comparison route
router.post('/compare', uploadMiddleware, comparisonController.processComparison);

// Get comparison by ID
router.get('/comparison/:id', comparisonController.getComparison);

// List all comparisons
router.get('/comparisons', comparisonController.listComparisons);

// Delete comparison
router.delete('/comparison/:id', comparisonController.deleteComparison);


module.exports = router;