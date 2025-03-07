const { User } = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Render login page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showLoginForm = (req, res) => {
  // Selalu menyediakan variabel message (bisa null)
  res.render('auth/login', {
    title: 'Login',
    activeMenu: 'login',
    message: req.query.message || null,
    error: null, // Pastikan error juga selalu tersedia
    username: ''
  });
};

/**
 * Process login attempt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.render('auth/login', {
        title: 'Login',
        activeMenu: 'login',
        error: 'Username dan password harus diisi',
        message: null,
        username
      });
    }
    
    // Find user by username
    const user = await User.findOne({ where: { username } });
    
    // Check if user exists and is active
    if (!user || user.status !== 'active') {
      return res.render('auth/login', {
        title: 'Login',
        activeMenu: 'login',
        error: 'Username atau password tidak valid',
        message: null,
        username
      });
    }
    
    // Check password
    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login',
        activeMenu: 'login',
        error: 'Username atau password tidak valid',
        message: null,
        username
      });
    }
    
    // Update last login time
    await user.update({ lastLogin: new Date() });
    
    // Create and set JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );
    
    // Set cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });
    
    // Redirect based on role
    res.redirect('/');
    
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login',
      activeMenu: 'login',
      error: 'Terjadi kesalahan, silakan coba lagi',
      message: null,
      username: req.body.username || ''
    });
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/login?message=Anda berhasil logout');
};

module.exports = {
  showLoginForm,
  login,
  logout
};