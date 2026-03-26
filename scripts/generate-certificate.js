#!/usr/bin/env node
const PDFDocument = require('pdfkit');
const ArabicReshaper = require('arabic-reshaper');
const path = require('path');
const fs = require('fs');

// Read certificate data from stdin
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const data = JSON.parse(input);
  const template = data.template || 'QABA';
  if (template === 'CEU') {
    generateCEU(data);
  } else if (template === 'IBAO_CEU') {
    generateIBAOCEU(data);
  } else {
    generateStandard(data);
  }
});

const publicDir = path.join(process.cwd(), 'public');
const fontsDir = path.join(publicDir, 'fonts');
const imagesDir = path.join(publicDir, 'images');
const accDir = path.join(imagesDir, 'accreditations');

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

function setupDoc() {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));

  doc.registerFont('DancingScript', path.join(fontsDir, 'DancingScript.ttf'));
  doc.registerFont('Amiri', path.join(fontsDir, 'Amiri-Regular.ttf'));
  doc.registerFont('AmiriBold', path.join(fontsDir, 'Amiri-Bold.ttf'));

  const w = doc.page.width;
  const h = doc.page.height;

  // White background
  doc.rect(0, 0, w, h).fill('#ffffff');

  return { doc, chunks, w, h };
}

function finishDoc(doc, chunks) {
  doc.end();
  doc.on('end', () => {
    process.stdout.write(Buffer.concat(chunks));
  });
}

function drawSignature(doc, x, y) {
  try {
    const sigPath = path.join(imagesDir, 'signature.png');
    if (fs.existsSync(sigPath)) {
      doc.image(sigPath, x, y - 5, { height: 35 });
    } else {
      doc.font('DancingScript').fontSize(26).fillColor('#1a1a5e')
        .text('Reda gad', x, y);
    }
  } catch (e) {}

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#c2185b')
    .text('Dr. Reda Gad Mohamed Taha', x, y + 32);
  doc.font('Helvetica-Oblique').fontSize(9).fillColor('#555555')
    .text('Ph.D,QBA,IBA,AC', x, y + 48);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333')
    .text('MASARAT for ABA Director', x, y + 62);
}

