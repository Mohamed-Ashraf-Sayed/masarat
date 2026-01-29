import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { capturePayPalPayment } from '@/lib/paypal';

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

export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { paypalOrderId: orderId },
      include: {
        course: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.userId !== tokenData.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (payment.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Payment already completed' },
        { status: 400 }
      );
    }

    // Capture the payment
    const captureResult = await capturePayPalPayment(orderId);

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const capture = captureResult.purchase_units[0].payments.captures[0];
    const payer = captureResult.payer;

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        transactionId: capture.id,
        paypalCaptureId: capture.id,
        paypalPayerId: payer.payer_id,
        paypalPayerEmail: payer.email_address,
      },
    });

    // Parse custom_id to get coupon info
    const customId = captureResult.purchase_units[0]?.custom_id || '';
    const [, , couponIdFromCustom] = customId.split(':');

    // Record coupon usage if applicable
    if (couponIdFromCustom && couponIdFromCustom !== 'none') {
      const existingUsage = await prisma.couponUsage.findUnique({
        where: {
          couponId_userId: {
            couponId: couponIdFromCustom,
            userId: tokenData.userId,
          },
        },
      });

      if (!existingUsage) {
        const coupon = await prisma.coupon.findUnique({
          where: { id: couponIdFromCustom },
        });

        if (coupon) {
          let discount = 0;
          if (payment.course) {
            if (coupon.discountType === 'PERCENTAGE') {
              discount = (payment.course.price * coupon.discountValue) / 100;
              if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
              }
            } else {
              discount = coupon.discountValue;
            }
          }

          await prisma.couponUsage.create({
            data: {
              couponId: couponIdFromCustom,
              userId: tokenData.userId,
              orderId: payment.id,
              discount,
            },
          });

          await prisma.coupon.update({
            where: { id: couponIdFromCustom },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    // Create enrollment
    if (payment.courseId) {
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: tokenData.userId,
            courseId: payment.courseId,
          },
        },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            userId: tokenData.userId,
            courseId: payment.courseId,
          },
        });
      }

      // Create notification
      await prisma.notification.create({
        data: {
          userId: tokenData.userId,
          titleAr: 'تم التسجيل بنجاح',
          titleEn: 'Enrollment Successful',
          messageAr: `تم تسجيلك في الدورة: ${payment.course?.titleAr}`,
          messageEn: `You have been enrolled in: ${payment.course?.titleEn}`,
          type: 'enrollment',
        },
      });

      // Create invoice
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await prisma.invoice.create({
        data: {
          invoiceNumber,
          userId: tokenData.userId,
          courseId: payment.courseId,
          amount: payment.amount,
          tax: 0,
          total: payment.amount,
          currency: payment.currency,
          status: 'PAID',
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        captureId: capture.id,
        status: 'COMPLETED',
      },
      message: 'Payment successful',
    });
  } catch (error) {
    console.error('Capture PayPal order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to capture payment' },
      { status: 500 }
    );
  }
}
