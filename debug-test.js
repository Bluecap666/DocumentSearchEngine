const fs = require('fs').promises;
const path = require('path');
const DocxService = require('./src/services/DocxService');
const PdfService = require('./src/services/PdfService');

async function testServices() {
  console.log('Testing PDF and DOCX extraction services...');
  
  // 使用实际存在的文件
  const pdfPath = './example/天书夜读－从汇编语言到Windows内核编程_20140228172714.pdf';
  const docxPath = './example/sample.docx';
  
  const pdfService = new PdfService();
  const docxService = new DocxService();
  
  try {
    // Test PDF extraction
    console.log('\n--- Testing PDF Extraction ---');
    console.log('Checking if PDF file exists:', await fs.access(pdfPath).then(() => 'Yes').catch(() => 'No'));
    if(await fs.access(pdfPath).then(() => true).catch(() => false)) {
      const pdfContent = await pdfService.extractText(pdfPath);
      console.log('PDF content extracted (first 200 chars):');
      console.log(pdfContent.substring(0, 200) + '...');
      console.log('Length:', pdfContent.length);
    } else {
      console.log('PDF file does not exist:', pdfPath);
    }
  } catch (err) {
    console.error('Error extracting PDF:', err.message);
  }
  
  try {
    // Test DOCX extraction
    console.log('\n--- Testing DOCX Extraction ---');
    console.log('Checking if DOCX file exists:', await fs.access(docxPath).then(() => 'Yes').catch(() => 'No'));
    if(await fs.access(docxPath).then(() => true).catch(() => false)) {
      const docxContent = await docxService.extractText(docxPath);
      console.log('DOCX content extracted (first 200 chars):');
      console.log(docxContent.substring(0, 200) + '...');
      console.log('Length:', docxContent.length);
    } else {
      console.log('DOCX file does not exist:', docxPath);
    }
  } catch (err) {
    console.error('Error extracting DOCX:', err.message);
  }
}

testServices();