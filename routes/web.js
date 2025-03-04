const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Home page route (Komparasi File)
router.get('/', homeController.index);

// History page route (Riwayat)
router.get('/history', homeController.history);

// Detail comparison page route
router.get('/comparison/:id', homeController.detail);

module.exports = router;