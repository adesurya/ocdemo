const express = require('express');
const router = express.Router();
const scenarioController = require('../controllers/scenarioController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { scenarioUploadMiddleware } = require('../utils/scenarioUpload');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Scenario management routes
router.get('/', scenarioController.index);
router.get('/create-folder', scenarioController.createFolder);
router.post('/create-folder', scenarioController.storeFolder);
router.get('/upload-file', scenarioController.uploadFile);
router.post('/upload-file', scenarioUploadMiddleware, scenarioController.storeFile);
router.get('/:id/download', scenarioController.downloadFile);
router.delete('/:id', scenarioController.destroy);

// Rename routes
router.get('/:id/rename', scenarioController.showRenameForm);
router.post('/:id/rename', scenarioController.renameItem);

// Share management routes
router.get('/:id/shares', scenarioController.manageShares);
router.post('/:id/shares', scenarioController.addShare);
router.delete('/:id/shares/:shareId', scenarioController.removeShare);

router.use((req, res, next) => {
    if (!req.flash) {
      // Tambahkan mock flash function jika tidak ada
      req.flash = (type, message) => {
        if (!req.session.flash) req.session.flash = {};
        if (!req.session.flash[type]) req.session.flash[type] = [];
        req.session.flash[type].push(message);
        return req.session.flash[type];
      };
    }
    next();
  });
module.exports = router;