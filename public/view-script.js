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
        const fileExtension = getFileExtension(docPath);
        
        // 构造API端点以获取文档原始内容
        const response = await fetch(`/api/document-content?path=${encodeURIComponent(docPath)}`);
        
        if (!response.ok) {
            throw new Error(`加载文档失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.content;
        
        // 根据文件类型决定如何显示内容
        let htmlContent = '';
        if (fileExtension === '.html' || fileExtension === '.htm') {
            // 对于HTML文件，创建一个临时的数据URL并在iframe中显示
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // 创建iframe来显示HTML内容
            htmlContent = `<iframe src="${url}" class="document-frame" onload="handleIframeLoad(this, '${searchTerm}')"></iframe>`;
        } else {
            // 对于其他文本文件（如MD等），转义HTML并使用预格式化文本显示
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
    } catch (error) {
        console.error('加载文档内容时出错:', error);
        document.getElementById('documentContent').innerHTML = 
            `<div class="error">加载文档时发生错误: ${error.message}</div>`;
    }
}

// 处理iframe加载完成后的搜索词高亮
function handleIframeLoad(iframe, searchTerm) {
    if (!searchTerm) return;
    
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // 在iframe内部查找匹配的文本并高亮
        const walker = iframeDoc.createTreeWalker(
            iframeDoc.body,
            iframeDoc.NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentElement && node.parentElement.classList.contains('search-term-highlight')) {
                        return iframeDoc.NodeFilter.FILTER_REJECT;
                    }
                    return iframeDoc.NodeFilter.SHOW_NODE;
                }
            }
        );
        
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        // 从后往前处理文本节点，避免位置偏移
        textNodes.reverse().forEach(textNode => {
            const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
            const matches = [...textNode.nodeValue.matchAll(regex)];
            
            if (matches.length > 0) {
                matches.reverse().forEach(match => {
                    const startIndex = match.index;
                    const endIndex = startIndex + match[0].length;
                    
                    const beforeText = textNode.nodeValue.substring(0, startIndex);
                    const matchText = textNode.nodeValue.substring(startIndex, endIndex);
                    const afterText = textNode.nodeValue.substring(endIndex);
                    
                    const span = iframeDoc.createElement('span');
                    span.className = 'search-term-highlight';
                    span.textContent = matchText;
                    
                    if (beforeText) {
                        textNode.nodeValue = beforeText;
                        textNode.parentNode.insertBefore(span, textNode.nextSibling);
                        if (afterText) {
                            const afterTextNode = iframeDoc.createTextNode(afterText);
                            textNode.parentNode.insertBefore(afterTextNode, span.nextSibling);
                        }
                    } else {
                        textNode.parentNode.replaceChild(span, textNode);
                        if (afterText) {
                            const afterTextNode = iframeDoc.createTextNode(afterText);
                            span.parentNode.insertBefore(afterTextNode, span.nextSibling);
                        }
                    }
                });
            }
        });
    } catch (e) {
        // 跨域限制可能阻止访问iframe内容，忽略错误
        console.warn('无法在iframe中高亮搜索词:', e);
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