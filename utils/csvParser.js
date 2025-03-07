const fs = require('fs');
const Papa = require('papaparse');

/**
 * Parsing file CSV atau TXT ke dalam format yang terstruktur
 * @param {String} filePath - Path ke file CSV atau TXT
 * @returns {Promise<Object>} - Data yang sudah diparsing
 */
const parseFile = async (filePath) => {
  try {
    // Read file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileExt = filePath.split('.').pop().toLowerCase();
    
    // Handle berdasarkan ekstensi file
    if (fileExt === 'txt') {
      return parseTXTFile(fileContent);
    } else {
      return parseCSVFile(fileContent);
    }
  } catch (error) {
    throw new Error(`Error parsing file: ${error.message}`);
  }
};

/**
 * Parse CSV file content
 * @param {String} fileContent - Isi file CSV
 * @returns {Object} - Data terstruktur hasil parsing
 */
const parseCSVFile = (fileContent) => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Parse TXT file dengan format fixed-width seperti pada screenshot
 * @param {String} fileContent - Isi file TXT
 * @returns {Object} - Data terstruktur hasil parsing
 */
const parseTXTFile = (fileContent) => {
  try {
    const lines = fileContent.split('\n');
    const data = [];
    
    // Kolom standar yang diharapkan
    const standardColumns = ['Offset', 'No', 'Name', 'DESC', 'Form', 'VLen', 'FTyp', 'Len', 'Data'];
    
    // Skip header line jika ada
    let startLine = 0;
    if (lines[0].includes('Offset') && lines[0].includes('No') && lines[0].includes('Name')) {
      startLine = 1;
    }
    
    // Process each line
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Parse fixed-width format
      const parsedLine = parseFixedWidthLine(line);
      if (parsedLine) {
        data.push(parsedLine);
      }
    }
    
    return { data };
  } catch (error) {
    console.error('Error parsing TXT file:', error);
    throw error;
  }
};

/**
 * Parse single line dengan format fixed-width
 * @param {String} line - Baris teks untuk diparse
 * @returns {Object} - Object hasil parsing
 */
const parseFixedWidthLine = (line) => {
  try {
    // Cek pola line untuk format yang diberikan dalam screenshot
    // Format: Offset  No   Name                         DESC                                                  Form   VLen   FTyp  Len Data
    
    // Menggunakan regex untuk menangkap nilai dari setiap kolom
    // Pattern awal berdasarkan screenshot
    const pattern = /^\s*(\d+)\s+(-?\d+)\s+(\S+)\s+\[([^\]]+)\]\s+\]\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(\S+)$/;
    
    // Pattern alternatif jika pattern awal tidak cocok
    const altPattern = /^\s*(\d+)\s+(-?\d+)\s+(\S+)\s+\[([^\]]+)\s*\]\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(\[.+\]|\S+)$/;
    
    // Pattern fleksibel untuk berbagai format TXT
    const flexPattern = /^\s*(\d+)\s+(-?\d+)\s+(\S+)\s+\[([^\]]+)\]\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(.+)$/;
    
    let match = line.match(pattern);
    if (!match) match = line.match(altPattern);
    if (!match) match = line.match(flexPattern);
    
    if (match) {
      return {
        Offset: match[1],
        No: match[2],
        Name: match[3],
        DESC: match[4],
        Form: match[5],
        VLen: match[6],
        FTyp: match[7],
        Len: match[8],
        Data: match[9]
      };
    }
    
    // Jika tidak cocok dengan pattern, coba parsing berdasarkan whitespace
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length >= 9) {
      // Karena DESC bisa mengandung spasi, gabungkan yang seharusnya menjadi DESC
      const offset = parts[0];
      const no = parts[1];
      const name = parts[2];
      
      // Cari bagian DESC
      let descStart = line.indexOf('[');
      let descEnd = line.indexOf(']', descStart);
      const desc = descStart !== -1 && descEnd !== -1 ? 
                  line.substring(descStart + 1, descEnd) : 'Unknown';
      
      // Cari kolom-kolom setelah DESC
      const remainingText = line.substring(descEnd + 1).trim();
      const remainingParts = remainingText.split(/\s+/).filter(Boolean);
      
      // Tentukan kolom-kolom yang tersisa
      const form = remainingParts[0] || 'F';
      const vlen = remainingParts[1] || '.';
      const ftyp = remainingParts[2] || 'I';
      const len = remainingParts[3] || '1';
      
      // Data biasanya di bracket
      let data = remainingParts.slice(4).join(' ');
      if (data.startsWith('[') && data.endsWith(']')) {
        data = data;
      } else {
        // Coba temukan bagian data
        const dataStart = line.lastIndexOf('[');
        const dataEnd = line.lastIndexOf(']');
        if (dataStart !== -1 && dataEnd !== -1 && dataStart > descEnd) {
          data = line.substring(dataStart, dataEnd + 1);
        } else {
          data = remainingParts.slice(4).join(' ');
        }
      }
      
      return {
        Offset: offset,
        No: no,
        Name: name,
        DESC: desc,
        Form: form,
        VLen: vlen,
        FTyp: ftyp,
        Len: len,
        Data: data
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing line:', line, error);
    return null;
  }
};

/**
 * Membandingkan dua objek data
 * @param {Array} hpuxData - Data dari file HPUX
 * @param {Array} linuxData - Data dari file Linux
 * @returns {Object} - Hasil perbandingan
 */
const compareData = (hpuxData, linuxData) => {
  const differences = {};
  const allRows = new Set();
  
  // Collect all row identifiers (assuming 'No' or 'Offset' as identifier)
  hpuxData.forEach(row => {
    const identifier = row.No || row.Offset;
    if (identifier) allRows.add(identifier);
  });
  
  linuxData.forEach(row => {
    const identifier = row.No || row.Offset;
    if (identifier) allRows.add(identifier);
  });
  
  // Compare each row
  for (const rowId of allRows) {
    const hpuxRow = hpuxData.find(row => (row.No && row.No === rowId) || (row.Offset && row.Offset === rowId));
    const linuxRow = linuxData.find(row => (row.No && row.No === rowId) || (row.Offset && row.Offset === rowId));
    
    // If row exists in both files
    if (hpuxRow && linuxRow) {
      const rowDiffs = {};
      let hasDifference = false;
      
      // Compare all fields
      const allColumns = new Set([
        ...Object.keys(hpuxRow),
        ...Object.keys(linuxRow)
      ]);
      
      for (const column of allColumns) {
        const hpuxValue = hpuxRow[column];
        const linuxValue = linuxRow[column];
        
        if (hpuxValue !== linuxValue) {
          rowDiffs[column] = {
            hpux: hpuxValue,
            linux: linuxValue
          };
          hasDifference = true;
        }
      }
      
      if (hasDifference) {
        differences[rowId] = {
          hpux: hpuxRow,
          linux: linuxRow,
          diffColumns: rowDiffs
        };
      }
    } 
    // Row only in HPUX
    else if (hpuxRow) {
      differences[rowId] = {
        hpux: hpuxRow,
        linux: null,
        onlyIn: 'hpux'
      };
    } 
    // Row only in Linux
    else if (linuxRow) {
      differences[rowId] = {
        hpux: null,
        linux: linuxRow,
        onlyIn: 'linux'
      };
    }
  }
  
  return {
    differences,
    differenceCount: Object.keys(differences).length,
    identical: Object.keys(differences).length === 0
  };
};

module.exports = {
  parseFile,
  parseCSVFile,
  parseTXTFile,
  compareData
};