import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

/**
 * GET /api/payments/refund-eligibility?paymentId=xxx
 *
 * Section 10 — Refund Conditions:
 * - Within 7 days of enrollment
 * - Course progress < 30%
 *
 * Returns { eligible, reason } so the client can show the correct UI.
 */
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const paymentId = request.nextUrl.searchParams.get('paymentId');
    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'paymentId is required' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, userId: true, courseId: true, status: true, createdAt: true, amount: true, currency: true },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    // Only the payment owner (or admin) can check eligibility
    if (payment.userId !== tokenData.userId && !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    if (payment.status !== 'COMPLETED') {
      return NextResponse.json({
        success: true,
        data: { eligible: false, reason: 'Payment is not in COMPLETED status' },
      });
    }

    // ── Rule 1: Within 7 days ────────────────────────────────────────────────
    const REFUND_WINDOW_DAYS = 7;
    const daysSincePurchase = (Date.now() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePurchase > REFUND_WINDOW_DAYS) {
      return NextResponse.json({
        success: true,
        data: {
          eligible: false,
          reason: `Refund window expired (${REFUND_WINDOW_DAYS} days). Purchase was ${Math.floor(daysSincePurchase)} days ago.`,
          daysSincePurchase: Math.floor(daysSincePurchase),
        },
      });
    }

    // ── Rule 2: Progress < 30% ────────────────────────────────────────────────
    if (payment.courseId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
        select: { progress: true },
      });

      const progress = enrollment?.progress ?? 0;
      const MAX_PROGRESS_FOR_REFUND = 30;

      if (progress >= MAX_PROGRESS_FOR_REFUND) {
        return NextResponse.json({
          success: true,
          data: {
            eligible: false,
            reason: `Course progress (${progress}%) exceeds ${MAX_PROGRESS_FOR_REFUND}% limit for refunds.`,
            progress,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        eligible: true,
        reason: 'Eligible for refund',
        amount: payment.amount,
        currency: payment.currency,
        daysRemaining: Math.ceil(REFUND_WINDOW_DAYS - daysSincePurchase),
      },
    });
  } catch (error) {
    console.error('Error checking refund eligibility:', error);
    return NextResponse.json({ success: false, error: 'Failed to check refund eligibility' }, { status: 500 });
  }
}
