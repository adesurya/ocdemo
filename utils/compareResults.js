/**
 * Compare extracted data from two images and identify differences
 * @param {Object} hpuxData - Data extracted from HPUX image
 * @param {Object} linuxData - Data extracted from Linux image
 * @returns {Object} - Comparison results with differences
 */
function compareExtractedData(hpuxData, linuxData) {
    // If either input is not a proper object, handle gracefully
    if (!hpuxData || !linuxData || typeof hpuxData !== 'object' || typeof linuxData !== 'object') {
      return {
        status: 'error',
        message: 'Invalid data format for comparison'
      };
    }
  
    try {
      const differences = {};
      const allKeys = new Set([...Object.keys(hpuxData), ...Object.keys(linuxData)]);
      
      // Compare each key from both objects
      for (const key of allKeys) {
        // If key exists in both objects
        if (hpuxData.hasOwnProperty(key) && linuxData.hasOwnProperty(key)) {
          // If values are different
          if (JSON.stringify(hpuxData[key]) !== JSON.stringify(linuxData[key])) {
            differences[key] = {
              hpux: hpuxData[key],
              linux: linuxData[key]
            };
          }
        } 
        // If key exists only in HPUX data
        else if (hpuxData.hasOwnProperty(key)) {
          differences[key] = {
            hpux: hpuxData[key],
            linux: null
          };
        } 
        // If key exists only in Linux data
        else if (linuxData.hasOwnProperty(key)) {
          differences[key] = {
            hpux: null,
            linux: linuxData[key]
          };
        }
      }
  
      return {
        status: 'success',
        differences: differences,
        differenceCount: Object.keys(differences).length,
        identical: Object.keys(differences).length === 0
      };
    } catch (error) {
      console.error('Error comparing data:', error);
      return {
        status: 'error',
        message: 'Error comparing extracted data',
        error: error.message
      };
    }
  }
  
  /**
   * Format comparison results for display with highlighting
   * @param {Object} hpuxData - Data extracted from HPUX image
   * @param {Object} linuxData - Data extracted from Linux image
   * @param {Object} differences - Differences object from compareExtractedData
   * @returns {Object} - Formatted results for display
   */
  function formatComparisonResults(hpuxData, linuxData, differences) {
    function getFormattedValue(obj, key, source) {
      if (!obj.hasOwnProperty(key)) {
        return '<span class="text-red-500">Key not present</span>';
      }
      
      const value = obj[key];
      
      // If this key has differences and the current source is in the differences
      if (differences.hasOwnProperty(key) && differences[key].hasOwnProperty(source)) {
        // Highlight the value
        if (typeof value === 'object' && value !== null) {
          return `<span class="bg-yellow-200">${JSON.stringify(value)}</span>`;
        } else {
          return `<span class="bg-yellow-200">${value}</span>`;
        }
      }
      
      // No difference or not in this source
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      } else {
        return value;
      }
    }
    
    // Get all keys from both objects
    const allKeys = new Set([...Object.keys(hpuxData), ...Object.keys(linuxData)]);
    
    // Create formatted display for both sides
    const formattedHpux = {};
    const formattedLinux = {};
    
    for (const key of allKeys) {
      formattedHpux[key] = getFormattedValue(hpuxData, key, 'hpux');
      formattedLinux[key] = getFormattedValue(linuxData, key, 'linux');
    }
    
    return {
      hpux: formattedHpux,
      linux: formattedLinux
    };
  }
  
  module.exports = {
    compareExtractedData,
    formatComparisonResults
  };