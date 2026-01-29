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

// GET - جلب محاولات المستخدم في اختبار معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        passingScore: true,
        showResults: true,
        maxAttempts: true,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: id,
        userId: tokenData.userId,
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        score: true,
        totalPoints: true,
        earnedPoints: true,
        passed: true,
        answers: quiz.showResults, // Only include answers if showResults is true
        startedAt: true,
        completedAt: true,
        timeSpent: true,
      },
    });

    const bestAttempt = attempts.length > 0
      ? attempts.reduce((best, current) => current.score > best.score ? current : best)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          titleAr: quiz.titleAr,
          titleEn: quiz.titleEn,
          passingScore: quiz.passingScore,
          maxAttempts: quiz.maxAttempts,
        },
        attempts,
        attemptsCount: attempts.length,
        bestScore: bestAttempt?.score || 0,
        hasPassed: attempts.some(a => a.passed),
        canRetry: quiz.maxAttempts ? attempts.length < quiz.maxAttempts : true,
      },
    });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}
