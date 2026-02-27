const fs = require('fs');
const { Document, Paragraph, TextRun, convertToBuffer } = require('docx');

// 创建一个包含可搜索内容的DOCX文件
function createTestDocx() {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun("这是用于测试搜索功能的DOCX文档。"),
                        new TextRun("Document Search Test"),
                        new TextRun("This is a searchable content in a DOCX file."),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun("搜索功能应该能找到这些关键词："),
                        new TextRun("测试、搜索、文档、search、keyword"),
                    ],
                }),
            ],
        }]
    });
    
    const buffer = convertToBuffer(doc);
    fs.writeFileSync('./example/test-docx-search.docx', buffer);
    console.log('已创建测试DOCX文件: test-docx-search.docx');
}

// 创建一个包含可搜索内容的PDF文件说明
function createTestPdf() {
    console.log(`
要创建一个用于测试的PDF文件，请使用以下方法之一：
    
1. 使用Microsoft Word或其他文字处理器创建一个包含以下文本的文档：
   "这是用于测试搜索功能的PDF文档。"
   "PDF Search Test Document"
   "This is a searchable content in a PDF file."
   "搜索功能应该能找到这些关键词：测试、搜索、文档、search、keyword"

2. 将文档保存为PDF格式，命名为 test-pdf-search.pdf
   放置在 ./example/ 目录下

注意：确保PDF是文本型PDF，而不是扫描图像型PDF，否则无法提取文本内容。
    `);
}

createTestDocx();
createTestPdf();