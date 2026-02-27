const fs = require('fs').promises;
const marked = require('marked');

class MarkdownService {
  /**
   * 从Markdown文件提取文本
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 提取的文本内容
   */
  async extractText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // 将Markdown转换为HTML，然后提取纯文本
      const html = marked.parse(content);
      const text = this.htmlToText(html);
      
      return text;
    } catch (error) {
      console.error(`Error extracting text from Markdown file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * 简单的HTML到文本转换器
   * @param {string} html - HTML字符串
   * @returns {string} - 提取的文本
   */
  htmlToText(html) {
    // 使用正则表达式移除HTML标签
    return html
      .replace(/<[^>]*>/g, ' ') // 移除所有HTML标签
      .replace(/\s+/g, ' ')     // 合并多个空白字符
      .trim();
  }
}

module.exports = MarkdownService;