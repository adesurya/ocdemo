/**
 * View helper functions for EJS templates
 */

const viewHelpers = require('../utils/viewHelpers');


/**
 * Format file size from bytes to human-readable format
 * @param {Number} bytes - File size in bytes
 * @returns {String} - Formatted file size (e.g., "2.5 MB")
 */
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  /**
   * Format date to localized string
   * @param {Date|String} date - Date to format
   * @param {String} locale - Locale for formatting (default: 'id-ID')
   * @returns {String} - Formatted date string
   */
  const formatDate = (date, locale = 'id-ID') => {
    return new Date(date).toLocaleString(locale);
  };
  
  module.exports = {
    formatFileSize,
    formatDate
  };

/**
 * Show share management page for an item
 */
const manageShares = async (req, res) => {
  try {
    const { id } = req.params;
    const errorMessage = req.query.error;
    const successMessage = req.query.success;
    
    // Find the item
    const item = await Scenario.findByPk(id, {
      include: [{ model: User, as: 'owner' }]
    });
    
    if (!item) {
      return res.redirect('/scenarios?error=Item tidak ditemukan');
    }
    
    // Only admin or owner can manage shares
    if (req.user.role !== 'admin' && item.userId !== req.user.id) {
      return res.redirect('/scenarios?error=Anda tidak memiliki izin untuk mengelola share');
    }
    
    // Get current shares
    const shares = await ScenarioShare.findAll({
      where: { scenarioId: id },
      include: [{ model: User }]
    });
    
    // Get list of users for sharing (exclude owner and already shared users)
    const sharedUserIds = [item.userId, ...shares.map(share => share.userId)];
    const availableUsers = await User.findAll({
      where: {
        id: { [Op.notIn]: sharedUserIds },
        status: 'active'
      }
    });
    
    res.render('scenarios/shares', {
      title: `Manage Shares - ${item.name}`,
      activeMenu: 'scenarios',
      item,
      shares,
      availableUsers,
      error: errorMessage,
      success: successMessage,
      formatFileSize: viewHelpers.formatFileSize // Add this line to pass the function
    });
  } catch (error) {
    console.error('Error loading share management:', error);
    res.redirect('/scenarios?error=Gagal memuat pengelolaan share');
  }
};