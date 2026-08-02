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

// GET - جلب دروس دورة معينة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        description: true,
        videoUrl: true,
        duration: true,
        order: true,
        isFree: true,
        requireQuizPass: true,
      },
      orderBy: { order: 'asc' },
    });

    // Format lessons for frontend
    const formattedLessons = lessons.map(lesson => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: formattedLessons,
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST - إضافة درس جديد
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { titleAr, titleEn, description, videoUrl, duration, order, isFree, requireQuizPass } = body;

    const lesson = await prisma.lesson.create({
      data: {
        titleAr,
        titleEn,
        description: description || null,
        videoUrl: videoUrl || null,
        duration: duration || null,
        order: order || 1,
        isFree: isFree || false,
        requireQuizPass: requireQuizPass || false,
        courseId,
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
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
