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
    
    console.log('Processing comparison:', { testCase, hpuxImagePath, linuxImagePath });
    
    // Extract text from both images
    const hpuxResult = await extractTextFromImage(req.files.hpuxImage[0].path);
    const linuxResult = await extractTextFromImage(req.files.linuxImage[0].path);
    
    // Log result status
    console.log('Extraction results:', {
      hpuxStatus: hpuxResult.status,
      linuxStatus: linuxResult.status,
      hpuxDataLength: hpuxResult.extractedData?.data?.length || 0,
      linuxDataLength: linuxResult.extractedData?.data?.length || 0
    });
    
    // Get extracted data
    const hpuxData = hpuxResult.extractedData || { data: [] };
    const linuxData = linuxResult.extractedData || { data: [] };
    
    // Collect any warnings
    let warnings = [];
    if (hpuxResult.status === 'error') {
      warnings.push(`HPUX image: ${hpuxResult.message}`);
    }
    if (linuxResult.status === 'error') {
      warnings.push(`Linux image: ${linuxResult.message}`);
    }
    
    // Compare the extracted data
    console.log('Comparing extracted data');
    const comparisonResult = compareExtractedData(hpuxData, linuxData);
    
    // Format the results for display
    console.log('Formatting comparison results');
    const formattedResults = formatComparisonResults(hpuxData, linuxData, comparisonResult.differences);
    
    // Serialize for database storage - we know this is valid JSON
    const hpuxJSON = JSON.stringify(hpuxData);
    const linuxJSON = JSON.stringify(linuxData);
    const differencesJSON = JSON.stringify(comparisonResult.differences);
    
    console.log('Saving comparison to database');
    
    // Save the comparison to the database
    const comparison = await Comparison.create({
      testCase,
      hpuxImagePath,
      linuxImagePath,
      hpuxExtractedData: hpuxJSON,
      linuxExtractedData: linuxJSON,
      differences: differencesJSON
    });
    
    console.log(`Comparison saved with ID: ${comparison.id}`);
    
    // Return the results
    res.status(200).json({
      status: warnings.length > 0 ? 'partial' : 'success',
      warnings: warnings.length > 0 ? warnings : undefined,
      comparison: {
        id: comparison.id,
        testCase,
        hpuxImagePath,
        linuxImagePath,
        createdAt: comparison.createdAt
      },
      results: {
        hpux: hpuxData,
        linux: linuxData
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
    
    // Parse the stored JSON data safely
    let hpuxData, linuxData, differences;
    
    try {
      hpuxData = JSON.parse(comparison.hpuxExtractedData);
    } catch (e) {
      console.error('Error parsing HPUX data:', e);
      hpuxData = { data: [] };
    }
    
    try {
      linuxData = JSON.parse(comparison.linuxExtractedData);
    } catch (e) {
      console.error('Error parsing Linux data:', e);
      linuxData = { data: [] };
    }
    
    try {
      differences = JSON.parse(comparison.differences);
    } catch (e) {
      console.error('Error parsing differences:', e);
      differences = {};
    }
    
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
    
    // Safely parse differences for each comparison
    const safeComparisons = comparisons.map(comp => {
      let differenceCount = 0;
      try {
        const differences = JSON.parse(comp.differences);
        differenceCount = Object.keys(differences).length;
      } catch (e) {
        console.error(`Error parsing differences for comparison #${comp.id}:`, e);
      }
      
      return {
        id: comp.id,
        testCase: comp.testCase,
        hpuxImagePath: comp.hpuxImagePath,
        linuxImagePath: comp.linuxImagePath,
        createdAt: comp.createdAt,
        differenceCount
      };
    });
    
    res.status(200).json({
      status: 'success',
      count: safeComparisons.length,
      comparisons: safeComparisons
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