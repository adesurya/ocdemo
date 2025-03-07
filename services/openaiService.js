const { OpenAI } = require('openai');
const fs = require('fs');
const { convertToValidJson } = require('../utils/openaiResponseConverter');

// Initialize OpenAI client
const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract text from an image using OpenAI Vision API
 * @param {String} imagePath - Path to the image file
 * @returns {Promise<Object>} - Extracted data from the image
 */
async function extractTextFromImage(imagePath) {
  try {
    console.log(`Processing image: ${imagePath}`);
    
    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Call OpenAI API
    const response = await openAI.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text content from this image as a structured table. Create a JSON object with a property named 'data' containing an array of objects. Each object should represent a row with properties: Offset, No, Name, DESC, Form, VLen, FType, Len, and Data. Return ONLY valid JSON without any markdown, comments or explanations."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000,  // Increased token limit
      temperature: 0,    // More deterministic output
      response_format: { type: "json_object" }  // Request JSON response format
    });

    // Extract the content from response
    const rawResponse = response.choices[0].message.content;
    console.log('Raw response from OpenAI (first 100 chars):', rawResponse.substring(0, 100) + '...');
    
    // Convert OpenAI response to valid JSON structure
    const extractedData = convertToValidJson(rawResponse);
    
    console.log(`Successfully processed response with ${extractedData.data.length} rows of data`);
    
    return {
      status: 'success',
      extractedData: extractedData,  // This is guaranteed to be in the right format
      rawResponse: rawResponse
    };
    
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Even in case of error, return a valid data structure
    return {
      status: 'error',
      message: `OpenAI API error: ${error.message}`,
      extractedData: { data: [] }  // Empty data array as fallback
    };
  }
}

module.exports = {
  extractTextFromImage
};