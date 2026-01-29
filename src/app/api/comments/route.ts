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

// GET - جلب التعليقات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {
      parentId: null, // Only top-level comments
      isApproved: true,
    };

    if (lessonId) {
      where.lessonId = lessonId;
    } else if (courseId) {
      where.courseId = courseId;
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
          replies: {
            where: { isApproved: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  role: true,
                },
              },
              _count: {
                select: { likes: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { likes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - إضافة تعليق جديد
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, lessonId, courseId, parentId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (!lessonId && !courseId) {
      return NextResponse.json(
        { success: false, error: 'Either lessonId or courseId is required' },
        { status: 400 }
      );
    }

    // Verify lesson or course exists
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (!lesson) {
        return NextResponse.json(
          { success: false, error: 'Lesson not found' },
          { status: 404 }
        );
      }
    }

    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        );
      }
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: tokenData.userId,
        lessonId: lessonId || null,
        courseId: courseId || null,
        parentId: parentId || null,
        isApproved: true, // Auto-approve for now
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
