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

// GET - جلب جميع الاختبارات
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: { courseId?: string } = {};
    if (courseId) {
      where.courseId = courseId;
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
            },
          },
          lesson: {
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quiz.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        quizzes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

// POST - إنشاء اختبار جديد
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      courseId,
      lessonId,
      passingScore,
      timeLimit,
      isPublished,
      showResults,
      shuffleQuestions,
      maxAttempts,
    } = body;

    if (!titleAr || !titleEn || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Title and course are required' },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify lesson if provided
    if (lessonId) {
      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, courseId },
      });

      if (!lesson) {
        return NextResponse.json(
          { success: false, error: 'Lesson not found or does not belong to this course' },
          { status: 404 }
        );
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        titleAr,
        titleEn,
        descriptionAr: descriptionAr || null,
        descriptionEn: descriptionEn || null,
        courseId,
        lessonId: lessonId || null,
        passingScore: passingScore || 60,
        timeLimit: timeLimit || null,
        isPublished: isPublished || false,
        showResults: showResults !== false,
        shuffleQuestions: shuffleQuestions || false,
        maxAttempts: maxAttempts || null,
      },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
        lesson: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}