// ========================================================
// STANDARD TEMPLATE (QABA / IBAO)
// ========================================================
function generateStandard(data) {
  const { doc, chunks, w, h } = setupDoc();

  // Border
  doc.rect(20, 20, w - 40, h - 40).lineWidth(0.5).stroke('#e0e0e0');

  // Logo
  try { doc.image(path.join(imagesDir, 'logo.png'), (w - 120) / 2, 30, { width: 120 }); } catch (e) {}

  // Student name
  const nameY = 165;
  const nameIsArabic = hasArabic(data.studentName);
  const displayName = nameIsArabic ? processArabicText(data.studentName) : data.studentName;
  const nameFont = nameIsArabic ? 'Amiri' : 'DancingScript';
  const nameSize = data.studentName.length > 35 ? 30 : 40;
  doc.font(nameFont).fontSize(nameSize).fillColor('#1a1a2e')
    .text(displayName, 50, nameY, { align: 'center', width: w - 100 });

  // Certificate number
  const certNumY = nameY + (nameSize === 40 ? 60 : 50);
  doc.font('Helvetica').fontSize(14).fillColor('#333333')
    .text(`certificate #${data.certNumber}`, 0, certNumY, { align: 'center' });

  // Recognition text
  const recogY = certNumY + 28;
  doc.font('Helvetica').fontSize(12).fillColor('#c2185b')
    .text('Has been recognized for completing the course of study', 0, recogY, { align: 'center' });

  // Course name
  const courseY = recogY + 28;
  const courseSize = data.courseEn.length > 55 ? 18 : data.courseEn.length > 40 ? 22 : 26;
  doc.font('Helvetica-BoldOblique').fontSize(courseSize).fillColor('#1a1a2e')
    .text(data.courseEn, 60, courseY, { align: 'center', width: w - 120 });

  // Dates & hours
  const courseH = doc.heightOfString(data.courseEn, { width: w - 120, font: 'Helvetica-BoldOblique', fontSize: courseSize });
  const datesY = courseY + courseH + 15;

  let dateText = data.startDate ? `Start ${data.startDate}, completed ${data.completedDate}` : `Completed ${data.completedDate}`;
  doc.font('Helvetica').fontSize(12).fillColor('#c2185b')
    .text(dateText, 0, datesY, { align: 'center' });

  if (data.trainingHours && data.trainingHours > 0) {
    const hoursY = datesY + 20;
    doc.font('Helvetica').fontSize(12).fillColor('#c2185b');
    const hoursText = `This course is equivalent to `;
    const hoursNum = `${data.trainingHours}`;
    const hoursEnd = ` training hours`;
    const fullWidth = doc.widthOfString(hoursText + hoursNum + hoursEnd);
    const startX = (w - fullWidth) / 2;
    doc.text(hoursText, startX, hoursY, { continued: true });
    doc.font('Helvetica-Bold').fontSize(13).text(hoursNum, { continued: true });
    doc.font('Helvetica').fontSize(12).text(hoursEnd);
  }

  // Line
  const lineY = datesY + 55;
  doc.moveTo(60, lineY).lineTo(w - 60, lineY).lineWidth(0.5).stroke('#e0e0e0');

  // Footer
  const footerY = lineY + 15;
  drawSignature(doc, 70, footerY);

  const template = data.template || 'QABA';
  if (template === 'IBAO') {
    try { doc.image(path.join(accDir, 'ibao-logo.png'), (w - 100) / 2, footerY - 10, { height: 100 }); } catch (e) {}
    const acpHeight = 80;
    const acpWidth = Math.round(acpHeight * 618 / 475);
    const ibaoRightX = w - acpWidth - 80;
    try { doc.image(path.join(accDir, 'ibao-acp.jpeg'), ibaoRightX, footerY - 5, { height: acpHeight }); } catch (e) {}
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#2d4a5e')
      .text('IBA_082025_003736', ibaoRightX, footerY + acpHeight, { width: acpWidth, align: 'center' });
  } else {
    try { doc.image(path.join(accDir, 'qaba-bh.jpeg'), (w - 80) / 2, footerY - 5, { height: 80 }); } catch (e) {}
    const qabaApprovedX = w - 250;
    try { doc.image(path.join(accDir, 'qaba-approved.png'), qabaApprovedX, footerY - 5, { height: 80 }); } catch (e) {}
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#2d4a5e')
      .text('QCB-1118', qabaApprovedX, footerY + 78, { width: 180, align: 'center' });
  }

  finishDoc(doc, chunks);
}

