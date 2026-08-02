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

// GET - جلب إحصائيات الكورس
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;

    // جلب الكورس مع التحقق من الملكية
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          select: {
            id: true,
            duration: true,
          },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.instructorId !== tokenData.userId && !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // حساب الإحصائيات
    const totalStudents = course.enrollments.length;
    const activeStudents = course.enrollments.filter(e => e.status === 'ACTIVE').length;
    const completedStudents = course.enrollments.filter(e => e.progress === 100).length;
    const totalLessons = course.lessons.length;
    const totalDuration = course.lessons.reduce((sum, l) => sum + (l.duration || 0), 0);

    const totalReviews = course.reviews.length;
    const averageRating = totalReviews > 0
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const completionRate = totalStudents > 0
      ? Math.round((completedStudents / totalStudents) * 100)
      : 0;

    // حساب الإيرادات
    const payments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        courseId,
        status: 'COMPLETED',
      },
    });
    const totalRevenue = payments._sum.amount || 0;

    // إحصائيات الشهر الحالي
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const enrollmentsThisMonth = course.enrollments.filter(
      e => new Date(e.enrolledAt) >= startOfMonth
    ).length;

    // محاولة جلب عدد المشاهدات (إذا كان هناك جدول للتتبع)
    let viewsThisMonth = 0;
    try {
      // هذا مجرد تقدير بناء على عدد الطلاب
      viewsThisMonth = enrollmentsThisMonth * 5; // تقدير تقريبي
    } catch {
      viewsThisMonth = 0;
    }

    // أحدث التسجيلات
    const recentEnrollments = course.enrollments.slice(0, 5).map(e => ({
      id: e.id,
      userName: e.user.name,
      userEmail: e.user.email,
      enrolledAt: e.enrolledAt.toISOString(),
      progress: e.progress,
    }));

    // أحدث المراجعات
    const recentReviews = course.reviews.slice(0, 5).map(r => ({
      id: r.id,
      userName: r.user.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        course: {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
          thumbnail: course.thumbnail,
          price: course.price,
          isPublished: course.isPublished,
        },
        stats: {
          totalStudents,
          activeStudents,
          completedStudents,
          totalLessons,
          totalDuration,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews,
          totalRevenue,
          completionRate,
          viewsThisMonth,
          enrollmentsThisMonth,
        },
        recentEnrollments,
        recentReviews,
      },
    });
  } catch (error) {
    console.error('Error fetching course stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course stats' },
      { status: 500 }
    );
  }
}
