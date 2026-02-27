const mammoth = require('mammoth');
const fs = require('fs').promises;

class DocxService {
  /**
   * 从docx文件提取文本
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 提取的文本内容
   */
  async extractText(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: buffer });
      return result.value;
    } catch (error) {
      console.error(`Error extracting text from DOCX file ${filePath}:`, error.message);
      throw error;
    }
  }
}

module.exports = DocxService;
// This file has been removed as DOCX support has been discontinued
