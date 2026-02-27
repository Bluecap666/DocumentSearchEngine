const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const lunr = require('lunr');
const HtmlService = require('./services/HtmlService');
const MarkdownService = require('./services/MarkdownService');

class SearchEngine {
  constructor() {
    this.index = null;
    this.documents = {};
    this.docServices = {
      '.html': new HtmlService(),
      '.htm': new HtmlService(),
      '.md': new MarkdownService(),
      '.markdown': new MarkdownService()
    };
  }

  /**
   * 从指定目录索引文档
   * @param {string} directory - 要索引的目录路径
   */
  async indexDirectory(directory) {
    console.log(`开始索引目录: ${directory}`);
    
    // 获取所有支持的文件类型
    const supportedExtensions = Object.keys(this.docServices);
    let allFiles = [];
    
    for (const ext of supportedExtensions) {
      const pattern = path.join(directory, `**/*${ext}`).replace(/\\/g, '/');
      const files = glob.sync(pattern, { ignore: 'node_modules/**' });
      allFiles = allFiles.concat(files);
    }

    console.log(`找到 ${allFiles.length} 个文件需要索引`);
    
    // 创建文档集合和索引器
    this.documents = {};
    
    for (const filePath of allFiles) {
      try {
        const content = await this.extractText(filePath);
        // 即使内容是空白的也记录文件信息，但只索引有内容的文档
        if (content && content.trim()) {
          const fileId = filePath;
          this.documents[fileId] = {
            id: fileId,
            content: content.trim(), // 使用trim()去除首尾空白
            title: path.basename(filePath),
            path: filePath
          };
        } else {
          console.log(`警告: ${filePath} 提取的内容为空，跳过索引`);
        }
      } catch (error) {
        console.error(`处理文件时出错 ${filePath}:`, error.message);
      }
    }

    // 构建搜索索引
    this.buildIndex();
    console.log(`索引完成，共处理了 ${Object.keys(this.documents).length} 个文档`);
  }

  /**
   * 提取文档文本内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 提取的文本内容
   */
  async extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const service = this.docServices[ext];

    if (!service) {
      console.warn(`不支持的文件格式: ${ext}, 跳过文件: ${filePath}`);
      return '';
    }

    try {
      return await service.extractText(filePath);
    } catch (error) {
      console.error(`提取文件内容失败 ${filePath}:`, error.message);
      return '';
    }
  }

  /**
   * 构建搜索索引
   */
  buildIndex() {
    // 保存对当前实例的引用，避免在lunr构建函数中出现变量提升问题
    const instance = this;
    
    this.index = lunr(function () {
      this.ref('id');
      this.field('title', { boost: 10 });
      this.field('content', { boost: 5 });
      
      // 使用实例引用获取文档
      for (const doc of Object.values(instance.documents)) {
        this.add(doc);
      }
    });
  }

  /**
   * 执行搜索
   * @param {string} query - 搜索查询
   * @param {number} limit - 结果数量限制
   * @returns {Array} - 搜索结果
   */
  search(query, limit = 10) {
    if (!this.index) {
      throw new Error('搜索引擎尚未初始化，请先调用indexDirectory方法');
    }

    const results = this.index.search(query);
    const searchResults = [];

    for (const result of results.slice(0, limit)) {
      const doc = this.documents[result.ref];
      if (doc) {
        // 获取匹配内容的片段
        const snippet = this.getSnippet(doc.content, query, 150);
        
        searchResults.push({
          id: doc.id,
          title: doc.title,
          path: doc.path,
          snippet: snippet,
          score: result.score
        });
      }
    }

    return searchResults;
  }

  /**
   * 获取匹配内容的片段
   * @param {string} content - 文档内容
   * @param {string} query - 查询词
   * @param {number} maxLength - 片段最大长度
   * @returns {string} - 内容片段
   */
  getSnippet(content, query, maxLength = 150) {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // 查找查询词在内容中的位置
    const idx = lowerContent.indexOf(lowerQuery);
    let start = 0;
    let end = maxLength;

    if (idx !== -1) {
      // 以查询词为中心，前后各取一些字符
      start = Math.max(0, idx - Math.floor(maxLength / 4));
      end = Math.min(content.length, start + maxLength);
      
      // 如果起始位置不是开头，在前面加省略号
      if (start > 0) {
        start = Math.min(start, content.lastIndexOf(' ', start) === -1 ? start : content.lastIndexOf(' ', start));
      }
      
      // 如果结束位置不是结尾，在后面加省略号
      if (end < content.length) {
        const nextSpace = content.indexOf(' ', end);
        end = nextSpace === -1 ? end : nextSpace;
      }
    } else {
      // 如果没找到查询词，则取内容的前maxLength个字符
      end = Math.min(content.length, maxLength);
    }

    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }
}

module.exports = SearchEngine;