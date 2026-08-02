import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { processRefund } from '@/lib/stripe';

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

// POST - طلب استرداد
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can process refunds
    if (!['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بهذا الإجراء' },
        { status: 403 }
      );
    }

    const { paymentIntentId, amount, reason } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'معرف الدفع مطلوب' },
        { status: 400 }
      );
    }

    // Get payment
    const payment = await prisma.stripePayment.findUnique({
      where: { paymentIntentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'الدفعة غير موجودة' },
        { status: 404 }
      );
    }

    if (payment.status === 'refunded') {
      return NextResponse.json(
        { success: false, error: 'تم استرداد هذه الدفعة بالفعل' },
        { status: 400 }
      );
    }

    // Process refund via Stripe
    const refund = await processRefund(paymentIntentId, amount, reason);

    // Update payment status
    await prisma.stripePayment.update({
      where: { paymentIntentId },
      data: {
        status: 'refunded',
        refundId: refund.id,
        refundedAt: new Date(),
      },
    });

    // Update invoice status
    await prisma.invoice.updateMany({
      where: {
        userId: payment.userId,
        courseId: payment.courseId || undefined,
      },
      data: { status: 'REFUNDED' },
    });

    // Remove enrollment
    if (payment.courseId) {
      await prisma.enrollment.deleteMany({
        where: {
          userId: payment.userId,
          courseId: payment.courseId,
        },
      });
    }

    // Notify user
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        titleAr: 'تم استرداد المبلغ',
        titleEn: 'Refund Processed',
        messageAr: 'تم استرداد المبلغ المدفوع بنجاح',
        messageEn: 'Your payment has been refunded successfully',
        type: 'refund',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: tokenData.userId,
        action: 'PROCESS_REFUND',
        entity: 'Payment',
        entityId: paymentIntentId,
        newValue: JSON.stringify({
          amount: amount || payment.amount,
          reason,
          refundId: refund.id,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم استرداد المبلغ بنجاح',
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في استرداد المبلغ' },
      { status: 500 }
    );
  }
}
