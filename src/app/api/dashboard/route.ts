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

// GET - جلب بيانات لوحة تحكم الطالب
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = tokenData.userId;

    // جلب التسجيلات مع بيانات الكورسات
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            lessons: {
              select: {
                id: true,
                duration: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // جلب الشهادات
    const certificates = await prisma.certificate.findMany({
      where: { userId },
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

    // حساب الإحصائيات
    const totalEnrollments = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'COMPLETED').length;
    const totalCertificates = certificates.length;

    // حساب ساعات التعلم (الدقائق إلى ساعات)
    let totalLearningMinutes = 0;
    enrollments.forEach(e => {
      const courseDuration = e.course.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
      totalLearningMinutes += (courseDuration * e.progress) / 100;
    });
    const totalLearningHours = totalLearningMinutes / 60;

    // حساب نسبة الإنجاز الكلية
    const totalProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
      : 0;

    // جلب الإشعارات
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // تنسيق الكورسات المسجل فيها
    const enrolledCourses = enrollments.map(e => ({
      id: e.course.id,
      title: {
        ar: e.course.titleAr,
        en: e.course.titleEn,
      },
      description: {
        ar: e.course.descriptionAr,
        en: e.course.descriptionEn,
      },
      thumbnail: e.course.thumbnail,
      instructor: e.course.instructor,
      progress: e.progress,
      status: e.status,
      enrolledAt: e.enrolledAt,
      lessonsCount: e.course.lessons.length,
      totalDuration: e.course.lessons.reduce((sum, l) => sum + (l.duration || 0), 0),
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalEnrollments,
          completedCourses,
          totalCertificates,
          totalLearningHours: Math.round(totalLearningHours),
          completionRate: Math.round(totalProgress),
        },
        enrolledCourses,
        certificates: certificates.map(c => ({
          id: c.id,
          certificateId: c.certificateId,
          courseId: c.courseId,
          course: {
            title: {
              ar: c.course.titleAr,
              en: c.course.titleEn,
            },
          },
          issuedAt: c.issuedAt,
        })),
        notifications: notifications.map(n => ({
          id: n.id,
          title: {
            ar: n.titleAr,
            en: n.titleEn,
          },
          message: {
            ar: n.messageAr,
            en: n.messageEn,
          },
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
