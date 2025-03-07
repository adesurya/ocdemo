/**
 * View helper functions for EJS templates
 */

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