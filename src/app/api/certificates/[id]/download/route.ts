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

    const issueDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${certificate.certificateId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 landscape; margin: 0; }
    body {
      width: 297mm; height: 210mm;
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #f8f9fa;
      display: flex; align-items: center; justify-content: center;
    }
    .certificate {
      width: 277mm; height: 190mm;
      background: white;
      position: relative;
      padding: 30px;
    }
    .border-outer {
      position: absolute; inset: 10px;
      border: 3px solid #4485b5;
      border-radius: 8px;
    }
    .border-inner {
      position: absolute; inset: 18px;
      border: 1px solid #2d5a7b;
      border-radius: 4px;
    }
    .content {
      position: relative; z-index: 1;
      text-align: center;
      height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 20px 40px;
    }
    .logo { font-size: 18px; color: #4485b5; font-weight: bold; margin-bottom: 10px; }
    .title { font-size: 42px; color: #4485b5; letter-spacing: 8px; margin-bottom: 5px; }
    .subtitle { font-size: 18px; color: #666; letter-spacing: 4px; margin-bottom: 25px; }
    .divider { width: 200px; height: 2px; background: linear-gradient(to right, transparent, #ddd, transparent); margin: 15px auto; }
    .certify-text { font-size: 14px; color: #888; margin-bottom: 10px; }
    .student-name { font-size: 32px; color: #333; font-weight: bold; margin-bottom: 15px; }
    .completed-text { font-size: 14px; color: #888; margin-bottom: 10px; }
    .course-name-en { font-size: 22px; color: #4485b5; font-weight: bold; margin-bottom: 8px; }
    .course-name-ar { font-size: 18px; color: #666; direction: rtl; margin-bottom: 20px; }
    .date { font-size: 12px; color: #888; margin-bottom: 5px; }
    .cert-id { font-size: 10px; color: #aaa; margin-bottom: 25px; }
    .footer { display: flex; justify-content: space-between; width: 100%; padding: 0 60px; align-items: flex-end; }
    .footer-item { text-align: center; }
    .footer-label { font-size: 12px; color: #888; margin-bottom: 5px; }
    .footer-value { font-size: 14px; color: #333; font-weight: bold; }
    .footer-line { width: 150px; height: 1px; background: #333; margin: 8px auto; }
    .platform-name { font-size: 20px; color: #4485b5; font-weight: bold; }
    .platform-sub { font-size: 10px; color: #999; }
    @media print {
      body { background: white; }
      .no-print { display: none; }
    }
    .print-btn {
      position: fixed; top: 20px; right: 20px;
      padding: 12px 24px; background: #4485b5; color: white;
      border: none; border-radius: 8px; font-size: 16px;
      cursor: pointer; z-index: 100;
    }
    .print-btn:hover { background: #2d5a7b; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  <div class="certificate">
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    <div class="content">
      <div class="platform-name">مسارات</div>
      <div class="platform-sub">Masarat - ABA Training Platform</div>
      <div class="divider"></div>
      <div class="title">CERTIFICATE</div>
      <div class="subtitle">OF COMPLETION</div>
      <div class="divider"></div>
      <div class="certify-text">This is to certify that</div>
      <div class="student-name">${certificate.user.name}</div>
      <div class="completed-text">has successfully completed the course</div>
      <div class="course-name-en">${certificate.course.titleEn}</div>
      <div class="course-name-ar">${certificate.course.titleAr}</div>
      <div class="date">Issued on: ${issueDate}</div>
      <div class="cert-id">Certificate ID: ${certificate.certificateId}</div>
      <div class="footer">
        <div class="footer-item">
          <div class="footer-value">${certificate.course.instructor.name}</div>
          <div class="footer-line"></div>
          <div class="footer-label">Instructor</div>
        </div>
        <div class="footer-item">
          <div class="footer-value">مسارات</div>
          <div class="footer-line"></div>
          <div class="footer-label">Platform</div>
        </div>
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
