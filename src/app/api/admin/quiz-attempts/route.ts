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

// GET - جلب جميع محاولات الاختبارات للأدمن
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    interface WhereClause {
      completedAt: { not: null };
      quizId?: string;
      quiz?: { courseId: string };
    }

    const where: WhereClause = {
      completedAt: { not: null },
    };

    if (quizId) {
      where.quizId = quizId;
    }

    if (courseId) {
      where.quiz = { courseId };
    }

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          quiz: {
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
          },
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quizAttempt.count({ where }),
    ]);

    // Calculate overall stats
    const allAttempts = await prisma.quizAttempt.findMany({
      where: { completedAt: { not: null } },
      select: { score: true, passed: true },
    });

    const totalAttempts = allAttempts.length;
    const passedAttempts = allAttempts.filter((a) => a.passed).length;
    const averageScore =
      totalAttempts > 0
        ? Math.round(allAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
        : 0;

    const formattedAttempts = attempts.map((attempt) => ({
      id: attempt.id,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      earnedPoints: attempt.earnedPoints,
      passed: attempt.passed,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.completedAt,
      user: {
        id: attempt.user.id,
        name: attempt.user.name,
        email: attempt.user.email,
        avatar: attempt.user.avatar,
      },
      quiz: {
        id: attempt.quiz.id,
        titleAr: attempt.quiz.titleAr,
        titleEn: attempt.quiz.titleEn,
        passingScore: attempt.quiz.passingScore,
        course: {
          id: attempt.quiz.course.id,
          titleAr: attempt.quiz.course.titleAr,
          titleEn: attempt.quiz.course.titleEn,
        },
        lesson: attempt.quiz.lesson
          ? {
              id: attempt.quiz.lesson.id,
              titleAr: attempt.quiz.lesson.titleAr,
              titleEn: attempt.quiz.lesson.titleEn,
            }
          : null,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        attempts: formattedAttempts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          totalAttempts,
          passedAttempts,
          failedAttempts: totalAttempts - passedAttempts,
          averageScore,
          passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz attempts' },
      { status: 500 }
    );
  }
}
