import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from token
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

// GET - جلب قائمة الأمنيات
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const wishlists = await prisma.wishlist.findMany({
      where: { userId: tokenData.userId },
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, name: true, avatar: true },
            },
            category: {
              select: { id: true, nameAr: true, nameEn: true },
            },
            _count: {
              select: { lessons: true, enrollments: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get ratings for each course
    const coursesWithRatings = await Promise.all(
      wishlists.map(async (wishlist) => {
        const avgRating = await prisma.review.aggregate({
          where: { courseId: wishlist.courseId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        return {
          ...wishlist,
          course: {
            ...wishlist.course,
            rating: avgRating._avg.rating || 0,
            reviewCount: avgRating._count.rating,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: coursesWithRatings,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST - إضافة/إزالة كورس من قائمة الأمنيات (Toggle)
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // التحقق من وجود الكورس
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // التحقق من وجود العنصر في قائمة الأمنيات
    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId: tokenData.userId,
          courseId,
        },
      },
    });

    if (existingWishlist) {
      // إزالة من قائمة الأمنيات
      await prisma.wishlist.delete({
        where: { id: existingWishlist.id },
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        message: 'تم إزالة الكورس من قائمة الأمنيات',
      });
    } else {
      // إضافة إلى قائمة الأمنيات
      await prisma.wishlist.create({
        data: {
          userId: tokenData.userId,
          courseId,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'added',
        message: 'تم إضافة الكورس إلى قائمة الأمنيات',
      });
    }
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update wishlist' },
      { status: 500 }
    );
  }
}

// DELETE - إزالة كورس من قائمة الأمنيات
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await prisma.wishlist.deleteMany({
      where: {
        userId: tokenData.userId,
        courseId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إزالة الكورس من قائمة الأمنيات',
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
