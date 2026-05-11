const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text content from various file types
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - MIME type of the file
 * @param {string} filename - Original filename
 * @returns {Promise<string>} Extracted text content
 */
async function extractTextFromFile(buffer, mimeType, filename) {
  try {
    switch (mimeType) {
      case 'application/pdf':
        const pdfData = await pdfParse(buffer);
        return pdfData.text;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;

      case 'text/plain':
      case 'text/markdown':
      case 'application/json':
        return buffer.toString('utf-8');

      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image/webp':
        return `[Image file: ${filename}] - Image content analysis requires vision capabilities`;

      default:
        if (mimeType.startsWith('text/')) {
          return buffer.toString('utf-8');
        }
        return `[Unsupported file type: ${mimeType}] - Cannot extract text from ${filename}`;
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return `[Error extracting text from ${filename}: ${error.message}]`;
  }
}

/**
 * Convert file buffer to base64 for Gemini multimodal API
 * @param {Buffer} buffer - File buffer
 * @returns {string} Base64 encoded string
 */
function bufferToBase64(buffer) {
  return buffer.toString('base64');
}

/**
 * Process file for Gemini multimodal API (images, PDFs)
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - MIME type of the file
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} File data for Gemini API
 */
async function processFileForGemini(buffer, mimeType, filename) {
  try {
    // For images and PDFs, convert to base64 for Gemini API
    if (
      mimeType === 'application/pdf' ||
      mimeType.startsWith('image/')
    ) {
      const base64Data = bufferToBase64(buffer);
      return {
        success: true,
        isImage: mimeType.startsWith('image/'),
        isPdf: mimeType === 'application/pdf',
        mimeType,
        base64: base64Data,
        filename
      };
    }

    // For text-based files, extract text normally
    const textContent = await extractTextFromFile(buffer, mimeType, filename);
    return {
      success: true,
      isText: true,
      text: textContent,
      filename
    };
  } catch (error) {
    console.error('Error processing file for Gemini:', error);
    return {
      success: false,
      error: error.message,
      filename
    };
  }
}

module.exports = {
  extractTextFromFile,
  processFileForGemini,
  bufferToBase64
};