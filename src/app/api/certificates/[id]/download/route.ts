import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Chrome path — works on macOS dev and can be overridden via env var for Linux/prod
const CHROME_PATH =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

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

function buildCertificateHTML(data: {
  studentName: string;
  courseTitleEn: string;
  courseTitleAr: string;
  instructorName: string;
  issueDate: string;
  certificateId: string;
}) {
  const { studentName, courseTitleEn, courseTitleAr, instructorName, issueDate, certificateId } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 297mm; height: 210mm; overflow: hidden; font-family: 'Cairo', Arial, sans-serif; }

  .page {
    width: 297mm;
    height: 210mm;
    position: relative;
    background: #ffffff;
    display: flex;
    flex-direction: column;
  }

  /* Left accent bar */
  .accent-left {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 10mm;
    background: linear-gradient(to bottom, #4f46e5, #818cf8);
  }
  /* Right accent bar */
  .accent-right {
    position: absolute;
    right: 0; top: 0; bottom: 0;
    width: 10mm;
    background: linear-gradient(to bottom, #4f46e5, #818cf8);
  }

  /* Top band */
  .header {
    background: linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6366f1 100%);
    padding: 10mm 20mm 8mm;
    text-align: center;
    position: relative;
    flex-shrink: 0;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: -8px; left: 50%; transform: translateX(-50%);
    width: 0; height: 0;
    border-left: 16px solid transparent;
    border-right: 16px solid transparent;
    border-top: 8px solid #6366f1;
  }
  .header-badge {
    font-size: 8px; color: #a5b4fc;
    letter-spacing: 0.3em; text-transform: uppercase;
    margin-bottom: 4px;
  }
  .header-title {
    font-family: Georgia, serif;
    font-size: 28px; font-weight: bold; color: #fff;
    letter-spacing: 0.08em;
  }

  /* Main content */
  /* Decorative watermark */
  .watermark {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-family: Georgia, serif;
    font-size: 120px;
    font-weight: bold;
    color: rgba(79, 70, 229, 0.025);
    letter-spacing: -5px;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    z-index: 0;
  }

  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6mm 20mm;
    text-align: center;
    gap: 0;
    position: relative;
    z-index: 1;
  }

  .certify { font-size: 11px; color: #9ca3af; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }

  .student-name {
    font-size: 30px; font-weight: 900; color: #1e1b4b;
    line-height: 1.2; direction: ltr;
    padding: 12px 30px;
    border-top: 2px solid #e0e7ff;
    border-bottom: 2px solid #e0e7ff;
    margin: 10px 0;
    width: 100%;
  }

  .completed { font-size: 11px; color: #9ca3af; letter-spacing: 0.1em; text-transform: uppercase; margin: 10px 0 12px; }

  .course-box {
    background: linear-gradient(135deg, #eef2ff, #f0fdf4);
    border: 1px solid #c7d2fe;
    border-radius: 6px;
    padding: 12px 24px;
    width: 100%;
  }
  .course-en {
    font-size: 14px; font-weight: 700; color: #4338ca;
    line-height: 1.45; direction: ltr;
  }
  .course-ar {
    font-size: 12px; font-weight: 600; color: #6366f1;
    direction: rtl; line-height: 1.45; margin-top: 5px;
  }

  /* Footer */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6mm 20mm;
    border-top: 1px solid #e0e7ff;
    background: #fafafe;
    flex-shrink: 0;
  }

  .f-block { display: flex; flex-direction: column; gap: 2px; }
  .f-label { font-size: 7px; font-weight: 700; color: #9ca3af; letter-spacing: 0.15em; text-transform: uppercase; }
  .f-value { font-size: 10px; font-weight: 700; color: #374151; }
  .f-mono { font-family: 'Courier New', monospace; font-size: 8px; color: #6b7280; }

  .verified-wrap { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .verified {
    display: inline-flex; align-items: center; gap: 5px;
    background: #ecfdf5; border: 1px solid #6ee7b7;
    border-radius: 20px; padding: 3px 10px;
  }
  .check-icon {
    width: 14px; height: 14px; background: #10b981; border-radius: 50%;
    color: #fff; font-size: 9px;
    display: inline-flex; align-items: center; justify-content: center; font-weight: bold;
  }
  .verified-text { font-size: 9px; color: #059669; font-weight: 600; }

  .sig-line { width: 100px; height: 1px; background: #9ca3af; margin-top: 4px; }
</style>
</head>
<body>
<div class="page">
  <div class="accent-left"></div>
  <div class="accent-right"></div>
  <div class="watermark">MASARAT</div>

  <div class="header">
    <div class="header-badge">MASARAT TRAINING &nbsp;·&nbsp; مسارات للتدريب</div>
    <div class="header-title">CERTIFICATE OF COMPLETION</div>
  </div>

  <div class="body">
    <p class="certify">This is to certify that</p>
    <h1 class="student-name">${studentName}</h1>
    <p class="completed">has successfully completed the course</p>
    <div class="course-box">
      ${courseTitleEn ? `<p class="course-en">${courseTitleEn}</p>` : ''}
      ${courseTitleAr ? `<p class="course-ar">${courseTitleAr}</p>` : ''}
    </div>
  </div>

  <div class="footer">
    <div class="f-block">
      <span class="f-label">Issue Date</span>
      <span class="f-value">${issueDate}</span>
    </div>
    <div class="verified-wrap">
      <div class="verified">
        <span class="check-icon">✓</span>
        <span class="verified-text">Verified Certificate</span>
      </div>
      <span class="f-mono">${certificateId}</span>
    </div>
    <div class="f-block" style="align-items:flex-end;">
      <span class="f-label">Instructor</span>
      <span class="f-value">${instructorName}</span>
      <div class="sig-line"></div>
    </div>
  </div>
</div>
</body>
</html>`;
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
          select: {
            titleAr: true,
            titleEn: true,
            instructor: { select: { name: true } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    if (
      certificate.userId !== tokenData.userId &&
      !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)
    ) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const html = buildCertificateHTML({
      studentName: certificate.user.name ?? 'Student',
      courseTitleEn: certificate.course.titleEn ?? '',
      courseTitleAr: certificate.course.titleAr ?? '',
      instructorName: certificate.course.instructor?.name ?? 'Masarat',
      issueDate: new Date(certificate.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
      certificateId: certificate.certificateId,
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer: Buffer = await page.pdf({
        width: '297mm',
        height: '210mm',
        printBackground: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificate-${certificate.certificateId}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Certificate PDF error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate', detail: String(error) },
      { status: 500 }
    );
  }
}
