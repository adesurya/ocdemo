const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middlewares/authMiddleware');

// Login routes
router.get('/login', isGuest, authController.showLoginForm);
router.post('/login', isGuest, authController.login);

// Logout route
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router;