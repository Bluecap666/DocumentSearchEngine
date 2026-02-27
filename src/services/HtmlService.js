const cheerio = require('cheerio');
const fs = require('fs').promises;

class HtmlService {
  /**
   * 从HTML文件提取文本
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 提取的文本内容
   */
  async extractText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const $ = cheerio.load(content);
      
      // 移除脚本和样式标签
      $('script').remove();
      $('style').remove();
      
      // 提取文本内容
      const text = $.text();
      return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error(`Error extracting text from HTML file ${filePath}:`, error.message);
      throw error;
    }
  }
}

module.exports = HtmlService;