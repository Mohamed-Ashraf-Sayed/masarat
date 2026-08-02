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

// GET - جلب تفاصيل درس
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId, lessonId } = await params;

    // التحقق من ملكية الكورس
    const course = await prisma.course.findUnique({
      where: { id: courseId },
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

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.courseId !== courseId) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

// PUT - تحديث درس
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId, lessonId } = await params;

    // التحقق من ملكية الكورس
    const course = await prisma.course.findUnique({
      where: { id: courseId },
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

    // التحقق من وجود الدرس
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!existingLesson || existingLesson.courseId !== courseId) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      titleAr,
      titleEn,
      description,
      videoUrl,
      duration,
      order,
      isFree,
      isPublished,
      requireQuizPass,
    } = body;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        titleAr,
        titleEn,
        description,
        videoUrl: videoUrl || null,
        duration,
        order,
        isFree,
        isPublished,
        requireQuizPass: requireQuizPass || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE - حذف درس
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId, lessonId } = await params;

    // التحقق من ملكية الكورس
    const course = await prisma.course.findUnique({
      where: { id: courseId },
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

    // التحقق من وجود الدرس
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!existingLesson || existingLesson.courseId !== courseId) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // حذف الدرس
    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    // إعادة ترتيب الدروس المتبقية
    const remainingLessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    for (let i = 0; i < remainingLessons.length; i++) {
      await prisma.lesson.update({
        where: { id: remainingLessons[i].id },
        data: { order: i + 1 },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}
