const { Comparison } = require('../models/Comparison');
const { TestCase } = require('../models/TestCase');
const { CSVComparison } = require('../models/CSVComparison');
const { NonISOComparison } = require('../models/NonISOComparison');
const { User } = require('../models/User');
const viewHelpers = require('../utils/viewHelpers');
const { canEditTestCase } = require('../controllers/testCaseController');

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
 * Display history page with all types of tests and comparisons
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const history = async (req, res) => {
  try {
    console.log('History function started');
    let comparisons;
    let testCases;
    let csvComparisons;
    let nonIsoComparisons;
    
    // Get data based on user role
    if (req.user.role === 'admin') {
      // Admin can see all data
      console.log('Fetching all comparisons for admin user');
      comparisons = await Comparison.findAll({
        order: [['createdAt', 'DESC']]
      });
      
      console.log('Fetching all test cases for admin user');
      testCases = await TestCase.findAll({
        order: [['createdAt', 'DESC']]
      });
      
      // Manually fetch test case creators
      for (const testCase of testCases) {
        if (testCase.userId) {
          const user = await User.findByPk(testCase.userId, {
            attributes: ['id', 'name', 'username']
          });
          testCase.creator = user;
        } else {
          testCase.creator = null;
        }
      }
      
      console.log('Fetching all CSV comparisons for admin user');
      csvComparisons = await CSVComparison.findAll({
        order: [['createdAt', 'DESC']]
      });
      
      // Manually fetch CSV comparison creators
      for (const comparison of csvComparisons) {
        if (comparison.userId) {
          const user = await User.findByPk(comparison.userId, {
            attributes: ['id', 'name', 'username']
          });
          comparison.creator = user;
        } else {
          comparison.creator = null;
        }
      }
      
      console.log('Fetching all non-ISO comparisons for admin user');
      nonIsoComparisons = await NonISOComparison.findAll({
        order: [['createdAt', 'DESC']]
      });
      
      // Manually fetch non-ISO comparison creators
      for (const comparison of nonIsoComparisons) {
        if (comparison.userId) {
          const user = await User.findByPk(comparison.userId, {
            attributes: ['id', 'name', 'username']
          });
          comparison.creator = user;
        } else {
          comparison.creator = null;
        }
      }
    } else {
      // Regular users only see their own test cases and comparisons
      console.log('Fetching comparisons visible to regular user');
      comparisons = await Comparison.findAll({
        order: [['createdAt', 'DESC']]
      });
      
      console.log('Fetching user test cases');
      testCases = await TestCase.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
      
      // Manually fetch test case creators
      for (const testCase of testCases) {
        if (testCase.userId) {
          const user = await User.findByPk(testCase.userId, {
            attributes: ['id', 'name', 'username']
          });
          testCase.creator = user;
        } else {
          testCase.creator = null;
        }
      }
      
      console.log('Fetching user CSV comparisons');
      csvComparisons = await CSVComparison.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
      
      // Manually fetch CSV comparison creators
      for (const comparison of csvComparisons) {
        if (comparison.userId) {
          const user = await User.findByPk(comparison.userId, {
            attributes: ['id', 'name', 'username']
          });
          comparison.creator = user;
        } else {
          comparison.creator = null;
        }
      }
      
      console.log('Fetching user non-ISO comparisons');
      nonIsoComparisons = await NonISOComparison.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
      
      // Manually fetch non-ISO comparison creators
      for (const comparison of nonIsoComparisons) {
        if (comparison.userId) {
          const user = await User.findByPk(comparison.userId, {
            attributes: ['id', 'name', 'username']
          });
          comparison.creator = user;
        } else {
          comparison.creator = null;
        }
      }
    }
    
    console.log('Combining all test data');
    // Combine all types of tests into a single array with type identifier
    const allTests = [
      ...comparisons.map(comp => ({
        id: comp.id,
        name: comp.testCase,
        type: 'comparison',
        createdAt: comp.createdAt,
        data: comp,
        creator: { name: 'System' } // System-generated
      })),
      ...testCases.map(test => ({
        id: test.id,
        name: test.name,
        type: 'testcase',
        createdAt: test.createdAt,
        data: test,
        creator: test.creator || { name: 'Unknown' }
      })),
      ...csvComparisons.map(csv => ({
        id: csv.id,
        name: csv.testCase,
        type: 'csvcomparison',
        createdAt: csv.createdAt,
        data: csv,
        creator: csv.creator || { name: req.user ? req.user.name : 'Unknown' }
      })),
      ...nonIsoComparisons.map(nonIso => ({
        id: nonIso.id,
        name: nonIso.testCase,
        type: 'noniso',
        createdAt: nonIso.createdAt,
        data: nonIso,
        creator: nonIso.creator || { name: req.user ? req.user.name : 'Unknown' }
      }))
    ];
    
    console.log('Sorting test data');
    // Sort combined list by creation date (newest first)
    allTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log('Rendering history view');
    res.render('history', {
      title: 'Riwayat Test',
      allTests,
      comparisons,
      testCases,
      csvComparisons,
      nonIsoComparisons,
      formatDate: viewHelpers.formatDate,
      formatFileSize: viewHelpers.formatFileSize,
      canEdit: canEditTestCase,
      currentUser: req.user,
      activeMenu: 'history'
    });
  } catch (error) {
    console.error('Error loading history page:', error);
    res.status(500).render('history', {
      title: 'Riwayat Test',
      error: 'Failed to load test history',
      allTests: [],
      comparisons: [],
      testCases: [],
      csvComparisons: [],
      nonIsoComparisons: [],
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
      message: 'Failed to load comparison details: ' + error.message,
      activeMenu: 'history'
    });
  }
};

module.exports = {
  index,
  history,
  detail
};