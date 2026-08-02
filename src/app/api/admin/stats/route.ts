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

// GET - جلب إحصائيات لوحة التحكم
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // جلب الإحصائيات
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      totalEvents,
      totalCompetitions,
      recentUsers,
      recentEnrollments,
      courseStats,
      usersByRole,
    ] = await Promise.all([
      // إجمالي المستخدمين
      prisma.user.count(),
      // إجمالي الكورسات
      prisma.course.count(),
      // إجمالي التسجيلات
      prisma.enrollment.count(),
      // إجمالي الإيرادات
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      // إجمالي الفعاليات
      prisma.event.count(),
      // إجمالي المسابقات
      prisma.competition.count(),
      // أحدث المستخدمين
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
        },
      }),
      // أحدث التسجيلات
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { enrolledAt: 'desc' },
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
      }),
      // إحصائيات الكورسات
      prisma.course.findMany({
        take: 5,
        orderBy: {
          enrollments: {
            _count: 'desc',
          },
        },
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          price: true,
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),
      // المستخدمين حسب الدور
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
    ]);

    // تحويل بيانات المستخدمين حسب الدور
    const userRoles = {
      students: usersByRole.find((r) => r.role === 'STUDENT')?._count.id || 0,
      instructors: usersByRole.find((r) => r.role === 'INSTRUCTOR')?._count.id || 0,
      admins: usersByRole.find((r) => r.role === 'ADMIN')?._count.id || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCourses,
          totalEnrollments,
          totalRevenue: totalRevenue._sum.amount || 0,
          totalEvents,
          totalCompetitions,
        },
        userRoles,
        recentUsers,
        recentEnrollments: recentEnrollments.map((e) => ({
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
        topCourses: courseStats.map((c) => ({
          id: c.id,
          title: {
            ar: c.titleAr,
            en: c.titleEn,
          },
          studentsCount: c._count.enrollments,
          price: c.price,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
