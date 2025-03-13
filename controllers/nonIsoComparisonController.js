const { NonISOComparison } = require('../models/NonISOComparison');
const { User } = require('../models/User');
const { compareNonIsoFiles } = require('../utils/nonIsoComparator');
const path = require('path');
const fs = require('fs');

/**
 * Display the upload form for non-ISO comparison
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showComparisonForm = async (req, res) => {
  try {
    // Get recent comparisons
    const recentComparisons = await NonISOComparison.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    // Manually fetch users for each comparison
    for (const comparison of recentComparisons) {
      if (comparison.userId) {
        const user = await User.findByPk(comparison.userId, {
          attributes: ['id', 'name', 'username']
        });
        comparison.creator = user;
      }
    }
    
    res.render('non-iso-comparison/upload', {
      title: 'Komparasi File (Non-ISO)',
      activeMenu: 'non-iso-comparison',
      recentComparisons
    });
  } catch (error) {
    console.error('Error loading comparison form:', error);
    req.flash('error', 'Gagal memuat form komparasi');
    res.redirect('/');
  }
};

/**
 * Process file uploads and perform comparison
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processComparison = async (req, res) => {
  try {
    // Validate request
    if (!req.files || !req.files.hpuxFile || !req.files.linuxFile) {
      req.flash('error', 'Kedua file HPUX dan Linux diperlukan');
      return res.redirect('/non-iso-comparison');
    }

    const testCase = req.body.testCase || 'Unnamed Comparison';
    const hpuxFilePath = req.files.hpuxFile[0].path;
    const linuxFilePath = req.files.linuxFile[0].path;
    const hpuxFileName = req.files.hpuxFile[0].originalname;
    const linuxFileName = req.files.linuxFile[0].originalname;
    
    console.log('Processing non-ISO comparison:', { testCase, hpuxFilePath, linuxFilePath });
    
    // Compare files with enhanced string-level detail
    const comparisonResult = await compareNonIsoFiles(hpuxFilePath, linuxFilePath);
    
    // Save to database
    const savedComparison = await NonISOComparison.create({
      testCase,
      hpuxFilePath: path.relative(path.join(__dirname, '../'), hpuxFilePath),
      linuxFilePath: path.relative(path.join(__dirname, '../'), linuxFilePath),
      hpuxFileName,
      linuxFileName,
      hpuxEncoding: comparisonResult.hpuxEncoding,
      linuxEncoding: comparisonResult.linuxEncoding,
      differences: JSON.stringify(comparisonResult),  // Store the entire result including detailed differences
      differenceCount: comparisonResult.differenceCount,
      userId: req.user ? req.user.id : null
    });
    
    // Store data in session for result page
    req.session.nonIsoComparison = {
      id: savedComparison.id,
      testCase,
      hpuxFileName,
      linuxFileName,
      hpuxEncoding: comparisonResult.hpuxEncoding,
      linuxEncoding: comparisonResult.linuxEncoding,
      comparisonResult,
      binary: comparisonResult.binary
    };
    
    // Redirect to results page
    res.redirect(`/non-iso-comparison/results/${savedComparison.id}`);
    
  } catch (error) {
    console.error('Error processing comparison:', error);
    req.flash('error', `Gagal memproses komparasi: ${error.message}`);
    res.redirect('/non-iso-comparison');
  }
};

/**
 * Show comparison results from session data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showComparisonResults = async (req, res) => {
  try {
    // Get data from session
    const comparisonData = req.session.nonIsoComparison;
    
    if (!comparisonData) {
      req.flash('error', 'Tidak ada data komparasi yang tersedia. Silakan upload file kembali.');
      return res.redirect('/non-iso-comparison');
    }
    
    // Redirect to the saved comparison
    res.redirect(`/non-iso-comparison/results/${comparisonData.id}`);
    
  } catch (error) {
    console.error('Error showing comparison results:', error);
    req.flash('error', 'Gagal menampilkan hasil komparasi');
    res.redirect('/non-iso-comparison');
  }
};

/**
 * Show comparison results by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showComparisonResultsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get comparison from database
    const comparison = await NonISOComparison.findByPk(id);
    
    if (!comparison) {
      req.flash('error', 'Comparison not found');
      return res.redirect('/non-iso-comparison');
    }
    
    // Get creator information if available
    let creator = null;
    if (comparison.userId) {
      creator = await User.findByPk(comparison.userId, {
        attributes: ['id', 'name', 'username']
      });
    }
    comparison.creator = creator;
    
    // Parse JSON data - now with enhanced detailed differences
    let comparisonData;
    try {
      // Try to parse the stored differences that now contain the entire comparison result
      const parsedDifferences = JSON.parse(comparison.differences);
      
      comparisonData = {
        id: comparison.id,
        testCase: comparison.testCase,
        hpuxFileName: comparison.hpuxFileName,
        linuxFileName: comparison.linuxFileName,
        hpuxEncoding: comparison.hpuxEncoding,
        linuxEncoding: comparison.linuxEncoding,
        comparisonResult: parsedDifferences,  // Now contains detailedDifferences
        creator: comparison.creator,
        createdAt: comparison.createdAt,
        binary: parsedDifferences.binary || comparison.hpuxEncoding === 'binary' || comparison.linuxEncoding === 'binary'
      };
    } catch (error) {
      console.error('Error parsing comparison data:', error);
      
      // Fallback to the old format if parsing fails
      comparisonData = {
        id: comparison.id,
        testCase: comparison.testCase,
        hpuxFileName: comparison.hpuxFileName,
        linuxFileName: comparison.linuxFileName,
        hpuxEncoding: comparison.hpuxEncoding,
        linuxEncoding: comparison.linuxEncoding,
        comparisonResult: {
          differences: JSON.parse(comparison.differences),
          differenceCount: comparison.differenceCount,
          identical: comparison.differenceCount === 0
        },
        creator: comparison.creator,
        createdAt: comparison.createdAt,
        binary: comparison.hpuxEncoding === 'binary' || comparison.linuxEncoding === 'binary'
      };
    }
    
    res.render('non-iso-comparison/results', {
      title: `Hasil Komparasi Non-ISO: ${comparison.testCase}`,
      activeMenu: 'non-iso-comparison',
      comparison: comparisonData
    });
    
  } catch (error) {
    console.error('Error showing comparison results:', error);
    req.flash('error', 'Gagal menampilkan hasil komparasi');
    res.redirect('/non-iso-comparison');
  }
};

/**
 * Download comparison result as JSON
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const downloadComparisonJSON = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get comparison from database
    const comparison = await NonISOComparison.findByPk(id);
    
    if (!comparison) {
      req.flash('error', 'Comparison not found');
      return res.redirect('/non-iso-comparison');
    }
    
    // Get creator information if available
    let creatorName = 'Unknown';
    if (comparison.userId) {
      const user = await User.findByPk(comparison.userId, {
        attributes: ['name']
      });
      if (user) {
        creatorName = user.name;
      }
    }
    
    // Parse the comparison data
    let comparisonData;
    try {
      comparisonData = JSON.parse(comparison.differences);
      
      // Add metadata
      comparisonData.metadata = {
        id: comparison.id,
        testCase: comparison.testCase,
        hpuxFileName: comparison.hpuxFileName,
        linuxFileName: comparison.linuxFileName,
        createdBy: creatorName,
        createdAt: comparison.createdAt
      };
    } catch (error) {
      // Fallback to basic info if parsing fails
      comparisonData = {
        id: comparison.id,
        testCase: comparison.testCase,
        hpuxFileName: comparison.hpuxFileName,
        linuxFileName: comparison.linuxFileName,
        hpuxEncoding: comparison.hpuxEncoding,
        linuxEncoding: comparison.linuxEncoding,
        differences: JSON.parse(comparison.differences),
        differenceCount: comparison.differenceCount,
        createdBy: creatorName,
        createdAt: comparison.createdAt
      };
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="non-iso-comparison-${id}.json"`);
    res.send(JSON.stringify(comparisonData, null, 2));
    
  } catch (error) {
    console.error('Error downloading comparison JSON:', error);
    req.flash('error', 'Gagal mengunduh hasil komparasi');
    res.redirect('/non-iso-comparison');
  }
};

/**
 * List all non-ISO comparisons
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listComparisons = async (req, res) => {
  try {
    let comparisons;
    
    // Admin can see all, regular users only see their own
    if (req.user.role === 'admin') {
      comparisons = await NonISOComparison.findAll({
        order: [['createdAt', 'DESC']]
      });
    } else {
      comparisons = await NonISOComparison.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
    }
    
    // Manually fetch users for each comparison
    for (const comparison of comparisons) {
      if (comparison.userId) {
        const user = await User.findByPk(comparison.userId, {
          attributes: ['id', 'name', 'username']
        });
        comparison.creator = user;
      }
    }
    
    res.render('non-iso-comparison/list', {
      title: 'Daftar Komparasi Non-ISO',
      activeMenu: 'non-iso-comparison',
      comparisons
    });
    
  } catch (error) {
    console.error('Error listing comparisons:', error);
    req.flash('error', 'Gagal memuat daftar komparasi');
    res.redirect('/');
  }
};

/**
 * Delete a non-ISO comparison by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteComparison = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find comparison in database
    const comparison = await NonISOComparison.findByPk(id);
    
    if (!comparison) {
      req.flash('error', 'Komparasi tidak ditemukan');
      return res.redirect('/history');
    }
    
    // Check permission - admin or owner can delete
    if (req.user.role !== 'admin' && comparison.userId !== req.user.id) {
      req.flash('error', 'Anda tidak memiliki izin untuk menghapus komparasi ini');
      return res.redirect('/history');
    }
    
    // Delete files if they exist
    if (comparison.hpuxFilePath) {
      const hpuxFullPath = path.join(__dirname, '..', comparison.hpuxFilePath);
      if (fs.existsSync(hpuxFullPath)) {
        fs.unlinkSync(hpuxFullPath);
      }
    }
    
    if (comparison.linuxFilePath) {
      const linuxFullPath = path.join(__dirname, '..', comparison.linuxFilePath);
      if (fs.existsSync(linuxFullPath)) {
        fs.unlinkSync(linuxFullPath);
      }
    }
    
    // Delete from database
    await comparison.destroy();
    
    req.flash('success', 'Komparasi berhasil dihapus');
    res.redirect('/history');
    
  } catch (error) {
    console.error('Error deleting comparison:', error);
    req.flash('error', 'Gagal menghapus komparasi');
    res.redirect('/history');
  }
};

module.exports = {
  showComparisonForm,
  processComparison,
  showComparisonResults,
  showComparisonResultsById,
  downloadComparisonJSON,
  listComparisons,
  deleteComparison
};