const { OpenAI } = require('openai');
const fs = require('fs');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract text from an image using OpenAI Vision API
 * @param {String} imagePath - Path to the image file
 * @returns {Promise<Object>} - Extracted data from the image
 */
async function extractTextFromImage(imagePath) {
  try {
    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Call OpenAI API with the updated model
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Updated to use the current recommended model for vision tasks
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text content from this image. Return the extracted content as a JSON object that preserves the structure of the data, including key-value pairs. Identify tables, lists, and other structured elements."
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
      max_tokens: 1000
    });

    // Parse the response to get the extracted data
    const extractedContent = response.choices[0].message.content;
    
    try {
      // Try to parse the response as JSON
      return {
        rawResponse: extractedContent,
        extractedData: JSON.parse(extractedContent),
        status: 'success'
      };
    } catch (parseError) {
      // If parsing fails, return the raw text
      return {
        rawResponse: extractedContent,
        extractedData: { text: extractedContent },
        status: 'success'
      };
    }
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return {
      status: 'error',
      message: error.message || 'Failed to extract text from image'
    };
  }
}

module.exports = {
  extractTextFromImage
};