const fs = require('fs');
const iconv = require('iconv-lite');

/**
 * Detect file encoding (ASCII or EBCDIC)
 * @param {Buffer} buffer - File buffer to analyze
 * @returns {String} - Detected encoding ('ascii' or 'ebcdic')
 */
function detectEncoding(buffer) {
  // Simple heuristic to detect EBCDIC vs ASCII
  // EBCDIC text files often have many bytes in the ranges 0x40-0x5A and 0x60-0x7A
  // ASCII text files have most bytes in the range 0x20-0x7E
  
  if (buffer.length === 0) return 'utf8'; // Default for empty files
  
  // Sample the first 1000 bytes (or less if file is smaller)
  const sampleSize = Math.min(buffer.length, 1000);
  
  let asciiCount = 0;
  let ebcdicCount = 0;
  
  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i];
    
    // Check for ASCII printable range
    if (byte >= 0x20 && byte <= 0x7E) {
      asciiCount++;
    }
    
    // Check for common EBCDIC ranges
    if ((byte >= 0x40 && byte <= 0x5A) || (byte >= 0x60 && byte <= 0x7A) || byte === 0x7D) {
      ebcdicCount++;
    }
  }
  
  // Calculate percentages
  const asciiPercentage = (asciiCount / sampleSize) * 100;
  const ebcdicPercentage = (ebcdicCount / sampleSize) * 100;
  
  // Binary files typically have a low percentage of ASCII printable characters
  if (asciiPercentage < 30 && ebcdicPercentage < 30) {
    return 'binary';
  }
  
  // Determine encoding based on which has higher percentage
  return asciiPercentage > ebcdicPercentage ? 'utf8' : 'cp037'; // cp037 is a common EBCDIC encoding
}

/**
 * Read file with proper encoding detection
 * @param {String} filePath - Path to the file
 * @returns {Object} - Object containing file content and detected encoding
 */
