import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

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

// GET - تحميل الفاتورة كـ PDF
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

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true },
        },
        course: {
          select: { titleAr: true, titleEn: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }

    // Verify ownership or admin
    if (invoice.userId !== tokenData.userId && tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك' },
        { status: 403 }
      );
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const width = doc.page.width;

    // Header
    doc.fontSize(24).fillColor('#667eea').text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice details
    doc.fontSize(12).fillColor('#333');
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-US')}`, {
      align: 'right',
    });
    doc.moveDown();

    // Separator
    doc.moveTo(50, doc.y).lineTo(width - 50, doc.y).stroke('#ddd');
    doc.moveDown();

    // Customer info
    doc.fontSize(14).fillColor('#667eea').text('Bill To:');
    doc.fontSize(12).fillColor('#333');
    doc.text(invoice.user.name);
    doc.text(invoice.user.email);
    doc.moveDown(2);

    // Items table header
    doc.fillColor('#667eea').fontSize(12);
    const tableTop = doc.y;
    doc.text('Description', 50, tableTop);
    doc.text('Amount', 400, tableTop, { width: 100, align: 'right' });
    doc.moveDown();

    // Separator
    doc.moveTo(50, doc.y).lineTo(width - 50, doc.y).stroke('#ddd');
    doc.moveDown();

    // Item
    doc.fillColor('#333');
    doc.text(
      invoice.course
        ? `Course: ${invoice.course.titleEn}`
        : 'Course Purchase',
      50,
      doc.y
    );
    doc.text(`$${invoice.amount.toFixed(2)}`, 400, doc.y - 14, {
      width: 100,
      align: 'right',
    });
    doc.moveDown();

    // Tax
    doc.text('Tax (14%)', 50, doc.y);
    doc.text(`$${invoice.tax.toFixed(2)}`, 400, doc.y - 14, {
      width: 100,
      align: 'right',
    });
    doc.moveDown();

    // Separator
    doc.moveTo(50, doc.y).lineTo(width - 50, doc.y).stroke('#ddd');
    doc.moveDown();

    // Total
    doc.fontSize(14).fillColor('#667eea');
    doc.text('Total', 50, doc.y);
    doc.text(`$${invoice.total.toFixed(2)}`, 400, doc.y - 14, {
      width: 100,
      align: 'right',
    });
    doc.moveDown(2);

    // Status
    const statusColors: Record<string, string> = {
      PAID: '#22c55e',
      PENDING: '#f59e0b',
      CANCELLED: '#ef4444',
      REFUNDED: '#6b7280',
    };

    doc.fontSize(12).fillColor(statusColors[invoice.status] || '#333');
    doc.text(`Status: ${invoice.status}`, { align: 'center' });

    if (invoice.paidAt) {
      doc.fillColor('#333');
      doc.text(
        `Paid on: ${new Date(invoice.paidAt).toLocaleDateString('en-US')}`,
        { align: 'center' }
      );
    }

    doc.moveDown(3);

    // Footer
    doc.fontSize(10).fillColor('#999');
    doc.text('Thank you for your purchase!', { align: 'center' });
    doc.text('Masarat - Applied Behavior Analysis Training', { align: 'center' });

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الفاتورة' },
      { status: 500 }
    );
  }
}
