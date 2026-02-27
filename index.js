const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const SearchEngine = require('./src/SearchEngine');

const app = express();
const port = 3000;

// 中间件设置
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // 提供静态文件服务

// 初始化搜索引擎
let searchEngine;
try {
  searchEngine = new SearchEngine();
} catch (error) {
  console.error('Failed to initialize search engine:', error);
  process.exit(1);
}

// 验证是否为合法的文档路径（防止路径遍历攻击）
function isValidDocumentPath(resolvedPath) {
  // 检查文件扩展名
  const supportedExtensions = ['.txt', '.md', '.markdown', '.html', '.htm'];
  const ext = path.extname(resolvedPath).toLowerCase();
  
  // 对于非文本文件，我们不能直接返回其内容
  const textExtensions = ['.txt', '.md', '.markdown', '.html', '.htm'];
  
  // 检查文件是否存在于索引中，如果是文本文件则允许，否则只允许已知索引的文件
  if (!textExtensions.includes(ext)) {
    // 检查是否在搜索引擎的文档集合中
    return searchEngine && searchEngine.documents && searchEngine.documents.hasOwnProperty(resolvedPath) && resolvedPath.startsWith(path.resolve('.'));
  }
  
  return textExtensions.includes(ext) && resolvedPath.startsWith(path.resolve('.'));
}

// 搜索API
app.get('/api/search', async (req, res) => {
  const { q: query, limit = 10 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const results = await searchEngine.search(query, parseInt(limit));
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

// 索引API
app.post('/api/index', async (req, res) => {
  const { directory } = req.body;
  
  if (!directory) {
    return res.status(400).json({ error: 'Directory path is required' });
  }

  try {
    await searchEngine.indexDirectory(directory);
    res.json({ message: `Indexed documents from ${directory}` });
  } catch (error) {
    console.error('Indexing error:', error);
    res.status(500).json({ error: 'Internal server error during indexing' });
  }
});

// 获取文档内容API
app.get('/api/document-content', async (req, res) => {
  const { path: docPath } = req.query;
  
  if (!docPath) {
    return res.status(400).json({ error: 'Document path is required' });
  }

  try {
    // 解码路径并验证安全性，防止路径遍历攻击
    const decodedPath = decodeURIComponent(docPath);
    const resolvedPath = path.resolve(decodedPath);
    const basePath = path.resolve('.'); // 限制在应用根目录内
    
    // 确保请求的路径在应用程序目录内
    if (!resolvedPath.startsWith(basePath) || !isValidDocumentPath(resolvedPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const content = await fs.readFile(resolvedPath, 'utf8');
    res.json({ content });
  } catch (error) {
    console.error('Error reading document:', error);
    res.status(500).json({ error: 'Failed to read document' });
  }
});

// 根路由 - 返回搜索页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Document Search Engine listening at http://localhost:${port}`);
});