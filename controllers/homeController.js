const { Comparison } = require('../models/Comparison');

/**
 * Display home page with form
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const index = async (req, res) => {
  try {
    // Get the latest comparisons for display
    const recentComparisons = await Comparison.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.render('home', {
      title: 'OCR Image Comparison',
      recentComparisons,
      activeMenu: 'komparasi'
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).render('home', {
      title: 'OCR Image Comparison',
      error: 'Failed to load recent comparisons',
      activeMenu: 'komparasi'
    });
  }
};

/**
 * Display history page with all comparisons
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const history = async (req, res) => {
  try {
    // Get all comparisons
    const comparisons = await Comparison.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.render('history', {
      title: 'Riwayat Komparasi',
      comparisons,
      activeMenu: 'history'
    });
  } catch (error) {
    console.error('Error loading history page:', error);
    res.status(500).render('history', {
      title: 'Riwayat Komparasi',
      error: 'Failed to load comparison history',
      comparisons: [],
      activeMenu: 'history'
    });
  }
};

/**
 * Display detail page for a specific comparison
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const detail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the comparison in the database
    const comparison = await Comparison.findByPk(id);
    
    if (!comparison) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Comparison not found',
        activeMenu: 'history'
      });
    }
    
    res.render('detail', {
      title: `Detail Komparasi - ${comparison.testCase}`,
      comparison,
      activeMenu: 'history'
    });
  } catch (error) {
    console.error('Error loading detail page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load comparison details',
      activeMenu: 'history'
    });
  }
};

module.exports = {
  index,
  history,
  detail
};