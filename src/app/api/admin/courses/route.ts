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

// GET - جلب جميع الكورسات للأدمن
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const courses = await prisma.course.findMany({
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
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

      return {
        id: course.id,
        title: {
          ar: course.titleAr,
          en: course.titleEn,
        },
        thumbnail: course.thumbnail,
        price: course.price,
        level: course.level,
        status: course.status,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        category: {
          id: course.category.id,
          name: {
            ar: course.category.nameAr,
            en: course.category.nameEn,
          },
        },
        instructor: course.instructor,
        stats: {
          studentsCount: course._count.enrollments,
          lessonsCount: course._count.lessons,
          rating: Math.round(avgRating * 10) / 10,
        },
        createdAt: course.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: formattedCourses });
  } catch (error) {
    console.error('Error fetching admin courses:', error);
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
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      thumbnail,
      previewVideo,
      price,
      originalPrice,
      level,
      duration,
      categoryId,
      instructorId,
      isPublished,
      isFeatured,
      learningOutcomesAr,
      learningOutcomesEn,
      requirementsAr,
      requirementsEn,
    } = body;

    // التحقق من الحقول المطلوبة
    if (!titleAr || !titleEn || !descriptionAr || !descriptionEn || !categoryId || !instructorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        thumbnail: thumbnail || null,
        previewVideo: previewVideo || null,
        price: price || 0,
        originalPrice: originalPrice || null,
        level: level || 'BEGINNER',
        duration: duration || 0,
        categoryId,
        instructorId,
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
        learningOutcomesAr: learningOutcomesAr || null,
        learningOutcomesEn: learningOutcomesEn || null,
        requirementsAr: requirementsAr || null,
        requirementsEn: requirementsEn || null,
      },
    });

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
