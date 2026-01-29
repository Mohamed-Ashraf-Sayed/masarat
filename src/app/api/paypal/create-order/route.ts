import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { createPayPalOrder } from '@/lib/paypal';

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
    const { courseId, couponCode } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { name: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
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
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Calculate price with coupon if provided
    let finalPrice = course.price;
    let discount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.isActive) {
        // Check if coupon is valid
        const now = new Date();
        if (
          (!coupon.validUntil || coupon.validUntil > now) &&
          (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
          (!coupon.courseId || coupon.courseId === courseId) &&
          (!coupon.minPurchase || course.price >= coupon.minPurchase)
        ) {
          // Check if user already used this coupon
          const existingUsage = await prisma.couponUsage.findUnique({
            where: {
              couponId_userId: {
                couponId: coupon.id,
                userId: tokenData.userId,
              },
            },
          });

          if (!existingUsage) {
            if (coupon.discountType === 'PERCENTAGE') {
              discount = (course.price * coupon.discountValue) / 100;
              if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
              }
            } else {
              discount = coupon.discountValue;
            }
            finalPrice = Math.max(0, course.price - discount);
            couponId = coupon.id;
          }
        }
      }
    }

    // If course is free, enroll directly
    if (finalPrice === 0) {
      await prisma.enrollment.create({
        data: {
          userId: tokenData.userId,
          courseId,
        },
      });

      // Record coupon usage if used
      if (couponId) {
        await prisma.couponUsage.create({
          data: {
            couponId,
            userId: tokenData.userId,
            discount,
          },
        });

        await prisma.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return NextResponse.json({
        success: true,
        data: { free: true, enrolled: true },
        message: 'Enrolled successfully',
      });
    }

    // Create PayPal order
    const language = request.headers.get('accept-language')?.includes('ar') ? 'ar' : 'en';
    const description = language === 'ar' ? course.titleAr : course.titleEn;

    const paypalOrder = await createPayPalOrder(
      finalPrice,
      'USD',
      description,
      `${tokenData.userId}:${courseId}:${couponId || 'none'}`
    );

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId: tokenData.userId,
        courseId,
        amount: finalPrice,
        currency: 'USD',
        status: 'PENDING',
        paymentMethod: 'paypal',
        paypalOrderId: paypalOrder.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: paypalOrder.id,
        originalPrice: course.price,
        discount,
        finalPrice,
      },
    });
  } catch (error) {
    console.error('Create PayPal order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
