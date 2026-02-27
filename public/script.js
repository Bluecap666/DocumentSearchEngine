document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    const limitSelect = document.getElementById('limit');
    const indexPathInput = document.getElementById('indexPath');
    const indexBtn = document.getElementById('indexBtn');
    const statusDiv = document.getElementById('status');

    // 页面加载时自动索引一次，默认索引 example 目录
    window.addEventListener('load', function() {
        const defaultIndexPath = './example';
        indexPathInput.value = defaultIndexPath;
        indexDocuments(defaultIndexPath);
    });

    // 搜索表单提交事件
    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        const limit = limitSelect.value;

        if (!query) {
            alert('请输入搜索关键字');
            return;
        }

        performSearch(query, limit);
    });

    // 索引按钮点击事件
    indexBtn.addEventListener('click', async function() {
        const indexPath = indexPathInput.value.trim();
        
        if (!indexPath) {
            alert('请输入索引目录路径');
            return;
        }

        await indexDocuments(indexPath);
    });

    // 执行搜索
    async function performSearch(query, limit) {
        try {
            resultsContainer.innerHTML = '<div class="loading">正在搜索...</div>';
            
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`搜索失败: ${response.statusText}`);
            }
            
            const data = await response.json();
            displayResults(data.results, query);
        } catch (error) {
            console.error('搜索错误:', error);
            resultsContainer.innerHTML = `<div class="error">搜索错误: ${error.message}</div>`;
        }
    }

    // 显示搜索结果
    function displayResults(results, query) {
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">未找到匹配的结果</div>';
            resultsCount.textContent = '找到 0 条结果';
            return;
        }

        resultsCount.textContent = `找到 ${results.length} 条结果`;
        
        let html = '';
        results.forEach(result => {
            // 高亮显示查询关键词
            let snippet = result.snippet || '';
            const queryRegex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
            snippet = snippet.replace(queryRegex, '<span class="highlight">$1</span>');
            
            // 所有文件都使用文档查看器
            const linkUrl = `/view-document.html?path=${encodeURIComponent(result.path)}&searchTerm=${encodeURIComponent(query)}`;
            const linkTitle = result.title;
            
            html += `
                <div class="result-item">
                    <div class="result-title">
                        <a href="${linkUrl}" 
                           target="_blank"
                           onclick="trackResultClick('${result.path}')">
                            ${linkTitle}
                        </a>
                    </div>
                    <div class="result-path">${result.path}</div>
                    <div class="result-snippet">${snippet}</div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
    }

    // 跟踪结果点击
    window.trackResultClick = function(path) {
        console.log(`点击了结果: ${path}`);
        // 这里可以添加分析或其他逻辑
    };

    // 转义正则表达式特殊字符
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 索引文档
    async function indexDocuments(indexPath) {
        try {
            statusDiv.textContent = '正在索引文档...';
            statusDiv.style.color = '#f39c12';
            
            const response = await fetch('/api/index', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ directory: indexPath })
            });
            
            if (!response.ok) {
                throw new Error(`索引失败: ${response.statusText}`);
            }
            
            const data = await response.json();
            statusDiv.textContent = '索引完成！';
            statusDiv.style.color = '#27ae60';
            
            // 清除状态消息
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 3000);
            
            console.log('索引结果:', data);
        } catch (error) {
            console.error('索引错误:', error);
            statusDiv.textContent = `索引错误: ${error.message}`;
            statusDiv.style.color = '#e74c3c';
        }
    }
});