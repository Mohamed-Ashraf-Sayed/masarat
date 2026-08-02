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

// GET - جلب مواضيع منتدى
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const { forumId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where: { forumId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.forumThread.count({ where: { forumId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: threads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المواضيع' },
      { status: 500 }
    );
  }
}

// POST - إنشاء موضوع جديد
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) {
  try {
    const { forumId } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { titleAr, titleEn, content } = await request.json();

    if (!titleAr || !titleEn || !content) {
      return NextResponse.json(
        { success: false, error: 'العنوان والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    // Verify forum exists
    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
    });

    if (!forum) {
      return NextResponse.json(
        { success: false, error: 'المنتدى غير موجود' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in course (if course forum)
    if (forum.courseId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: tokenData.userId,
            courseId: forum.courseId,
          },
        },
      });

      const isInstructor = await prisma.course.findFirst({
        where: {
          id: forum.courseId,
          instructorId: tokenData.userId,
        },
      });

      if (!enrollment && !isInstructor && !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
        return NextResponse.json(
          { success: false, error: 'يجب أن تكون مسجلاً في الدورة للمشاركة' },
          { status: 403 }
        );
      }
    }

    const thread = await prisma.forumThread.create({
      data: {
        titleAr,
        titleEn,
        content,
        forumId,
        authorId: tokenData.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Add points for creating a thread
    const userPoints = await prisma.userPoints.findUnique({
      where: { userId: tokenData.userId },
    });

    if (userPoints) {
      await prisma.userPoints.update({
        where: { userId: tokenData.userId },
        data: {
          totalPoints: userPoints.totalPoints + 10,
        },
      });

      await prisma.pointTransaction.create({
        data: {
          userId: tokenData.userId,
          points: 10,
          type: 'COMMENT',
          description: 'إنشاء موضوع في المنتدى',
          referenceId: thread.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: thread,
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الموضوع' },
      { status: 500 }
    );
  }
}
