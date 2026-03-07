import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

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
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        course: {
          select: {
            titleAr: true,
            titleEn: true,
            instructor: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      );
    }

    if (certificate.userId !== tokenData.userId && tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const issuedDate = new Date(certificate.issuedAt);
    const completedDate = issuedDate.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const certNumber = certificate.certificateId.replace('CERT-', '').split('-')[0];
    const origin = request.nextUrl.origin;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${certificate.user.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 landscape; margin: 0; }
    body {
      width: 297mm; height: 210mm;
      font-family: 'Lato', sans-serif;
      background: #f0f0f0;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
    }
    .certificate {
      width: 280mm; height: 198mm;
      background: white;
      position: relative;
      padding: 15mm 20mm;
      display: flex; flex-direction: column;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .logo { width: 120px; margin-bottom: 5px; }
    .student-name {
      font-family: 'Dancing Script', cursive;
      font-size: clamp(28px, 5vw, 48px);
      color: #1a1a2e;
      margin: 10px 0 5px;
      max-width: 90%;
      word-wrap: break-word;
    }
    .cert-number {
      font-size: 16px;
      color: #333;
      margin-bottom: 8px;
    }
    .recognition-text {
      font-size: 15px;
      color: #c2185b;
      margin-bottom: 8px;
    }
    .course-name {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      font-style: italic;
      color: #1a1a2e;
      margin-bottom: 15px;
      text-align: center;
      max-width: 80%;
    }
    .dates {
      font-size: 14px;
      color: #c2185b;
      margin-bottom: 5px;
    }
    .hours {
      font-size: 14px;
      color: #c2185b;
      margin-bottom: 20px;
    }
    .hours strong {
      font-size: 18px;
      font-weight: 900;
      color: #1a1a2e;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
      margin-top: auto;
      padding: 0 10mm;
    }
    .footer-section {
      text-align: center;
      flex: 1;
    }
    .signature-section .name {
      font-size: 14px;
      font-weight: 700;
      color: #c2185b;
    }
    .signature-section .title-text {
      font-size: 11px;
      color: #555;
    }
    .signature-section .org {
      font-size: 11px;
      color: #333;
      font-weight: 700;
    }
    .signature-line {
      font-family: 'Dancing Script', cursive;
      font-size: 28px;
      color: #1a1a5e;
      margin-bottom: 2px;
    }
    .badge-img {
      height: 80px;
      object-fit: contain;
    }
    .badge-label {
      font-size: 9px;
      color: #555;
      margin-top: 4px;
      font-weight: 700;
    }
    @media print {
      body { background: white; margin: 0; }
      .certificate { box-shadow: none; }
      .no-print { display: none !important; }
    }
    .print-btn {
      position: fixed; top: 20px; right: 20px;
      padding: 12px 28px; background: #4485b5; color: white;
      border: none; border-radius: 8px; font-size: 16px;
      cursor: pointer; z-index: 100; font-family: 'Lato', sans-serif;
    }
    .print-btn:hover { background: #2d5a7b; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
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
        <img src="${origin}/images/accreditations/qaba-ce.jpeg" alt="QABA Approved" class="badge-img">
        <div class="badge-label">QABA APPROVED<br>TRAINING PROGRAM</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
