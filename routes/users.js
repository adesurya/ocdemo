const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all user routes
router.use(isAuthenticated);
router.use(isAdmin);

// User management routes
router.get('/', userController.index);
router.get('/create', userController.create);
router.post('/', userController.store);
router.get('/:id/edit', userController.edit);
router.put('/:id', userController.update);
router.delete('/:id', userController.destroy);

module.exports = router;