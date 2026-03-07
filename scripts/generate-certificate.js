#!/usr/bin/env node
const PDFDocument = require('pdfkit');
const ArabicReshaper = require('arabic-reshaper');
const path = require('path');

// Read certificate data from stdin
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const data = JSON.parse(input);
  generatePDF(data);
});

function isArabic(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x0600 && code <= 0x06FF) || (code >= 0xFB50 && code <= 0xFDFF) || (code >= 0xFE70 && code <= 0xFEFF);
}

function hasArabic(text) {
  return [...text].some(ch => isArabic(ch));
}

function processArabicText(text) {
  const reshaped = ArabicReshaper.convertArabic(text);
  return reshaped.split(' ').reverse().join(' ');
}

function generatePDF(data) {
  const publicDir = path.join(process.cwd(), 'public');
  const fontsDir = path.join(publicDir, 'fonts');

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));

  const w = doc.page.width;
  const h = doc.page.height;

  // Register custom fonts
  doc.registerFont('DancingScript', path.join(fontsDir, 'DancingScript.ttf'));
  doc.registerFont('Amiri', path.join(fontsDir, 'Amiri-Regular.ttf'));

  // White background
  doc.rect(0, 0, w, h).fill('#ffffff');

  // Light border
  doc.rect(15, 15, w - 30, h - 30).lineWidth(0.5).stroke('#dddddd');

  // Logo
  try {
    doc.image(path.join(publicDir, 'images/logo.png'), (w - 90) / 2, 25, { width: 90 });
  } catch (e) {}

  // Student name
  const nameIsArabic = hasArabic(data.studentName);
  const displayName = nameIsArabic ? processArabicText(data.studentName) : data.studentName;
  const nameFont = nameIsArabic ? 'Amiri' : 'DancingScript';
  doc.font(nameFont).fontSize(data.studentName.length > 35 ? 28 : 38).fillColor('#1a1a2e')
    .text(displayName, 50, 140, { align: 'center', width: w - 100 });

  // Certificate number
  doc.font('Helvetica').fontSize(14).fillColor('#333333')
    .text(`certificate #${data.certNumber}`, 0, 190, { align: 'center' });

  // Recognition text
  doc.font('Helvetica').fontSize(13).fillColor('#c2185b')
    .text('Has been recognized for completing the course of study', 0, 215, { align: 'center' });

  // Course name
  const courseSize = data.courseEn.length > 60 ? 16 : 20;
  doc.font('Helvetica-BoldOblique').fontSize(courseSize).fillColor('#1a1a2e')
    .text(data.courseEn, 60, 245, { align: 'center', width: w - 120 });

  // Completed date
  const courseH = doc.heightOfString(data.courseEn, { width: w - 120 });
  doc.font('Helvetica').fontSize(12).fillColor('#c2185b')
    .text(`completed ${data.completedDate}`, 0, 255 + courseH + 10, { align: 'center' });

  // Footer
  const footerY = 390;

  // Signature
  doc.font('DancingScript').fontSize(24).fillColor('#1a1a5e')
    .text('Reda gad', 80, footerY);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#c2185b')
    .text('Dr. Reda Gad Mohamed Taha', 80, footerY + 30);
  doc.font('Helvetica').fontSize(9).fillColor('#555555')
    .text('Ph.D,QBA,IBA,AC', 80, footerY + 45);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333')
    .text('MASARAT for ABA Director', 80, footerY + 58);

  // QABA badges
  try {
    doc.image(path.join(publicDir, 'images/accreditations/qaba-bh.jpeg'), 330, footerY - 5, { height: 75 });
  } catch (e) {}
  try {
    doc.image(path.join(publicDir, 'images/accreditations/qaba-approved.png'), 530, footerY - 5, { height: 75 });
  } catch (e) {}

  doc.end();

  doc.on('end', () => {
    const buf = Buffer.concat(chunks);
    process.stdout.write(buf);
  });
}
