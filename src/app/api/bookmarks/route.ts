import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// GET - جلب الإشارات المرجعية
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const courseId = searchParams.get('courseId');

    const where: { userId: string; lessonId?: string; lesson?: { courseId: string } } = {
      userId: tokenData.userId,
    };

    if (lessonId) {
      where.lessonId = lessonId;
    }

    if (courseId) {
      where.lesson = { courseId };
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            duration: true,
            course: {
              select: {
                id: true,
                titleAr: true,
                titleEn: true,
                thumbnail: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: bookmarks,
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الإشارات المرجعية' },
      { status: 500 }
    );
  }
}

// POST - إضافة إشارة مرجعية
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lessonId, timestamp, note } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'معرف الدرس مطلوب' },
        { status: 400 }
      );
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'الدرس غير موجود' },
        { status: 404 }
      );
    }

    // Check if bookmark already exists
    const existing = await prisma.bookmark.findFirst({
      where: {
        userId: tokenData.userId,
        lessonId,
        timestamp: timestamp || null,
      },
    });

    if (existing) {
      // Update existing bookmark
      const updated = await prisma.bookmark.update({
        where: { id: existing.id },
        data: { note },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'تم تحديث الإشارة المرجعية',
      });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: tokenData.userId,
        lessonId,
        timestamp,
        note,
      },
      include: {
        lesson: {
          select: {
            titleAr: true,
            titleEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: bookmark,
    });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة الإشارة المرجعية' },
      { status: 500 }
    );
  }
}

// DELETE - حذف إشارة مرجعية
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('id');

    if (!bookmarkId) {
      return NextResponse.json(
        { success: false, error: 'معرف الإشارة المرجعية مطلوب' },
        { status: 400 }
      );
    }

    // Verify ownership
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: tokenData.userId,
      },
    });

    if (!bookmark) {
      return NextResponse.json(
        { success: false, error: 'الإشارة المرجعية غير موجودة' },
        { status: 404 }
      );
    }

    await prisma.bookmark.delete({
      where: { id: bookmarkId },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الإشارة المرجعية',
    });
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الإشارة المرجعية' },
      { status: 500 }
    );
  }
}
