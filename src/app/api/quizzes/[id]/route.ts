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

// GET - جلب اختبار للطالب (بدون الإجابات الصحيحة)
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
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            questionAr: true,
            questionEn: true,
            type: true,
            options: true,
            points: true,
            order: true,
            // لا نُرجع correctAnswer و explanation هنا
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (!quiz.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Quiz is not available' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: tokenData.userId,
          courseId: quiz.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get user's previous attempts
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
        passed: true,
        completedAt: true,
        timeSpent: true,
      },
    });

    // Check max attempts
    if (quiz.maxAttempts && attempts.length >= quiz.maxAttempts) {
      return NextResponse.json({
        success: true,
        data: {
          ...quiz,
          canAttempt: false,
          message: 'Maximum attempts reached',
          attempts,
          bestScore: Math.max(...attempts.map(a => a.score), 0),
        },
      });
    }

    // Remove correct answers from options before sending
    const questionsWithoutAnswers = quiz.questions.map(q => {
      // Parse options if it's a string
      let options: Array<{ ar: string; en: string; isCorrect?: boolean }>;

      if (typeof q.options === 'string') {
        try {
          options = JSON.parse(q.options);
        } catch {
          options = [];
        }
      } else {
        options = q.options as Array<{ ar: string; en: string; isCorrect?: boolean }>;
      }

      // Map options without isCorrect field
      const finalOptions = Array.isArray(options) ? options.map(opt => {
        // Handle both formats: { ar, en, isCorrect } and { ar, en }
        if (typeof opt === 'object' && opt !== null) {
          return {
            ar: opt.ar || '',
            en: opt.en || '',
          };
        }
        return { ar: '', en: '' };
      }) : [];

      return {
        ...q,
        options: finalOptions,
      };
    });

    // Shuffle questions if enabled
    let finalQuestions = questionsWithoutAnswers;
    if (quiz.shuffleQuestions) {
      finalQuestions = [...questionsWithoutAnswers].sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: quiz.id,
        titleAr: quiz.titleAr,
        titleEn: quiz.titleEn,
        descriptionAr: quiz.descriptionAr,
        descriptionEn: quiz.descriptionEn,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        showResults: quiz.showResults,
        course: quiz.course,
        lesson: quiz.lesson,
        questions: finalQuestions,
        totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
        canAttempt: true,
        attemptsCount: attempts.length,
        maxAttempts: quiz.maxAttempts,
        attempts,
        bestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}
