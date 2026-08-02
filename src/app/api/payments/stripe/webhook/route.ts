import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import Stripe from 'stripe';
import { getRevenueSettings } from '@/lib/revenue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'No signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { userId, courseId, couponCode } = paymentIntent.metadata;

  // Fetch the latest charge to get receipt URL
  let receiptUrl: string | null = null;
  if (paymentIntent.latest_charge) {
    const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
    receiptUrl = charge.receipt_url || null;
  }

  // Update payment status
  await prisma.stripePayment.update({
    where: { paymentIntentId: paymentIntent.id },
    data: {
      status: 'succeeded',
      receiptUrl,
    },
  });

  // Create enrollment
  await prisma.enrollment.create({
    data: {
      userId,
      courseId,
    },
  });

  // Update coupon usage if used
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });

    if (coupon) {
      await prisma.$transaction([
        prisma.coupon.update({
          where: { code: couponCode },
          data: { usedCount: coupon.usedCount + 1 },
        }),
        prisma.couponUsage.create({
          data: {
            couponId: coupon.id,
            userId,
            discount: parseFloat(paymentIntent.metadata.discount || '0'),
          },
        }),
      ]);
    }
  }

  // Create invoice
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const amount = paymentIntent.amount / 100;
  const tax = amount * 0.14; // 14% tax
  const total = amount + tax;

  await prisma.invoice.create({
    data: {
      invoiceNumber,
      userId,
      courseId,
      amount,
      tax,
      total,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  // Add points for enrollment
  const userPoints = await prisma.userPoints.findUnique({
    where: { userId },
  });

  if (userPoints) {
    await prisma.userPoints.update({
      where: { userId },
      data: {
        totalPoints: userPoints.totalPoints + 50,
      },
    });

    await prisma.pointTransaction.create({
      data: {
        userId,
        points: 50,
        type: 'FIRST_ENROLLMENT',
        description: `التسجيل في دورة ${course?.titleAr}`,
        referenceId: courseId,
      },
    });
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      titleAr: 'تم التسجيل بنجاح',
      titleEn: 'Successfully Enrolled',
      messageAr: `تم تسجيلك في دورة "${course?.titleAr}" بنجاح`,
      messageEn: `You have been enrolled in "${course?.titleEn}" successfully`,
      type: 'enrollment',
    },
  });

  // ── Revenue Split (Section 10) ───────────────────────────────────────────
  // Compute revenue for the instructor tied to this course
  if (courseId && course?.instructorId) {
    const settings = await getRevenueSettings();
    const total = paymentIntent.amount / 100; // Stripe amounts are in cents
    const instructorAmount = +(total * settings.instructorShare).toFixed(2);
    const platformAmount   = +(total * settings.platformShare).toFixed(2);
    const entityAmount     = +(total - instructorAmount - platformAmount).toFixed(2);
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + settings.refundBufferDays);

    // Use StripePayment id as a stable unique reference for this payment
    const stripePaymentRecord = await prisma.stripePayment.findUnique({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (stripePaymentRecord) {
      // We link revenue to stripePayment by storing stripePaymentId in notes
      // (RevenueTransaction links to Payment model; for Stripe we record it via auditLog)
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'REVENUE_SPLIT_STRIPE',
          entity: 'StripePayment',
          entityId: stripePaymentRecord.id,
          newValue: JSON.stringify({
            total,
            instructorId: course.instructorId,
            instructorAmount,
            platformAmount,
            entityAmount,
            availableAt,
          }),
        },
      });
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PAYMENT_SUCCESS',
      entity: 'Payment',
      entityId: paymentIntent.id,
      newValue: JSON.stringify({
        courseId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }),
    },
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  await prisma.stripePayment.update({
    where: { paymentIntentId: paymentIntent.id },
    data: { status: 'failed' },
  });

  const { userId } = paymentIntent.metadata;

  await prisma.notification.create({
    data: {
      userId,
      titleAr: 'فشل الدفع',
      titleEn: 'Payment Failed',
      messageAr: 'فشلت عملية الدفع، يرجى المحاولة مرة أخرى',
      messageEn: 'Payment failed, please try again',
      type: 'payment_failed',
    },
  });
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  const payment = await prisma.stripePayment.findUnique({
    where: { paymentIntentId },
  });

  if (!payment) return;

  await prisma.stripePayment.update({
    where: { paymentIntentId },
    data: {
      status: 'refunded',
      refundId: charge.refunds?.data[0]?.id,
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
}
