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
        differences.push({
          type: 'line',
          lineNumber: i + 1,
          hpuxLine,
          linuxLine
        });
        differenceCount++;
      }
    }
    
    return {
      hpuxEncoding: hpuxData.encoding,
      linuxEncoding: linuxData.encoding,
      differences,
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
  readFileWithEncoding
};