import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from token
function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

// POST - Process checkout and create enrollment
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, paymentMethod, billingInfo, cardInfo } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please log in again.' },
        { status: 401 }
      );
    }

    // Get payment settings
    const paymentSettingsRecord = await prisma.siteSetting.findUnique({
      where: { key: 'payment_settings' },
    });
    const paymentSettings = paymentSettingsRecord?.value
      ? JSON.parse(paymentSettingsRecord.value) as Record<string, unknown>
      : null;
    const currency = (paymentSettings?.currency as string) || 'USD';
    const requireManualApproval = paymentSettings?.requireManualApproval ?? true;

    // Get the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        price: true,
        isPublished: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Course is not available' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: tokenData.userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Determine payment status based on method and settings
    // Bank transfer always requires manual approval
    // Card/PayPal can be auto-approved if requireManualApproval is false
    const isBankTransfer = paymentMethod.toUpperCase() === 'BANK';
    const needsApproval = isBankTransfer || requireManualApproval;
    const paymentStatus = needsApproval ? 'PENDING' : 'COMPLETED';

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: tokenData.userId,
        courseId,
        amount: course.price,
        currency: currency,
        paymentMethod: paymentMethod.toUpperCase(),
        status: paymentStatus,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
    });

    // Create enrollment only if payment doesn't need approval
    let enrollment = null;
    if (!needsApproval) {
      enrollment = await prisma.enrollment.create({
        data: {
          userId: tokenData.userId,
          courseId,
          status: 'ACTIVE',
        },
      });
    }

    // Different response based on whether approval is needed
    if (needsApproval) {
      return NextResponse.json({
        success: true,
        data: {
          requiresApproval: true,
          payment: {
            id: payment.id,
            transactionId: payment.transactionId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
          },
          message: isBankTransfer
            ? 'Your order has been submitted. Please complete the bank transfer and wait for approval.'
            : 'Your order has been submitted and is pending approval.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        requiresApproval: false,
        enrollment: {
          id: enrollment!.id,
          status: enrollment!.status,
        },
        payment: {
          id: payment.id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
        },
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}
