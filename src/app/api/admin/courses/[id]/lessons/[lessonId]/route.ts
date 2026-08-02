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

// GET - جلب درس معين
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
    });

    if (!lesson || lesson.courseId !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: lesson.id,
        title: {
          ar: lesson.titleAr,
          en: lesson.titleEn,
        },
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        order: lesson.order,
        isFree: lesson.isFree,
        requireQuizPass: lesson.requireQuizPass,
      },
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
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { titleAr, titleEn, description, videoUrl, duration, order, isFree, requireQuizPass } = body;

    const lesson = await prisma.lesson.update({
      where: { id: params.lessonId },
      data: {
        titleAr,
        titleEn,
        description: description || null,
        videoUrl: videoUrl || null,
        duration: duration || null,
        order: order,
        isFree: isFree,
        requireQuizPass: requireQuizPass ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: lesson.id,
        title: {
          ar: lesson.titleAr,
          en: lesson.titleEn,
        },
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        order: lesson.order,
        isFree: lesson.isFree,
        requireQuizPass: lesson.requireQuizPass,
      },
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث جزئي للدرس
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const lesson = await prisma.lesson.update({
      where: { id: params.lessonId },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: lesson.id,
        title: {
          ar: lesson.titleAr,
          en: lesson.titleEn,
        },
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        order: lesson.order,
        isFree: lesson.isFree,
        requireQuizPass: lesson.requireQuizPass,
      },
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
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // حذف تقدم الدروس أولاً
    await prisma.lessonProgress.deleteMany({
      where: { lessonId: params.lessonId },
    });

    // حذف الدرس
    await prisma.lesson.delete({
      where: { id: params.lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}
