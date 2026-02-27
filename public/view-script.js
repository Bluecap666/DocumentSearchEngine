document.addEventListener('DOMContentLoaded', function() {
    // 从URL参数中获取文档路径和搜索词
    const urlParams = new URLSearchParams(window.location.search);
    const docPath = urlParams.get('path');
    const searchTerm = urlParams.get('searchTerm') || '';

    if (!docPath) {
        document.getElementById('documentContent').innerHTML = 
            '<div class="error">错误：未提供文档路径</div>';
        return;
    }

    // 加载文档内容
    loadDocumentContent(docPath, searchTerm);
});

async function loadDocumentContent(docPath, searchTerm) {
    try {
        // 构造API端点以获取文档原始内容
        const response = await fetch(`/api/document-content?path=${encodeURIComponent(docPath)}`);
        
        if (!response.ok) {
            throw new Error(`加载文档失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.content;
        const fileExtension = getFileExtension(docPath);
        
        // 根据文件类型决定如何显示内容
        let htmlContent = '';
        if (fileExtension === '.html' || fileExtension === '.htm') {
            // 对于HTML文件，直接插入内容
            htmlContent = content;
        } else {
            // 对于其他文件类型，转义HTML并使用预格式化文本显示
            const escapedContent = escapeHtml(content);
            
            // 如果有搜索词，高亮显示
            if (searchTerm) {
                const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
                htmlContent = escapedContent.replace(regex, '<span class="search-term-highlight">$1</span>');
                htmlContent = `<pre>${htmlContent}</pre>`;
            } else {
                htmlContent = `<pre>${escapedContent}</pre>`;
            }
        }
        
        // 将内容显示在页面上
        const contentElement = document.getElementById('documentContent');
        contentElement.innerHTML = htmlContent;
        
        // 如果有搜索词，尝试滚动到第一个匹配项
        if (searchTerm) {
            setTimeout(() => {
                const firstHighlight = document.querySelector('.search-term-highlight');
                if (firstHighlight) {
                    firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstHighlight.focus();
                }
            }, 100);
        }
    } catch (error) {
        console.error('加载文档内容时出错:', error);
        document.getElementById('documentContent').innerHTML = 
            `<div class="error">加载文档时发生错误: ${error.message}</div>`;
    }
}

// 获取文件扩展名
function getFileExtension(filename) {
    return filename.slice((Math.max(0, filename.lastIndexOf(".")) || Infinity)).toLowerCase();
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 转义HTML特殊字符
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}