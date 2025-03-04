const { Comparison } = require('../models/Comparison');
const { extractTextFromImage } = require('../services/openaiService');
const { compareExtractedData, formatComparisonResults } = require('../utils/compareResults');
const path = require('path');

/**
 * Process comparison request and extract text from images
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processComparison = async (req, res) => {
  try {
    // Validate request
    if (!req.files || !req.files.hpuxImage || !req.files.linuxImage) {
      return res.status(400).json({
        status: 'error',
        message: 'Both HPUX and Linux images are required'
      });
    }

    const testCase = req.body.testCase || 'Unnamed Test Case';
    const hpuxImagePath = path.join('uploads/hpux', path.basename(req.files.hpuxImage[0].path));
    const linuxImagePath = path.join('uploads/linux', path.basename(req.files.linuxImage[0].path));
    
    // Extract text from both images
    const hpuxResult = await extractTextFromImage(req.files.hpuxImage[0].path);
    const linuxResult = await extractTextFromImage(req.files.linuxImage[0].path);
    
    if (hpuxResult.status === 'error' || linuxResult.status === 'error') {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to extract text from one or both images',
        details: {
          hpux: hpuxResult.status === 'error' ? hpuxResult.message : null,
          linux: linuxResult.status === 'error' ? linuxResult.message : null
        }
      });
    }
    
    // Compare the extracted data
    const comparisonResult = compareExtractedData(
      hpuxResult.extractedData,
      linuxResult.extractedData
    );
    
    // Format the results for display
    const formattedResults = formatComparisonResults(
      hpuxResult.extractedData,
      linuxResult.extractedData,
      comparisonResult.differences
    );
    
    // Save the comparison to the database
    const comparison = await Comparison.create({
      testCase,
      hpuxImagePath,
      linuxImagePath,
      hpuxExtractedData: JSON.stringify(hpuxResult.extractedData),
      linuxExtractedData: JSON.stringify(linuxResult.extractedData),
      differences: JSON.stringify(comparisonResult.differences)
    });
    
    // Return the results
    res.status(200).json({
      status: 'success',
      comparison: {
        id: comparison.id,
        testCase,
        hpuxImagePath,
        linuxImagePath,
        createdAt: comparison.createdAt
      },
      results: {
        hpux: hpuxResult.extractedData,
        linux: linuxResult.extractedData
      },
      comparisonResult,
      formattedResults
    });
  } catch (error) {
    console.error('Error processing comparison:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process comparison',
      error: error.message
    });
  }
};

/**
 * Get a specific comparison by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getComparison = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the comparison in the database
    const comparison = await Comparison.findByPk(id);
    
    if (!comparison) {
      return res.status(404).json({
        status: 'error',
        message: 'Comparison not found'
      });
    }
    
    // Parse the stored JSON data
    const hpuxData = JSON.parse(comparison.hpuxExtractedData);
    const linuxData = JSON.parse(comparison.linuxExtractedData);
    const differences = JSON.parse(comparison.differences);
    
    // Format for display
    const formattedResults = formatComparisonResults(
      hpuxData,
      linuxData,
      differences
    );
    
    res.status(200).json({
      status: 'success',
      comparison: {
        id: comparison.id,
        testCase: comparison.testCase,
        hpuxImagePath: comparison.hpuxImagePath,
        linuxImagePath: comparison.linuxImagePath,
        createdAt: comparison.createdAt
      },
      results: {
        hpux: hpuxData,
        linux: linuxData
      },
      comparisonResult: {
        differences,
        differenceCount: Object.keys(differences).length,
        identical: Object.keys(differences).length === 0
      },
      formattedResults
    });
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch comparison',
      error: error.message
    });
  }
};

/**
 * List all comparisons
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listComparisons = async (req, res) => {
  try {
    const comparisons = await Comparison.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      count: comparisons.length,
      comparisons: comparisons.map(comp => ({
        id: comp.id,
        testCase: comp.testCase,
        hpuxImagePath: comp.hpuxImagePath,
        linuxImagePath: comp.linuxImagePath,
        createdAt: comp.createdAt,
        differenceCount: JSON.parse(comp.differences) ? Object.keys(JSON.parse(comp.differences)).length : 0
      }))
    });
  } catch (error) {
    console.error('Error listing comparisons:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to list comparisons',
      error: error.message
    });
  }
};

module.exports = {
  processComparison,
  getComparison,
  listComparisons
};