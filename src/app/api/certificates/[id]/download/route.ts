import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);

    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: {
          select: { titleAr: true, titleEn: true, instructor: { select: { name: true } } },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    if (certificate.userId !== tokenData.userId && tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const completedDate = new Date(certificate.issuedAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const certNumber = certificate.certificateId.replace('CERT-', '').split('-')[0];
    const origin = request.nextUrl.origin;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${certificate.user.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Lato:wght@300;400;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 landscape; margin: 0; }
    body {
      width: 297mm; height: 210mm;
      font-family: 'Lato', sans-serif;
      background: white;
      display: flex; align-items: center; justify-content: center;
    }
    .certificate {
      width: 280mm; height: 198mm;
      background: white;
      position: relative;
      padding: 12mm 20mm;
      display: flex; flex-direction: column;
      align-items: center;
    }
    .logo { width: 110px; margin-bottom: 3px; }
    .student-name {
      font-family: 'Dancing Script', 'Amiri', cursive;
      font-size: clamp(28px, 5vw, 46px);
      color: #1a1a2e;
      margin: 8px 0 3px;
      max-width: 90%;
      text-align: center;
    }
    .cert-number { font-size: 15px; color: #333; margin-bottom: 6px; }
    .recognition-text { font-size: 14px; color: #c2185b; margin-bottom: 6px; }
    .course-name {
      font-family: 'Playfair Display', serif;
      font-size: 21px; font-weight: 700; font-style: italic;
      color: #1a1a2e; margin-bottom: 12px;
      text-align: center; max-width: 85%;
    }
    .dates { font-size: 13px; color: #c2185b; margin-bottom: 4px; }
    .footer {
      display: flex; justify-content: space-between; align-items: flex-end;
      width: 100%; margin-top: auto; padding: 0 8mm;
    }
    .footer-section { text-align: center; flex: 1; }
    .signature-section { text-align: left; }
    .signature-line {
      font-family: 'Dancing Script', cursive;
      font-size: 26px; color: #1a1a5e; margin-bottom: 2px;
    }
    .signature-section .name { font-size: 12px; font-weight: 700; color: #c2185b; }
    .signature-section .title-text { font-size: 10px; color: #555; }
    .signature-section .org { font-size: 10px; color: #333; font-weight: 700; }
    .badge-img { height: 75px; object-fit: contain; }
    .badge-label { font-size: 8px; color: #555; margin-top: 3px; font-weight: 700; }
    @media print {
      body { background: white; margin: 0; }
      .no-print { display: none !important; }
    }
    .print-bar {
      position: fixed; top: 0; left: 0; right: 0;
      background: #333; color: white; padding: 12px 24px;
      display: flex; align-items: center; justify-content: center; gap: 16px;
      z-index: 100; font-family: 'Lato', sans-serif;
    }
    .print-bar button {
      padding: 8px 24px; border: none; border-radius: 6px;
      font-size: 14px; cursor: pointer; font-family: 'Lato', sans-serif;
    }
    .btn-print { background: #4485b5; color: white; }
    .btn-print:hover { background: #2d5a7b; }
    .btn-close { background: #666; color: white; }
    .btn-close:hover { background: #888; }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <span>اضغط Ctrl+P أو الزر لحفظ كـ PDF</span>
    <button class="btn-print" onclick="window.print()">حفظ كـ PDF</button>
    <button class="btn-close" onclick="window.close()">إغلاق</button>
  </div>
  <div class="certificate">
    <img src="${origin}/images/logo.png" alt="Masarat" class="logo">
    <div class="student-name">${certificate.user.name}</div>
    <div class="cert-number">certificate #${certNumber}</div>
    <div class="recognition-text">Has been recognized for completing the course of study</div>
    <div class="course-name">${certificate.course.titleEn}</div>
    <div class="dates">completed ${completedDate}</div>
    <div class="footer">
      <div class="footer-section signature-section">
        <div class="signature-line">Reda gad</div>
        <div class="name">Dr. Reda Gad Mohamed Taha</div>
        <div class="title-text">Ph.D,QBA,IBA,AC</div>
        <div class="org">MASARAT for ABA Director</div>
      </div>
      <div class="footer-section">
        <img src="${origin}/images/accreditations/qaba-bh.jpeg" alt="QABA" class="badge-img">
        <div class="badge-label">APPROVED COURSEWORK PROVIDER</div>
      </div>
      <div class="footer-section">
        <img src="${origin}/images/accreditations/qaba-approved.png" alt="QABA Approved" class="badge-img">
      </div>
    </div>
  </div>
  <script>
    // Auto-trigger print dialog when fonts and images are loaded
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 500);
    });
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate certificate' }, { status: 500 });
  }
}
