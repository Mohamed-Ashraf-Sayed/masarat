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

// GET - جلب بيانات لوحة تحكم المدرب
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // التحقق من أن المستخدم مدرب
    if (!['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Instructors only.' },
        { status: 403 }
      );
    }

    const instructorId = tokenData.userId;

    // جلب كورسات المدرب مع الإحصائيات
    const courses = await prisma.course.findMany({
      where: { instructorId },
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
        enrollments: {
          select: {
            id: true,
            progress: true,
            status: true,
            enrolledAt: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // جلب أحدث التسجيلات في كورسات المدرب
    const recentEnrollments = await prisma.enrollment.findMany({
      where: {
        course: {
          instructorId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 10,
    });

    // جلب أحدث المراجعات
    const recentReviews = await prisma.review.findMany({
      where: {
        course: {
          instructorId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // حساب الإحصائيات الكلية
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
    const totalLessons = courses.reduce((sum, c) => sum + c._count.lessons, 0);
    const totalReviews = courses.reduce((sum, c) => sum + c._count.reviews, 0);

    // حساب متوسط التقييم الكلي
    let totalRatingSum = 0;
    let totalRatingCount = 0;
    courses.forEach(course => {
      course.reviews.forEach(review => {
        totalRatingSum += review.rating;
        totalRatingCount++;
      });
    });
    const averageRating = totalRatingCount > 0 ? Math.round((totalRatingSum / totalRatingCount) * 10) / 10 : 0;

    // حساب الإيرادات (من المدفوعات المكتملة)
    const payments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        course: {
          instructorId,
        },
      },
    });
    const totalRevenue = payments._sum.amount || 0;

    // تنسيق بيانات الكورسات
    const formattedCourses = courses.map(course => {
      const courseRating = course.reviews.length > 0
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
          rating: Math.round(courseRating * 10) / 10,
          duration: Math.round(totalDuration / 60 * 10) / 10, // تحويل لساعات
        },
        createdAt: course.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalCourses,
          totalStudents,
          totalLessons,
          totalReviews,
          averageRating,
          totalRevenue,
        },
        courses: formattedCourses,
        recentEnrollments: recentEnrollments.map(e => ({
          id: e.id,
          user: e.user,
          course: {
            id: e.course.id,
            title: {
              ar: e.course.titleAr,
              en: e.course.titleEn,
            },
          },
          enrolledAt: e.enrolledAt,
        })),
        recentReviews: recentReviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          user: r.user,
          course: {
            id: r.course.id,
            title: {
              ar: r.course.titleAr,
              en: r.course.titleEn,
            },
          },
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching instructor dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
