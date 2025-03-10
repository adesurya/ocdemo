const { parseFile, compareData } = require('../utils/csvParser');
const { CSVComparison } = require('../models/CSVComparison');
const path = require('path');
const fs = require('fs');

/**
 * Menampilkan halaman form upload untuk komparasi
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showComparisonForm = async (req, res) => {
  try {
    // Get recent comparisons
    const recentComparisons = await CSVComparison.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.render('csv-comparison/upload', {
      title: 'Komparasi File (CSV/TXT)',
      activeMenu: 'csv-comparison',
      recentComparisons
    });
  } catch (error) {
    console.error('Error loading comparison form:', error);
    req.flash('error', 'Gagal memuat form komparasi');
    res.redirect('/');
  }
};

/**
 * Memproses upload dan melakukan komparasi file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processComparison = async (req, res) => {
  try {
    // Validate request
    if (!req.files || !req.files.hpuxFile || !req.files.linuxFile) {
      req.flash('error', 'Kedua file HPUX dan Linux diperlukan');
      return res.redirect('/csv-comparison');
    }

    const testCase = req.body.testCase || 'Unnamed Comparison';
    const hpuxFilePath = req.files.hpuxFile[0].path;
    const linuxFilePath = req.files.linuxFile[0].path;
    const hpuxFileName = req.files.hpuxFile[0].originalname;
    const linuxFileName = req.files.linuxFile[0].originalname;
    
    console.log('Processing comparison:', { testCase, hpuxFilePath, linuxFilePath });
    
    // Detect file type based on extension
    const hpuxFileExt = path.extname(hpuxFileName).toLowerCase();
    const linuxFileExt = path.extname(linuxFileName).toLowerCase();
    
    console.log(`File types: HPUX - ${hpuxFileExt}, Linux - ${linuxFileExt}`);
    
    // Parse files
    const hpuxResult = await parseFile(hpuxFilePath);
    const linuxResult = await parseFile(linuxFilePath);
    
    // Compare data
    const comparisonResult = compareData(hpuxResult.data, linuxResult.data);
    
    // Save to database
    const savedComparison = await CSVComparison.create({
      testCase,
      hpuxFilePath: path.relative(path.join(__dirname, '../'), hpuxFilePath),
      linuxFilePath: path.relative(path.join(__dirname, '../'), linuxFilePath),
      hpuxFileName,
      linuxFileName,
      hpuxData: JSON.stringify(hpuxResult.data),
      linuxData: JSON.stringify(linuxResult.data),
      differences: JSON.stringify(comparisonResult.differences),
      differenceCount: comparisonResult.differenceCount,
      userId: req.user ? req.user.id : null
    });
    
    // Store data in session for result page
    req.session.csvComparison = {
      id: savedComparison.id,
      testCase,
      hpuxData: hpuxResult.data,
      linuxData: linuxResult.data,
      comparisonResult,
      hpuxFileName,
      linuxFileName,
      hpuxFileExt,
      linuxFileExt
    };
    
    // Redirect to results page
    res.redirect(`/csv-comparison/results/${savedComparison.id}`);
    
  } catch (error) {
    console.error('Error processing comparison:', error);
    req.flash('error', `Gagal memproses komparasi: ${error.message}`);
    res.redirect('/csv-comparison');
  }
};

/**
 * Menampilkan hasil komparasi berdasarkan ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showComparisonResultsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get comparison from database
    const comparison = await CSVComparison.findByPk(id);
    
    if (!comparison) {
      req.flash('error', 'Comparison not found');
      return res.redirect('/csv-comparison');
    }
    
    // Get file extensions
    const hpuxFileExt = path.extname(comparison.hpuxFileName).toLowerCase();
    const linuxFileExt = path.extname(comparison.linuxFileName).toLowerCase();
    
    // Parse JSON data
    const comparisonData = {
      id: comparison.id,
      testCase: comparison.testCase,
      hpuxData: JSON.parse(comparison.hpuxData),
      linuxData: JSON.parse(comparison.linuxData),
      comparisonResult: {
        differences: JSON.parse(comparison.differences),
        differenceCount: comparison.differenceCount,
        identical: comparison.differenceCount === 0
      },
      hpuxFileName: comparison.hpuxFileName,
      linuxFileName: comparison.linuxFileName,
      hpuxFileExt,
      linuxFileExt,
      createdAt: comparison.createdAt
    };
    
    res.render('csv-comparison/results', {
      title: `Hasil Komparasi: ${comparison.testCase}`,
      activeMenu: 'csv-comparison',
      comparison: comparisonData
    });
    
  } catch (error) {
    console.error('Error showing comparison results:', error);
    req.flash('error', 'Gagal menampilkan hasil komparasi');
    res.redirect('/csv-comparison');
  }
};

/**
 * Menampilkan hasil komparasi dari session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const showComparisonResults = async (req, res) => {
  try {
    // Get data from session
    const comparisonData = req.session.csvComparison;
    
    if (!comparisonData) {
      req.flash('error', 'Tidak ada data komparasi yang tersedia. Silakan upload file kembali.');
      return res.redirect('/csv-comparison');
    }
    
    // Redirect to the saved comparison
    res.redirect(`/csv-comparison/results/${comparisonData.id}`);
    
  } catch (error) {
    console.error('Error showing comparison results:', error);
    req.flash('error', 'Gagal menampilkan hasil komparasi');
    res.redirect('/csv-comparison');
  }
};

/**
 * Download hasil komparasi sebagai JSON
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const downloadComparisonJSON = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get comparison from database
    const comparison = await CSVComparison.findByPk(id);
    
    if (!comparison) {
      req.flash('error', 'Comparison not found');
      return res.redirect('/csv-comparison');
    }
    
    // Prepare JSON response
    const jsonData = {
      id: comparison.id,
      testCase: comparison.testCase,
      hpuxData: JSON.parse(comparison.hpuxData),
      linuxData: JSON.parse(comparison.linuxData),
      differences: JSON.parse(comparison.differences),
      differenceCount: comparison.differenceCount,
      hpuxFileName: comparison.hpuxFileName,
      linuxFileName: comparison.linuxFileName,
      createdAt: comparison.createdAt
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="comparison-${id}.json"`);
    res.send(JSON.stringify(jsonData, null, 2));
    
  } catch (error) {
    console.error('Error downloading comparison JSON:', error);
    req.flash('error', 'Gagal mengunduh hasil komparasi');
    res.redirect('/csv-comparison');
  }
};

/**
 * Daftar semua komparasi
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listComparisons = async (req, res) => {
  try {
    let comparisons;
    
    // Admin can see all, regular users only see their own
    if (req.user.role === 'admin') {
      comparisons = await CSVComparison.findAll({
        order: [['createdAt', 'DESC']]
      });
    } else {
      comparisons = await CSVComparison.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
    }
    
    res.render('csv-comparison/list', {
      title: 'Daftar Komparasi',
      activeMenu: 'csv-comparison',
      comparisons
    });
    
  } catch (error) {
    console.error('Error listing comparisons:', error);
    req.flash('error', 'Gagal memuat daftar komparasi');
    res.redirect('/');
  }
};

/**
 * Menghapus komparasi CSV/TXT berdasarkan ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteComparison = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cari komparasi di database
    const comparison = await CSVComparison.findByPk(id);
    
    if (!comparison) {
      req.flash('error', 'Komparasi tidak ditemukan');
      return res.redirect('/history');
    }
    
    // Cek permission - admin atau pemilik dapat menghapus
    if (req.user.role !== 'admin' && comparison.userId !== req.user.id) {
      req.flash('error', 'Anda tidak memiliki izin untuk menghapus komparasi ini');
      return res.redirect('/history');
    }
    
    // Hapus file jika ada
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
    
    // Hapus dari database
    await comparison.destroy();
    
    req.flash('success', 'Komparasi berhasil dihapus');
    res.redirect('/history');
    
  } catch (error) {
    console.error('Error deleting CSV comparison:', error);
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