const pdfParse = require('pdf-parse');
const fs = require('fs').promises;

class PdfService {
  /**
   * 从PDF文件提取文本
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 提取的文本内容
   */
  async extractText(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    } catch (error) {
      console.error(`Error extracting text from PDF file ${filePath}:`, error.message);
      throw error;
    }
  }
}

module.exports = PdfService;
// PDF support has been removed
// This file is kept for compatibility but does nothing