function readFileWithEncoding(filePath) {
  try {
    // Read file as buffer first to detect encoding
    const buffer = fs.readFileSync(filePath);
    const encoding = detectEncoding(buffer);
    
    if (encoding === 'binary') {
      // For binary files, return a representation of hex values
      return {
        content: buffer.toString('hex').match(/.{1,2}/g).join(' '),
        encoding: 'binary',
        originalBuffer: buffer
      };
    }
    
    // Convert buffer to string with detected encoding
    let content;
    if (encoding === 'utf8') {
      content = buffer.toString('utf8');
    } else {
      // Use iconv-lite for EBCDIC conversion
      content = iconv.decode(buffer, encoding);
    }
    
    return {
      content,
      encoding,
      originalBuffer: buffer
    };
  } catch (error) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

/**
 * Find exact differences between two strings
 * @param {String} str1 - First string to compare
 * @param {String} str2 - Second string to compare 
 * @returns {Object} - Object containing details of the differences
 */
function findStringDifferences(str1, str2) {
  const differences = [];
  const maxLength = Math.max(str1.length, str2.length);
  
  // Keep track of current differences
  let currentDiff = null;
  
  for (let i = 0; i < maxLength; i++) {
    const char1 = i < str1.length ? str1[i] : null;
    const char2 = i < str2.length ? str2[i] : null;
    
    if (char1 !== char2) {
      // If we're not currently tracking a difference, start a new one
      if (currentDiff === null) {
        currentDiff = {
          position: i,
          hpuxChars: '',
          linuxChars: '',
          contextBefore: str1.substring(Math.max(0, i - 10), i),
          contextAfter: ''  // Will be filled when difference ends
        };
      }
      
      // Add the different characters
      if (char1 !== null) currentDiff.hpuxChars += char1;
      if (char2 !== null) currentDiff.linuxChars += char2;
    } else if (currentDiff !== null) {
      // The difference has ended, add context after
      currentDiff.contextAfter = str1.substring(i, Math.min(str1.length, i + 10));
      differences.push(currentDiff);
      currentDiff = null;
    }
  }
  
  // Don't forget a difference that extends to the end of the string
  if (currentDiff !== null) {
    differences.push(currentDiff);
  }
  
  return differences;
}

/**
 * Compare two files with content-aware encoding detection
 * @param {String} hpuxFilePath - Path to the HPUX file
 * @param {String} linuxFilePath - Path to the Linux file
 * @returns {Object} - Comparison result including differences
 */
function compareNonIsoFiles(hpuxFilePath, linuxFilePath) {
  try {
    const hpuxData = readFileWithEncoding(hpuxFilePath);
    const linuxData = readFileWithEncoding(linuxFilePath);
    
    const differences = [];
    const detailedDifferences = [];
    let differenceCount = 0;
    
    // Handle binary files differently
    if (hpuxData.encoding === 'binary' || linuxData.encoding === 'binary') {
      // For binary files, check if they are identical
      const hpuxBuffer = hpuxData.originalBuffer;
      const linuxBuffer = linuxData.originalBuffer;
      
      if (hpuxBuffer.length !== linuxBuffer.length) {
        differences.push({
          type: 'size',
          description: `File size difference: HPUX (${hpuxBuffer.length} bytes) vs Linux (${linuxBuffer.length} bytes)`
        });
        differenceCount++;
      }
      
      // Check first 10 differences in binary content
      let diffCount = 0;
      const maxDiffs = 10;
      
      for (let i = 0; i < Math.min(hpuxBuffer.length, linuxBuffer.length); i++) {
        if (hpuxBuffer[i] !== linuxBuffer[i] && diffCount < maxDiffs) {
          differences.push({
            type: 'binary',
            offset: i,
            hpuxValue: hpuxBuffer[i].toString(16).padStart(2, '0'),
            linuxValue: linuxBuffer[i].toString(16).padStart(2, '0')
          });
          diffCount++;
          differenceCount++;
        }
      }
      
      return {
        hpuxEncoding: hpuxData.encoding,
        linuxEncoding: linuxData.encoding,
        differences,
        differenceCount,
        binary: true
      };
    }
    
    // For text files, compare line by line
    const hpuxLines = hpuxData.content.split(/\r?\n/);
    const linuxLines = linuxData.content.split(/\r?\n/);
    
    // Find line differences
    const maxLines = Math.max(hpuxLines.length, linuxLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const hpuxLine = i < hpuxLines.length ? hpuxLines[i] : null;
      const linuxLine = i < linuxLines.length ? linuxLines[i] : null;
      
      if (hpuxLine !== linuxLine) {
        // Add to simple differences for compatibility
        differences.push({
          type: 'line',
          lineNumber: i + 1,
          hpuxLine,
          linuxLine
        });
        
        // Add detailed string-level differences
        if (hpuxLine !== null && linuxLine !== null) {
          // When both lines exist but are different, find character-level differences
          const stringDifferences = findStringDifferences(hpuxLine, linuxLine);
          
          detailedDifferences.push({
            type: 'string',
            lineNumber: i + 1,
            hpuxLine,
            linuxLine,
            stringDifferences
          });
        } else {
          // When one line is missing entirely
          detailedDifferences.push({
            type: 'missing_line',
            lineNumber: i + 1,
            hpuxLine,
            linuxLine
          });
        }
        
        differenceCount++;
      }
    }
    
    return {
      hpuxEncoding: hpuxData.encoding,
      linuxEncoding: linuxData.encoding,
      differences,        // Keep original format for backward compatibility
      detailedDifferences, // New detailed differences with string-level info
      differenceCount,
      binary: false
    };
  } catch (error) {
    throw new Error(`Comparison error: ${error.message}`);
  }
}

module.exports = {
  compareNonIsoFiles,
  detectEncoding,
  readFileWithEncoding,
  findStringDifferences
};