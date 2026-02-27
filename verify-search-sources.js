const SearchEngine = require('./src/SearchEngine');

async function verifySearchSources() {
  console.log('验证搜索结果来源...');
  
  const searchEngine = new SearchEngine();
  
  // 索引示例目录
  try {
    console.log('\n开始索引 ./example 目录...');
    await searchEngine.indexDirectory('./example');
    
    console.log('\n索引完成，文档总数:', Object.keys(searchEngine.documents).length);
    
    // 列出所有索引的文档
    console.log('\n索引的文档列表:');
    for (const docId in searchEngine.documents) {
      const doc = searchEngine.documents[docId];
      const extension = doc.path.split('.').pop().toLowerCase();
      console.log(`- ${doc.title} (${doc.path}) - 扩展名: ${extension} - 内容长度: ${doc.content.length}`);
    }
    
    // 测试搜索
    console.log('\n执行搜索测试...');
    const searchTerms = ['sample', 'document', 'html', 'markdown'];
    
    for (const term of searchTerms) {
      console.log(`\n搜索 "${term}":`);
      try {
        const results = searchEngine.search(term, 10);
        if (results.length > 0) {
          results.forEach((result, i) => {
            const extension = result.path.split('.').pop().toLowerCase();
            console.log(`${i+1}. ${result.title} (${extension}) - 评分: ${result.score.toFixed(2)}`);
            console.log(`   片段: ${result.snippet.substring(0, 100)}...`);
          });
        } else {
          console.log('   没有找到结果');
        }
      } catch (err) {
        console.log(`   搜索出错: ${err.message}`);
      }
    }
    
  } catch (err) {
    console.error('索引过程出错:', err);
  }
}

verifySearchSources();