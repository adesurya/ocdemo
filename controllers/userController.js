const { User } = require('../models/User');
const { Op } = require('sequelize');

/**
 * Display list of all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const index = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { search, role, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereConditions.role = role;
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    // Get users with pagination
    const { count, rows: users } = await User.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Calculate pagination
    const totalPages = Math.ceil(count / limit);
    
    res.render('users/index', {
      title: 'User Management',
      activeMenu: 'users',
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
        totalPages
      },
      filters: { search, role, status },
      success: req.flash('success'),
      error: req.flash('error')
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    req.flash('error', 'Gagal memuat daftar pengguna');
    res.redirect('/');
  }
};

/**
 * Show form to create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const create = (req, res) => {
  res.render('users/create', {
    title: 'Tambah User Baru',
    activeMenu: 'users',
    user: {},
    errors: {}
  });
};

/**
 * Store a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const store = async (req, res) => {
  try {
    const { username, password, confirmPassword, name, email, role, status } = req.body;
    
    // Validate input
    const errors = {};
    
    if (!username) errors.username = 'Username tidak boleh kosong';
    if (!password) errors.password = 'Password tidak boleh kosong';
    if (password !== confirmPassword) errors.confirmPassword = 'Konfirmasi password tidak cocok';
    if (!name) errors.name = 'Nama tidak boleh kosong';
    if (!email) errors.email = 'Email tidak boleh kosong';
    
    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        errors.username = 'Username sudah digunakan';
      }
      if (existingUser.email === email) {
        errors.email = 'Email sudah digunakan';
      }
    }
    
    // If validation fails, re-render form with errors
    if (Object.keys(errors).length > 0) {
      return res.render('users/create', {
        title: 'Tambah User Baru',
        activeMenu: 'users',
        user: { username, name, email, role, status },
        errors
      });
    }
    
    // Create user
    await User.create({
      username,
      password,
      name,
      email,
      role: role || 'user',
      status: status || 'active'
    });
    
    req.flash('success', 'User berhasil ditambahkan');
    res.redirect('/users');
    
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.name === 'SequelizeValidationError') {
      // Handle validation errors
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = err.message;
      });
      
      return res.render('users/create', {
        title: 'Tambah User Baru',
        activeMenu: 'users',
        user: req.body,
        errors
      });
    }
    
    req.flash('error', 'Gagal menambahkan user');
    res.redirect('/users');
  }
};

/**
 * Show form to edit user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const edit = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user by ID
    const user = await User.findByPk(id);
    
    if (!user) {
      req.flash('error', 'User tidak ditemukan');
      return res.redirect('/users');
    }
    
    res.render('users/edit', {
      title: 'Edit User',
      activeMenu: 'users',
      user,
      errors: {}
    });
    
  } catch (error) {
    console.error('Error fetching user for edit:', error);
    req.flash('error', 'Gagal memuat data user');
    res.redirect('/users');
  }
};

/**
 * Update user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, password, confirmPassword } = req.body;
    
    // Find user by ID
    const user = await User.findByPk(id);
    
    if (!user) {
      req.flash('error', 'User tidak ditemukan');
      return res.redirect('/users');
    }
    
    // Validate input
    const errors = {};
    
    if (!name) errors.name = 'Nama tidak boleh kosong';
    if (!email) errors.email = 'Email tidak boleh kosong';
    
    // Check if email already exists (not for this user)
    const existingUser = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: id }
      }
    });
    
    if (existingUser) {
      errors.email = 'Email sudah digunakan';
    }
    
    // Check password if provided
    if (password) {
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Konfirmasi password tidak cocok';
      }
    }
    
    // If validation fails, re-render form with errors
    if (Object.keys(errors).length > 0) {
      return res.render('users/edit', {
        title: 'Edit User',
        activeMenu: 'users',
        user: { ...user.toJSON(), ...req.body },
        errors
      });
    }
    
    // Prepare update data
    const updateData = { name, email, role, status };
    
    // Add password if provided
    if (password) {
      updateData.password = password;
    }
    
    // Update user
    await user.update(updateData);
    
    req.flash('success', 'User berhasil diupdate');
    res.redirect('/users');
    
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.name === 'SequelizeValidationError') {
      // Handle validation errors
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = err.message;
      });
      
      return res.render('users/edit', {
        title: 'Edit User',
        activeMenu: 'users',
        user: { ...await User.findByPk(req.params.id), ...req.body },
        errors
      });
    }
    
    req.flash('error', 'Gagal mengupdate user');
    res.redirect('/users');
  }
};

/**
 * Delete user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user by ID
    const user = await User.findByPk(id);
    
    if (!user) {
      req.flash('error', 'User tidak ditemukan');
      return res.redirect('/users');
    }
    
    // Don't allow deleting your own account
    if (user.id === req.user.id) {
      req.flash('error', 'Anda tidak dapat menghapus akun Anda sendiri');
      return res.redirect('/users');
    }
    
    // Delete user
    await user.destroy();
    
    req.flash('success', 'User berhasil dihapus');
    res.redirect('/users');
    
  } catch (error) {
    console.error('Error deleting user:', error);
    req.flash('error', 'Gagal menghapus user');
    res.redirect('/users');
  }
};

module.exports = {
  index,
  create,
  store,
  edit,
  update,
  destroy
};