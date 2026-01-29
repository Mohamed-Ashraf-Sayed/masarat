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

// GET - جلب نتائج اختبارات المستخدم
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: tokenData.userId,
        completedAt: { not: null },
      },
      include: {
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
    });

    const formattedAttempts = attempts.map((attempt) => ({
      id: attempt.id,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      earnedPoints: attempt.earnedPoints,
      passed: attempt.passed,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.completedAt,
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

    // Calculate statistics
    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter((a) => a.passed).length;
    const averageScore =
      totalAttempts > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        attempts: formattedAttempts,
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
    console.error('Error fetching quiz results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz results' },
      { status: 500 }
    );
  }
}
