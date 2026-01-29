import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// GET - جلب كوبون معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
        usages: {
          orderBy: { usedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupon' },
      { status: 500 }
    );
  }
}

// PUT - تحديث كوبون
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      maxUses,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      isActive,
      courseId,
    } = body;

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Check if new code already exists (if code is being changed)
    if (code && code.toUpperCase() !== existingCoupon.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Coupon code already exists' },
          { status: 400 }
        );
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: code ? code.toUpperCase() : existingCoupon.code,
        discountType: discountType || existingCoupon.discountType,
        discountValue: discountValue !== undefined ? discountValue : existingCoupon.discountValue,
        maxUses: maxUses !== undefined ? maxUses : existingCoupon.maxUses,
        minPurchase: minPurchase !== undefined ? minPurchase : existingCoupon.minPurchase,
        maxDiscount: maxDiscount !== undefined ? maxDiscount : existingCoupon.maxDiscount,
        validFrom: validFrom ? new Date(validFrom) : existingCoupon.validFrom,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : existingCoupon.validUntil,
        isActive: isActive !== undefined ? isActive : existingCoupon.isActive,
        courseId: courseId !== undefined ? (courseId || null) : existingCoupon.courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

// DELETE - حذف كوبون
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
