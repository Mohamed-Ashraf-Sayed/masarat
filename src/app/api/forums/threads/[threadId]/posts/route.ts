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

// GET - جلب ردود موضوع
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Increment view count
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { views: { increment: 1 } },
    });

    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        forum: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            courseId: true,
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'الموضوع غير موجود' },
        { status: 404 }
      );
    }

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where: {
          threadId,
          parentId: null, // Only top-level posts
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [
          { isAnswer: 'desc' },
          { createdAt: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.forumPost.count({
        where: { threadId, parentId: null },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        thread,
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الردود' },
      { status: 500 }
    );
  }
}

// POST - إضافة رد
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content, parentId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'المحتوى مطلوب' },
        { status: 400 }
      );
    }

    // Verify thread exists and not locked
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      include: {
        forum: true,
      },
    });

    if (!thread) {
      return NextResponse.json(
        { success: false, error: 'الموضوع غير موجود' },
        { status: 404 }
      );
    }

    if (thread.isLocked && !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'الموضوع مغلق' },
        { status: 403 }
      );
    }

    const post = await prisma.forumPost.create({
      data: {
        content,
        threadId,
        authorId: tokenData.userId,
        parentId,
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

    // Update thread
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    // Notify thread author
    if (thread.authorId !== tokenData.userId) {
      await prisma.notification.create({
        data: {
          userId: thread.authorId,
          titleAr: 'رد جديد على موضوعك',
          titleEn: 'New reply to your thread',
          messageAr: `قام شخص بالرد على موضوعك "${thread.titleAr}"`,
          messageEn: `Someone replied to your thread "${thread.titleEn}"`,
          type: 'forum_reply',
        },
      });
    }

    // Add points
    const userPoints = await prisma.userPoints.findUnique({
      where: { userId: tokenData.userId },
    });

    if (userPoints) {
      await prisma.userPoints.update({
        where: { userId: tokenData.userId },
        data: {
          totalPoints: userPoints.totalPoints + 5,
        },
      });

      await prisma.pointTransaction.create({
        data: {
          userId: tokenData.userId,
          points: 5,
          type: 'COMMENT',
          description: 'إضافة رد في المنتدى',
          referenceId: post.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إضافة الرد' },
      { status: 500 }
    );
  }
}
