import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { notifyCourseCompletion } from '@/lib/notifications';

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

// POST - تحديث تقدم الطالب في درس معين
export async function POST(
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
    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // التحقق من وجود التسجيل
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: tokenData.userId,
        courseId,
      },
      include: {
        course: {
          select: {
            titleEn: true,
            lessons: {
              select: { id: true },
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

    // التحقق من أن الدرس ينتمي للكورس
    const lessonBelongsToCourse = enrollment.course.lessons.some(l => l.id === lessonId);
    if (!lessonBelongsToCourse) {
      return NextResponse.json(
        { success: false, error: 'Lesson does not belong to this course' },
        { status: 400 }
      );
    }

    // إنشاء أو تحديث تقدم الدرس
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: tokenData.userId,
          lessonId,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId: tokenData.userId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // حساب نسبة التقدم الجديدة
    const lessonIds = enrollment.course.lessons.map(l => l.id);
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId: tokenData.userId,
        lessonId: { in: lessonIds },
        isCompleted: true,
      },
    });

    const totalLessons = enrollment.course.lessons.length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // تحديث نسبة التقدم في التسجيل
    const updateData: { progress: number; status?: 'COMPLETED'; completedAt?: Date } = {
      progress,
    };

    // Section 5 + 14.5: Course COMPLETED when ≥80% of lessons are done
    const COMPLETION_THRESHOLD = 80;
    const wasAlreadyCompleted = enrollment.status === 'COMPLETED';

    if (progress >= COMPLETION_THRESHOLD && !wasAlreadyCompleted) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();

      // الشهادات بتتصدر يدوياً من الأدمن بس (/admin/certificates) — مفيش إصدار تلقائي
      notifyCourseCompletion(tokenData.userId, enrollment.course.titleEn);
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        progress,
        completedLessons,
        totalLessons,
        isCompleted: progress === 100,
      },
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
