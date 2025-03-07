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
    // Get all keys from both objects
    const allKeys = new Set([...Object.keys(hpuxData), ...Object.keys(linuxData)]);
    
    // Generate HTML table for display
    function generateTableHTML(data, source) {
      let tableHTML = `
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
              <th class="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
      `;
      
      // Add rows for each key
      let i = 0;
      for (const key of allKeys) {
        const rowClass = i % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        const hasDiff = differences.hasOwnProperty(key);
        const diffClass = hasDiff ? 'bg-yellow-50' : '';
        
        tableHTML += `<tr class="${rowClass} ${diffClass}">`;
        tableHTML += `<td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${key}</td>`;
        
        // Check if key exists in this data
        if (data.hasOwnProperty(key)) {
          const value = data[key];
          const displayValue = typeof value === 'object' && value !== null ? 
            JSON.stringify(value) : value;
            
          // Apply highlighting for differences
          if (hasDiff && differences[key].hasOwnProperty(source)) {
            tableHTML += `<td class="px-3 py-2 text-sm text-gray-500"><span class="bg-yellow-200">${displayValue}</span></td>`;
          } else {
            tableHTML += `<td class="px-3 py-2 text-sm text-gray-500">${displayValue}</td>`;
          }
        } else {
          tableHTML += `<td class="px-3 py-2 text-sm text-red-500">Key not present</td>`;
        }
        
        tableHTML += `</tr>`;
        i++;
      }
      
      tableHTML += `
          </tbody>
        </table>
      `;
      
      return tableHTML;
    }
    
    return {
      hpuxTableHTML: generateTableHTML(hpuxData, 'hpux'),
      linuxTableHTML: generateTableHTML(linuxData, 'linux')
    };
  }
  
  
  module.exports = {
    compareExtractedData,
    formatComparisonResults
  };