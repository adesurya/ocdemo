/**
 * Utility functions to convert any OpenAI response into valid JSON format
 */

/**
 * Convert any OpenAI response to valid JSON with expected structure
 * @param {String} rawResponse - Raw response from OpenAI
 * @returns {Object} - Structured data object with standard format
 */
function convertToValidJson(rawResponse) {
    if (!rawResponse) {
      console.log('Empty response received, returning default structure');
      return createDefaultStructure();
    }
    
    console.log('Converting OpenAI response to valid JSON');
    
    try {
      // Case 1: Response is already valid JSON
      try {
        const parsedData = JSON.parse(rawResponse);
        return normalizeStructure(parsedData);
      } catch (initialError) {
        console.log('Initial parsing failed, trying alternative approaches');
      }
      
      // Case 2: Response contains markdown code blocks
      if (rawResponse.includes('```json')) {
        console.log('Detected markdown JSON block');
        const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const extractedJson = JSON.parse(jsonMatch[1].trim());
            return normalizeStructure(extractedJson);
          } catch (markdownError) {
            console.log('Failed to parse markdown JSON block');
          }
        }
      }
      
      // Case 3: Response has a JSON-like structure
      if (rawResponse.includes('{') && rawResponse.includes('}')) {
        console.log('Attempting to extract JSON-like structure');
        const jsonMatch = rawResponse.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const extractedJson = JSON.parse(jsonMatch[1].trim());
            return normalizeStructure(extractedJson);
          } catch (structureError) {
            console.log('Failed to parse JSON-like structure');
          }
        }
      }
      
      // Case 4: Find all key-value pairs
      console.log('Attempting to extract key-value pairs');
      const keyValuePairs = extractKeyValuePairs(rawResponse);
      if (Object.keys(keyValuePairs).length > 0) {
        return normalizeStructure(keyValuePairs);
      }
      
      // Case 5: Parse as plain text
      console.log('Treating response as plain text');
      return {
        data: [
          {
            text: rawResponse,
            extracted: true
          }
        ]
      };
      
    } catch (error) {
      console.error('Error in convertToValidJson:', error);
      return createDefaultStructure();
    }
  }
  
  /**
   * Normalize data structure to ensure it follows expected format
   * @param {Object} data - Data object to normalize
   * @returns {Object} - Normalized data object
   */
  function normalizeStructure(data) {
    try {
      // If data is null or undefined, return default structure
      if (!data) {
        return createDefaultStructure();
      }
      
      // If data is already an array, wrap it in the expected structure
      if (Array.isArray(data)) {
        return {
          data: data.map(normalizeRow)
        };
      }
      
      // If data has a 'data' property that is an array, normalize it
      if (data.data && Array.isArray(data.data)) {
        return {
          data: data.data.map(normalizeRow)
        };
      }
      
      // If data is a string that looks like JSON, try to parse it
      if (typeof data === 'string' && data.includes('{') && data.includes('}')) {
        try {
          const parsedData = JSON.parse(data);
          return normalizeStructure(parsedData);
        } catch (parseError) {
          console.log('Failed to parse string as JSON');
        }
      }
      
      // If data is an object but not in the expected format, wrap it
      if (typeof data === 'object') {
        if (Object.keys(data).length === 0) {
          return createDefaultStructure();
        }
        
        // Check if it has the expected properties of a row
        const hasExpectedProps = ['Offset', 'No', 'Name', 'DESC', 'Form', 'VLen', 'FType', 'Len', 'Data']
          .some(prop => data.hasOwnProperty(prop));
        
        if (hasExpectedProps) {
          return {
            data: [normalizeRow(data)]
          };
        }
        
        // If it's some other object, convert its properties to rows
        const rows = [];
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'object' && value !== null) {
            rows.push(normalizeRow(value, key));
          } else {
            rows.push({
              Name: key,
              Value: String(value),
              Offset: '',
              No: rows.length + 1,
              DESC: '',
              Form: '',
              VLen: '',
              FType: '',
              Len: '',
              Data: String(value)
            });
          }
        }
        
        return {
          data: rows
        };
      }
      
      // Fallback to default structure
      return createDefaultStructure();
      
    } catch (error) {
      console.error('Error in normalizeStructure:', error);
      return createDefaultStructure();
    }
  }
  
  /**
   * Normalize a single row to ensure it has all expected properties
   * @param {Object} row - Row data to normalize
   * @param {String} name - Optional name for the row
   * @returns {Object} - Normalized row
   */
  function normalizeRow(row, name = '') {
    try {
      if (!row || typeof row !== 'object') {
        return createDefaultRow(name);
      }
      
      const normalizedRow = {
        Offset: row.Offset || row.offset || '',
        No: row.No || row.no || '',
        Name: row.Name || row.name || name || '',
        DESC: row.DESC || row.desc || row.Desc || row.description || row.Description || '',
        Form: row.Form || row.form || '',
        VLen: row.VLen || row.vlen || row.Vlen || '',
        FType: row.FType || row.ftype || row.Ftype || row.type || row.Type || '',
        Len: row.Len || row.len || row.length || row.Length || '',
        Data: row.Data || row.data || row.value || row.Value || ''
      };
      
      return normalizedRow;
    } catch (error) {
      console.error('Error in normalizeRow:', error);
      return createDefaultRow(name);
    }
  }
  
  /**
   * Create a default data structure
   * @returns {Object} - Default structure
   */
  function createDefaultStructure() {
    return {
      data: []
    };
  }
  
  /**
   * Create a default row with the given name
   * @param {String} name - Name for the row
   * @returns {Object} - Default row
   */
  function createDefaultRow(name = '') {
    return {
      Offset: '',
      No: '',
      Name: name,
      DESC: '',
      Form: '',
      VLen: '',
      FType: '',
      Len: '',
      Data: ''
    };
  }
  
  /**
   * Extract key-value pairs from text
   * @param {String} text - Text to extract from
   * @returns {Object} - Extracted key-value pairs
   */
  function extractKeyValuePairs(text) {
    if (!text || typeof text !== 'string') {
      return {};
    }
    
    const result = {};
    
    // Look for patterns like "Key: Value" or "Key = Value"
    const lines = text.split('\n');
    for (const line of lines) {
      const keyValueMatch = line.match(/([^:=]+)[:=]\s*(.+)/);
      if (keyValueMatch) {
        const key = keyValueMatch[1].trim();
        const value = keyValueMatch[2].trim();
        result[key] = value;
      }
    }
    
    return result;
  }
  
  module.exports = {
    convertToValidJson,
    normalizeStructure,
    normalizeRow
  };