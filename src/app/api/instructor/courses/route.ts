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

// GET - جلب كورسات المدرب
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (tokenData.role !== 'INSTRUCTOR' && tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const courses = await prisma.course.findMany({
      where: { instructorId: tokenData.userId },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        lessons: {
          select: {
            id: true,
            duration: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
            reviews: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedCourses = courses.map(course => {
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0;
      const totalDuration = course.lessons.reduce((sum, l) => sum + (l.duration || 0), 0);

      return {
        id: course.id,
        title: {
          ar: course.titleAr,
          en: course.titleEn,
        },
        thumbnail: course.thumbnail,
        price: course.price,
        level: course.level,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        category: {
          id: course.category.id,
          name: {
            ar: course.category.nameAr,
            en: course.category.nameEn,
          },
        },
        stats: {
          studentsCount: course._count.enrollments,
          lessonsCount: course._count.lessons,
          reviewsCount: course._count.reviews,
          rating: Math.round(avgRating * 10) / 10,
          duration: Math.round(totalDuration / 60 * 10) / 10,
        },
        createdAt: course.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedCourses,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST - إنشاء كورس جديد
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (tokenData.role !== 'INSTRUCTOR' && tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      price,
      originalPrice,
      level,
      categoryId,
      thumbnail,
    } = body;

    if (!titleAr || !titleEn || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        titleAr,
        titleEn,
        descriptionAr: descriptionAr || '',
        descriptionEn: descriptionEn || '',
        price: price || 0,
        originalPrice: originalPrice || null,
        level: level || 'BEGINNER',
        categoryId,
        instructorId: tokenData.userId,
        thumbnail: thumbnail || '',
        isPublished: false,
        isFeatured: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
