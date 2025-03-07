/**
 * Mengkonversi data array JSON ke format tabel HTML
 * @param {Object} jsonData - Data JSON yang berisi array objek
 * @param {String} arrayKey - Nama key yang berisi array (misalnya 'data')
 * @returns {String} - HTML tabel yang diformat
 */
function formatJsonArrayToTable(jsonData, arrayKey = 'data') {
  // Pastikan data valid dan array ada
  if (!jsonData || !jsonData[arrayKey] || !Array.isArray(jsonData[arrayKey]) || jsonData[arrayKey].length === 0) {
    return '<div class="text-red-500 p-4">Data tidak valid atau array kosong</div>';
  }

  const dataArray = jsonData[arrayKey];
  
  // Definisikan urutan kolom yang diinginkan
  const orderedColumns = [
    'Offset', 'No', 'Name', 'DESC', 'Form', 'VLen', 'FType', 'Len', 'Data'
  ];
  
  // Buat header tabel HTML
  let tableHTML = `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 border">
        <thead>
          <tr class="bg-gray-100">
  `;

  // Tambahkan sel header untuk kolom yang diurutkan
  orderedColumns.forEach(column => {
    tableHTML += `<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">${column}</th>`;
  });

  tableHTML += `
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
  `;

  // Tambahkan baris untuk setiap item dalam array
  dataArray.forEach((item, rowIndex) => {
    const rowClass = rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    tableHTML += `<tr class="${rowClass}">`;
    
    // Tambahkan sel untuk setiap kolom dalam urutan yang ditentukan
    orderedColumns.forEach(column => {
      const value = item.hasOwnProperty(column) ? item[column] : '';
      tableHTML += `<td class="px-3 py-2 text-sm text-gray-500 border-r">${value}</td>`;
    });
    
    tableHTML += `</tr>`;
  });

  tableHTML += `
        </tbody>
      </table>
    </div>
  `;

  return tableHTML;
}

/**
 * Fungsi untuk memproses response JSON dari OpenAI dan mengkonversi data array ke tabel HTML
 * @param {Object} extractedData - Data yang diekstraksi dari OpenAI
 * @returns {Object} - Data yang diformat dengan HTML tabel
 */
function processExtractedJsonData(extractedData) {
  // Cek apakah data berisi property 'data' dengan array
  if (extractedData && extractedData.data && Array.isArray(extractedData.data)) {
    // Konversi ke format tabel HTML
    const tableHTML = formatJsonArrayToTable(extractedData);
    return {
      tableHTML: tableHTML,
      rawData: extractedData
    };
  }
  
  // Jika tidak sesuai format yang diharapkan, kembalikan data asli
  return {
    tableHTML: null,
    rawData: extractedData
  };
}

module.exports = {
  formatJsonArrayToTable,
  processExtractedJsonData
};