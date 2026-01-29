import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from token
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

// GET - تحميل الشهادة كـ PDF
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

    // جلب الشهادة
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

    // التحقق من ملكية الشهادة
    if (certificate.userId !== tokenData.userId && tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // إنشاء PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // تصميم الشهادة
    const width = doc.page.width;
    const height = doc.page.height;

    // خلفية
    doc.rect(0, 0, width, height).fill('#f8f9fa');

    // إطار
    doc.rect(30, 30, width - 60, height - 60)
      .lineWidth(3)
      .stroke('#667eea');

    doc.rect(40, 40, width - 80, height - 80)
      .lineWidth(1)
      .stroke('#764ba2');

    // العنوان الرئيسي
    doc.fontSize(40)
      .fillColor('#667eea')
      .text('CERTIFICATE', 0, 80, { align: 'center' });

    doc.fontSize(20)
      .fillColor('#666')
      .text('OF COMPLETION', 0, 130, { align: 'center' });

    // خط فاصل
    doc.moveTo(200, 170).lineTo(width - 200, 170).stroke('#ddd');

    // النص الرئيسي
    doc.fontSize(14)
      .fillColor('#666')
      .text('This is to certify that', 0, 200, { align: 'center' });

    // اسم الطالب
    doc.fontSize(32)
      .fillColor('#333')
      .text(certificate.user.name, 0, 230, { align: 'center' });

    doc.fontSize(14)
      .fillColor('#666')
      .text('has successfully completed the course', 0, 280, { align: 'center' });

    // اسم الكورس
    doc.fontSize(24)
      .fillColor('#667eea')
      .text(certificate.course.titleEn, 0, 310, { align: 'center' });

    doc.fontSize(16)
      .fillColor('#888')
      .text(certificate.course.titleAr, 0, 345, { align: 'center' });

    // التاريخ
    const issueDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.fontSize(12)
      .fillColor('#666')
      .text(`Issued on: ${issueDate}`, 0, 400, { align: 'center' });

    // رقم الشهادة
    doc.fontSize(10)
      .fillColor('#999')
      .text(`Certificate ID: ${certificate.certificateId}`, 0, 430, { align: 'center' });

    // المدرب
    doc.fontSize(14)
      .fillColor('#666')
      .text('Instructor', 150, 470, { align: 'left' });

    doc.fontSize(16)
      .fillColor('#333')
      .text(certificate.course.instructor.name, 150, 490, { align: 'left' });

    // خط التوقيع
    doc.moveTo(100, 520).lineTo(300, 520).stroke('#333');

    // شعار المنصة
    doc.fontSize(18)
      .fillColor('#667eea')
      .text('مسارات', width - 250, 470, { align: 'right' });

    doc.fontSize(10)
      .fillColor('#999')
      .text('Masarat - ABA Training', width - 250, 495, { align: 'right' });

    doc.end();

    // انتظار الانتهاء من إنشاء PDF
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // إرجاع الـ PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
