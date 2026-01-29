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

// GET - جلب اختبارات دورة معينة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: tokenData.userId,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get all published quizzes for the course
    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId,
        isPublished: true,
      },
      include: {
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
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get user's attempts for each quiz
    const quizzesWithAttempts = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = await prisma.quizAttempt.findMany({
          where: {
            quizId: quiz.id,
            userId: tokenData.userId,
            completedAt: { not: null },
          },
          select: {
            id: true,
            score: true,
            passed: true,
            completedAt: true,
          },
          orderBy: { completedAt: 'desc' },
        });

        const bestAttempt = attempts.length > 0
          ? attempts.reduce((best, current) => current.score > best.score ? current : best)
          : null;

        return {
          id: quiz.id,
          titleAr: quiz.titleAr,
          titleEn: quiz.titleEn,
          descriptionAr: quiz.descriptionAr,
          descriptionEn: quiz.descriptionEn,
          passingScore: quiz.passingScore,
          timeLimit: quiz.timeLimit,
          maxAttempts: quiz.maxAttempts,
          lesson: quiz.lesson,
          questionsCount: quiz._count.questions,
          attemptsCount: attempts.length,
          bestScore: bestAttempt?.score || null,
          hasPassed: attempts.some(a => a.passed),
          lastAttempt: attempts[0] || null,
          canAttempt: quiz.maxAttempts ? attempts.length < quiz.maxAttempts : true,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: quizzesWithAttempts,
    });
  } catch (error) {
    console.error('Error fetching course quizzes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}
