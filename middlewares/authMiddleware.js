const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

/**
 * Middleware to check if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.redirect('/login');
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user exists
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.status !== 'active') {
      res.clearCookie('auth_token');
      return res.redirect('/login?message=Sesi tidak valid, silakan login kembali');
    }
    
    // Set user info to request object
    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    // Set user info for views
    res.locals.user = req.user;
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.clearCookie('auth_token');
    res.redirect('/login?message=Sesi Anda telah berakhir, silakan login kembali');
  }
};

/**
 * Middleware to check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  res.status(403).render('error', {
    title: 'Access Denied',
    message: 'Anda tidak memiliki akses ke halaman ini',
    activeMenu: ''
  });
};

/**
 * Middleware to check if user is already logged in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isGuest = (req, res, next) => {
  const token = req.cookies.auth_token;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      // If token is valid, redirect to home
      return res.redirect('/');
    } catch (error) {
      // If token is invalid, clear it and continue to login
      res.clearCookie('auth_token');
    }
  }
  
  next();
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isGuest
};