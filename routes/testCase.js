const express = require('express');
const router = express.Router();
const testCaseController = require('../controllers/testCaseController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { testCaseUploadMiddleware } = require('../utils/testCaseUpload');

// Apply authentication middleware to all test case routes
router.use(isAuthenticated);

// Test case management routes
router.get('/', testCaseController.listTestCases);
router.get('/create', testCaseController.showTestCaseForm);
router.post('/', testCaseUploadMiddleware, testCaseController.storeTestCase);
router.get('/:id', testCaseController.showTestCase);
router.get('/:id/edit', testCaseController.editTestCase);
router.put('/:id', testCaseUploadMiddleware, testCaseController.updateTestCase);
router.get('/:id/download', testCaseController.downloadEvidence);
router.delete('/:id', testCaseController.deleteTestCase);

module.exports = router;