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

// GET - جلب بيانات تسجيل المستخدم في كورس معين
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = params;

    // جلب بيانات التسجيل مع التقدم
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: tokenData.userId,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 404 }
      );
    }

    // جلب الدروس المكتملة من LessonProgress
    const completedLessons = await prisma.lessonProgress.findMany({
      where: {
        userId: tokenData.userId,
        lessonId: {
          in: enrollment.course.lessons.map(l => l.id),
        },
      },
      select: {
        lessonId: true,
        isCompleted: true,
      },
    });

    const completedLessonIds = completedLessons
      .filter(lp => lp.isCompleted)
      .map(lp => lp.lessonId);

    return NextResponse.json({
      success: true,
      data: {
        id: enrollment.id,
        progress: enrollment.progress,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedLessons: completedLessonIds,
      },
    });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollment' },
      { status: 500 }
    );
  }
}
