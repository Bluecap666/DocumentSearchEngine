const SearchEngine = require('../src/SearchEngine');
const fs = require('fs').promises;
const path = require('path');

describe('SearchEngine', () => {
  let searchEngine;

  beforeEach(() => {
    searchEngine = new SearchEngine();
  });

  describe('extractText', () => {
    test('should extract text from markdown file', async () => {
      // 创建临时测试文件
      const testDir = path.join(__dirname, 'temp');
      const testMdFile = path.join(testDir, 'test.md');
      
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(testMdFile, '# Test\n\nThis is a test markdown file.');
      
      try {
        const content = await searchEngine.extractText(testMdFile);
        expect(content).toContain('Test');
        expect(content).toContain('test markdown file');
      } finally {
        await fs.unlink(testMdFile);
        await fs.rmdir(testDir);
      }
    });

    test('should handle unsupported file formats', async () => {
      const result = await searchEngine.extractText('test.xyz');
      expect(result).toBe('');
    });
  });

  describe('getSnippet', () => {
    test('should return a text snippet containing the search term', () => {
      const content = 'This is a long content with some sample text for testing purposes.';
      const snippet = searchEngine.getSnippet(content, 'sample', 50);
      
      expect(snippet.length).toBeLessThanOrEqual(50);
      expect(snippet).toContain('sample');
    });
  });
});