import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { stripe, getOrCreateStripeCustomer, createPaymentIntent } from '@/lib/stripe';

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

// POST - إنشاء payment intent
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId, couponCode } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'معرف الدورة مطلوب' },
        { status: 400 }
      );
    }

    // Get course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'الدورة غير موجودة' },
        { status: 404 }
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
        { success: false, error: 'أنت مسجل بالفعل في هذه الدورة' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    let finalPrice = course.price;
    let discount = 0;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.isActive) {
        const now = new Date();
        const isValid =
          (!coupon.validUntil || coupon.validUntil > now) &&
          (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
          (!coupon.minPurchase || course.price >= coupon.minPurchase) &&
          (!coupon.courseId || coupon.courseId === courseId);

        if (isValid) {
          if (coupon.discountType === 'PERCENTAGE') {
            discount = (course.price * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
              discount = Math.min(discount, coupon.maxDiscount);
            }
          } else {
            discount = coupon.discountValue;
          }
          finalPrice = Math.max(0, course.price - discount);
        }
      }
    }

    // If free course or fully discounted
    if (finalPrice <= 0) {
      // Create enrollment directly
      await prisma.enrollment.create({
        data: {
          userId: tokenData.userId,
          courseId,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          enrolled: true,
          message: 'تم التسجيل في الدورة مجاناً',
        },
      });
    }

    // Create or get Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      tokenData.userId,
      user.email,
      user.name
    );

    // Create payment intent
    const paymentIntent = await createPaymentIntent(
      finalPrice,
      'usd',
      customerId,
      {
        userId: tokenData.userId,
        courseId,
        courseTitle: course.titleEn,
        discount: discount.toString(),
        couponCode: couponCode || '',
      }
    );

    // Save payment record
    await prisma.stripePayment.create({
      data: {
        paymentIntentId: paymentIntent.id,
        userId: tokenData.userId,
        courseId,
        amount: Math.round(finalPrice * 100),
        currency: 'usd',
        status: paymentIntent.status,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalPrice,
        discount,
        originalPrice: course.price,
      },
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء عملية الدفع' },
      { status: 500 }
    );
  }
}
