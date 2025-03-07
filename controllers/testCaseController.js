const { TestCase } = require('../models/TestCase');
const { User } = require('../models/User');
const path = require('path');
const fs = require('fs');

/**
 * Helper function to format file size
 * @param {Number} bytes - File size in bytes
 * @returns {String} - Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if user can edit a test case (admin or creator)
 * @param {Object} user - Current user
 * @param {Object} testCase - Test case to check
 * @returns {Boolean} - Whether user can edit
 */
const canEditTestCase = (user, testCase) => {
  if (!user || !testCase) return false;
  return user.role === 'admin' || user.id === testCase.userId;
};

/**
 * Display test case form page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showTestCaseForm = async (req, res) => {
  try {
    res.render('test-cases/create', {
      title: 'Add Test Case',
      activeMenu: 'testcase'
    });
  } catch (error) {
    console.error('Error loading test case form:', error);
    req.flash('error', 'Failed to load test case form');
    res.redirect('/');
  }
};

/**
 * Store a new test case
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const storeTestCase = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      req.flash('error', 'Evidence file is required');
      return res.redirect('/test-cases/create');
    }

    // Get form data
    const { name, notes } = req.body;
    
    // Validate inputs
    if (!name) {
      req.flash('error', 'Test case name is required');
      return res.redirect('/test-cases/create');
    }

    // Create test case record
    await TestCase.create({
      name,
      notes,
      evidencePath: path.join('uploads/evidence', path.basename(req.file.path)),
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      userId: req.user.id // Save current user ID
    });

    req.flash('success', 'Test case added successfully');
    res.redirect('/test-cases');
    
  } catch (error) {
    console.error('Error creating test case:', error);
    req.flash('error', 'Failed to create test case');
    res.redirect('/test-cases/create');
  }
};

/**
 * Display list of all test cases (filtered by user role)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listTestCases = async (req, res) => {
  try {
    let testCases;
    
    // Admin can see all test cases, regular users only see their own
    if (req.user.role === 'admin') {
      testCases = await TestCase.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'username'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      testCases = await TestCase.findAll({
        where: { userId: req.user.id },
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'username'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    }
    
    res.render('test-cases/index', {
      title: 'Test Cases',
      testCases,
      activeMenu: 'testcase',
      formatFileSize,
      canEdit: canEditTestCase
    });
  } catch (error) {
    console.error('Error listing test cases:', error);
    req.flash('error', 'Failed to load test cases');
    res.redirect('/');
  }
};

/**
 * Display test case details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testCase = await TestCase.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'username'] }
      ]
    });
    
    if (!testCase) {
      req.flash('error', 'Test case not found');
      return res.redirect('/test-cases');
    }
    
    // Check permission - only admin or creator can see details
    if (req.user.role !== 'admin' && req.user.id !== testCase.userId) {
      req.flash('error', 'You do not have permission to view this test case');
      return res.redirect('/test-cases');
    }
    
    res.render('test-cases/show', {
      title: `Test Case: ${testCase.name}`,
      testCase,
      activeMenu: 'testcase',
      formatFileSize,
      canEdit: canEditTestCase(req.user, testCase)
    });
  } catch (error) {
    console.error('Error showing test case:', error);
    req.flash('error', 'Failed to load test case details');
    res.redirect('/test-cases');
  }
};

/**
 * Show form to edit test case
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const editTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testCase = await TestCase.findByPk(id);
    
    if (!testCase) {
      req.flash('error', 'Test case not found');
      return res.redirect('/test-cases');
    }
    
    // Check permission - only admin or creator can edit
    if (req.user.role !== 'admin' && req.user.id !== testCase.userId) {
      req.flash('error', 'You do not have permission to edit this test case');
      return res.redirect('/test-cases');
    }
    
    res.render('test-cases/edit', {
      title: `Edit Test Case: ${testCase.name}`,
      testCase,
      activeMenu: 'testcase'
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    req.flash('error', 'Failed to load edit form');
    res.redirect('/test-cases');
  }
};

/**
 * Update test case
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, notes } = req.body;
    
    const testCase = await TestCase.findByPk(id);
    
    if (!testCase) {
      req.flash('error', 'Test case not found');
      return res.redirect('/test-cases');
    }
    
    // Check permission - only admin or creator can update
    if (req.user.role !== 'admin' && req.user.id !== testCase.userId) {
      req.flash('error', 'You do not have permission to update this test case');
      return res.redirect('/test-cases');
    }
    
    // Update file if provided
    if (req.file) {
      // Delete old file
      const oldFilePath = path.join(__dirname, '../public', testCase.evidencePath);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      
      // Update with new file
      testCase.evidencePath = path.join('uploads/evidence', path.basename(req.file.path));
      testCase.originalFilename = req.file.originalname;
      testCase.fileSize = req.file.size;
      testCase.fileType = req.file.mimetype;
    }
    
    // Update other fields
    testCase.name = name;
    testCase.notes = notes;
    
    await testCase.save();
    
    req.flash('success', 'Test case updated successfully');
    res.redirect(`/test-cases/${id}`);
    
  } catch (error) {
    console.error('Error updating test case:', error);
    req.flash('error', 'Failed to update test case');
    res.redirect(`/test-cases/${req.params.id}/edit`);
  }
};

/**
 * Download test case evidence file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const downloadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testCase = await TestCase.findByPk(id);
    
    if (!testCase) {
      req.flash('error', 'Test case not found');
      return res.redirect('/test-cases');
    }
    
    // For download, we allow even if not the creator, just need to have access to view test cases
    if (req.user.role !== 'admin' && req.user.id !== testCase.userId) {
      req.flash('error', 'You do not have permission to download this file');
      return res.redirect('/test-cases');
    }
    
    // Get file path
    const filePath = path.join(__dirname, '../public', testCase.evidencePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      req.flash('error', 'Evidence file not found');
      return res.redirect('/test-cases');
    }
    
    // Set filename for download
    res.setHeader('Content-Disposition', `attachment; filename="${testCase.originalFilename}"`);
    
    // Stream file to response
    res.download(filePath, testCase.originalFilename);
    
  } catch (error) {
    console.error('Error downloading evidence:', error);
    req.flash('error', 'Failed to download evidence file');
    res.redirect('/test-cases');
  }
};

/**
 * Delete a test case
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    
    const testCase = await TestCase.findByPk(id);
    
    if (!testCase) {
      req.flash('error', 'Test case not found');
      return res.redirect('/test-cases');
    }
    
    // Check permission - only admin or creator can delete
    if (req.user.role !== 'admin' && req.user.id !== testCase.userId) {
      req.flash('error', 'You do not have permission to delete this test case');
      return res.redirect('/test-cases');
    }
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, '../public', testCase.evidencePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await testCase.destroy();
    
    req.flash('success', 'Test case deleted successfully');
    res.redirect('/test-cases');
    
  } catch (error) {
    console.error('Error deleting test case:', error);
    req.flash('error', 'Failed to delete test case');
    res.redirect('/test-cases');
  }
};

module.exports = {
  showTestCaseForm,
  storeTestCase,
  listTestCases,
  showTestCase,
  editTestCase,
  updateTestCase,
  downloadEvidence,
  deleteTestCase,
  canEditTestCase
};