// ========================================================
// CEU TEMPLATE
// ========================================================
function generateCEU(data) {
  const { doc, chunks, w, h } = setupDoc();

  // ---- Provider info (top-left) ----
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text('QABA CE Provider information:', 40, 30);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text('Company Name: ', 40, 45, { continued: true });
  doc.font('Helvetica').text('Masarat for ABA Services');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text('Provider Number: ', 40, 60, { continued: true });
  doc.font('Helvetica').text(data.providerNumber || 'QCB-6529');

  // ---- Logo (top-center) ----
  try { doc.image(path.join(imagesDir, 'logo.png'), (w - 110) / 2, 25, { width: 110 }); } catch (e) {}

  // ---- "This is to certify that" ----
  const certifyY = 155;
  doc.font('Helvetica').fontSize(12).fillColor('#555555')
    .text('This is to certify that', 0, certifyY, { align: 'center' });

  // ---- Student name ----
  const nameY = certifyY + 25;
  const nameIsArabic = hasArabic(data.studentName);
  const displayName = nameIsArabic ? processArabicText(data.studentName) : data.studentName;
  const nameFont = nameIsArabic ? 'Amiri' : 'DancingScript';
  const nameSize = data.studentName.length > 35 ? 28 : 36;
  doc.font(nameFont).fontSize(nameSize).fillColor('#1a1a2e')
    .text(displayName, 50, nameY, { align: 'center', width: w - 100 });

  // ---- Certification Number ----
  const numY = nameY + (nameSize === 36 ? 50 : 40);
  doc.font('Helvetica').fontSize(12).fillColor('#333333')
    .text(`Certification Number# ${data.certNumber}`, 0, numY, { align: 'center' });

  // ---- "for participation in..." ----
  const partY = numY + 22;
  doc.font('Helvetica').fontSize(11).fillColor('#555555')
    .text('for participation in online synchronous webinar entitled :', 0, partY, { align: 'center' });

  // ---- Course name ----
  const courseY = partY + 25;
  const courseSize = data.courseEn.length > 60 ? 16 : data.courseEn.length > 40 ? 20 : 24;
  doc.font('Helvetica-BoldOblique').fontSize(courseSize).fillColor('#c2185b')
    .text(data.courseEn, 80, courseY, { align: 'center', width: w - 160 });

  // ---- CEU info + breakdown (same row) ----
  const courseH = doc.heightOfString(data.courseEn, { width: w - 160, font: 'Helvetica-BoldOblique', fontSize: courseSize });
  const ceuY = courseY + courseH + 10;

  // Left side: "Has earned X CEU(s)."
  const ceuCount = data.ceuCount || 0;
  doc.font('Helvetica').fontSize(12).fillColor('#333333');
  const ceuText = 'Has earned  ';
  const ceuEnd = '  CEU(s).';
  doc.text(ceuText, 120, ceuY, { continued: true });
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#333333')
    .text(` ${ceuCount} `, { continued: true, underline: true });
  doc.font('Helvetica').fontSize(12).fillColor('#333333').text(ceuEnd);
  doc.font('Helvetica').fontSize(8).fillColor('#666666')
    .text('Total CEUs', 170, ceuY + 16, { width: 80, align: 'center' });

  // Right side: CEU breakdown (compact, same row)
  const breakdownX = w - 180;
  const ceuItems = [
    { val: data.generalCeus || 0, label: 'General CEUs' },
    { val: data.supervisionCeus || 0, label: 'Supervision CEUs' },
    { val: data.ethicsCeus || 0, label: 'Ethics CEUs' },
  ];

  ceuItems.forEach((item, i) => {
    const y = ceuY + (i * 28);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
      .text(String(item.val), breakdownX, y, { width: 80, align: 'center' });
    doc.moveTo(breakdownX + 10, y + 12).lineTo(breakdownX + 70, y + 12).lineWidth(0.5).stroke('#999');
    doc.font('Helvetica').fontSize(7).fillColor('#666666')
      .text(item.label, breakdownX, y + 14, { width: 80, align: 'center' });
  });

  // ---- Horizontal line ----
  const lineY = ceuY + 90;
  doc.moveTo(40, lineY).lineTo(w - 40, lineY).lineWidth(0.5).stroke('#e0e0e0');

  // ---- Footer ----
  const footerY = lineY + 12;

  // Signature (left)
  drawSignature(doc, 50, footerY);

  // QABA CE badge (center)
  try { doc.image(path.join(accDir, 'qaba-ce.jpeg'), (w - 80) / 2, footerY - 5, { height: 80 }); } catch (e) {}

  // Right side: dates info (2 columns)
  const col1X = w - 260;
  const col2X = w - 130;

  // Row 1: Certification Date + Event Modality
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text(data.completedDate || '', col1X, footerY, { width: 110, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor('#666666')
    .text('Certification Date', col1X, footerY + 13, { width: 110, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text(data.eventModality || 'Online Zoom', col2X, footerY, { width: 110, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor('#666666')
    .text('Event Modality', col2X, footerY + 13, { width: 110, align: 'center' });

  // Row 2: Event Date
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text(data.startDate || data.completedDate || '', col1X, footerY + 35, { width: 110, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor('#666666')
    .text('Event Date', col1X, footerY + 48, { width: 110, align: 'center' });

  finishDoc(doc, chunks);
}

// ========================================================
// IBAO CEU TEMPLATE
// ========================================================
function generateIBAOCEU(data) {
  const { doc, chunks, w, h } = setupDoc();

  // ---- Provider info (top-left) ----
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text('IBAO Provider information:', 40, 30, { underline: true });
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text('Company Name: ', 40, 48, { continued: true });
  doc.font('Helvetica').text('Masarat for ABA Services');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text('Provider Type: ', 40, 63, { continued: true });
  doc.font('Helvetica').text('Organization');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text('Provider Number: ', 40, 78, { continued: true });
  doc.font('Helvetica').text(data.providerNumber || 'IBA_082025_003736');

  // ---- Logo (top-center) ----
  try { doc.image(path.join(imagesDir, 'logo.png'), (w - 110) / 2, 25, { width: 110 }); } catch (e) {}

  // ---- "This is to certify that" ----
  const certifyY = 155;
  doc.font('Helvetica').fontSize(12).fillColor('#555555')
    .text('This is to certify that', 0, certifyY, { align: 'center' });

  // ---- Student name ----
  const nameY = certifyY + 25;
  const nameIsArabic = hasArabic(data.studentName);
  const displayName = nameIsArabic ? processArabicText(data.studentName) : data.studentName;
  const nameFont = nameIsArabic ? 'Amiri' : 'DancingScript';
  const nameSize = data.studentName.length > 35 ? 28 : 36;
  doc.font(nameFont).fontSize(nameSize).fillColor('#1a1a2e')
    .text(displayName, 50, nameY, { align: 'center', width: w - 100 });

  // ---- Certification Number ----
  const numY = nameY + (nameSize === 36 ? 50 : 40);
  doc.font('Helvetica').fontSize(12).fillColor('#333333')
    .text(`Certification Number# ${data.certNumber}`, 0, numY, { align: 'center' });

  // ---- "for participation in..." ----
  const partY = numY + 22;
  doc.font('Helvetica').fontSize(11).fillColor('#555555')
    .text('for participation in online synchronous webinar entitled :', 0, partY, { align: 'center' });

  // ---- Course name ----
  const courseY = partY + 25;
  const courseSize = data.courseEn.length > 60 ? 16 : data.courseEn.length > 40 ? 20 : 24;
  doc.font('Helvetica-BoldOblique').fontSize(courseSize).fillColor('#c2185b')
    .text(data.courseEn, 80, courseY, { align: 'center', width: w - 160 });

  // ---- CEU info + breakdown ----
  const courseH = doc.heightOfString(data.courseEn, { width: w - 160, font: 'Helvetica-BoldOblique', fontSize: courseSize });
  const ceuY = courseY + courseH + 10;

  const ceuCount = data.ceuCount || 0;
  doc.font('Helvetica').fontSize(12).fillColor('#333333');
  doc.text('Has earned  ', 120, ceuY, { continued: true });
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#333333')
    .text(` ${ceuCount} `, { continued: true, underline: true });
  doc.font('Helvetica').fontSize(12).fillColor('#333333').text('  CEU(s).');
  doc.font('Helvetica').fontSize(8).fillColor('#666666')
    .text('Total CEUs', 170, ceuY + 16, { width: 80, align: 'center' });

  // Right side: CEU breakdown
  const breakdownX = w - 190;
  const ceuItems = [
    { val: data.generalCeus || 0, label: 'Cultural Issues Hours CEUs' },
    { val: data.supervisionCeus || 0, label: 'Supervision CEUs' },
    { val: data.ethicsCeus || 0, label: 'Ethics CEUs' },
  ];

  ceuItems.forEach((item, i) => {
    const y = ceuY + (i * 28);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
      .text(String(item.val), breakdownX, y, { width: 100, align: 'center' });
    doc.moveTo(breakdownX + 15, y + 12).lineTo(breakdownX + 85, y + 12).lineWidth(0.5).stroke('#999');
    doc.font('Helvetica').fontSize(7).fillColor('#666666')
      .text(item.label, breakdownX - 10, y + 14, { width: 120, align: 'center' });
  });

  // ---- Horizontal line ----
  const lineY = ceuY + 90;
  doc.moveTo(40, lineY).lineTo(w - 40, lineY).lineWidth(0.5).stroke('#e0e0e0');

  // ---- Footer ----
  const footerY = lineY + 12;

  // Signature (left)
  drawSignature(doc, 50, footerY);

  // IBAO CEU badge (center)
  try { doc.image(path.join(accDir, 'ibao-ceu.jpeg'), (w - 80) / 2, footerY - 5, { height: 80 }); } catch (e) {}

  // Right side: dates
  const col1X = w - 260;
  const col2X = w - 130;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text(data.completedDate || '', col1X, footerY, { width: 110, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor('#666666')
    .text('Certification Date', col1X, footerY + 13, { width: 110, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text(data.eventModality || 'Online Zoom', col2X, footerY, { width: 110, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor('#666666')
    .text('Event Modality', col2X, footerY + 13, { width: 110, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
    .text(data.startDate || data.completedDate || '', col1X, footerY + 35, { width: 110, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor('#666666')
    .text('Event Date', col1X, footerY + 48, { width: 110, align: 'center' });

  finishDoc(doc, chunks);
}
