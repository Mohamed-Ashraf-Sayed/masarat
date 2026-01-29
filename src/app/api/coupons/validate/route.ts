import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

// POST - التحقق من صلاحية الكوبون
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, courseId, amount } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Invalid coupon code', errorAr: 'كود الخصم غير صحيح' },
        { status: 404 }
      );
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, error: 'Coupon is not active', errorAr: 'كود الخصم غير مفعل' },
        { status: 400 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (coupon.validFrom > now) {
      return NextResponse.json(
        { success: false, error: 'Coupon is not yet valid', errorAr: 'كود الخصم غير ساري بعد' },
        { status: 400 }
      );
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      return NextResponse.json(
        { success: false, error: 'Coupon has expired', errorAr: 'كود الخصم منتهي الصلاحية' },
        { status: 400 }
      );
    }

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { success: false, error: 'Coupon usage limit reached', errorAr: 'تم استنفاد عدد مرات استخدام الكوبون' },
        { status: 400 }
      );
    }

    // Check if coupon is for specific course
    if (coupon.courseId && courseId && coupon.courseId !== courseId) {
      return NextResponse.json(
        { success: false, error: 'Coupon is not valid for this course', errorAr: 'كود الخصم غير صالح لهذه الدورة' },
        { status: 400 }
      );
    }

    // Check minimum purchase
    if (coupon.minPurchase && amount && amount < coupon.minPurchase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Minimum purchase amount is ' + coupon.minPurchase, 
          errorAr: 'الحد الأدنى للشراء هو ' + coupon.minPurchase
        },
        { status: 400 }
      );
    }

    // Check if user already used this coupon
    const existingUsage = await prisma.couponUsage.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId: tokenData.userId,
        },
      },
    });

    if (existingUsage) {
      return NextResponse.json(
        { success: false, error: 'You have already used this coupon', errorAr: 'لقد استخدمت هذا الكوبون من قبل' },
        { status: 400 }
      );
    }

    // Calculate discount
    let discount = 0;
    if (amount) {
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (amount * coupon.discountValue) / 100;
        // Apply max discount if set
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.discountValue;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount,
        },
        discount,
        finalPrice: amount ? Math.max(0, amount - discount) : null,
        finalAmount: amount ? Math.max(0, amount - discount) : null,
      },
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
