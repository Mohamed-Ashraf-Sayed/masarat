import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { notifyQuizResult } from '@/lib/notifications';

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

interface SubmittedAnswer {
  questionId: string;
  answer: string | number; // index for multiple choice, string for short answer
}

interface QuestionOption {
  ar: string;
  en: string;
  isCorrect?: boolean;
}

// POST - تسليم إجابات الاختبار
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { answers, timeSpent } = body as {
      answers: SubmittedAnswer[];
      timeSpent?: number;
    };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: 'Answers are required' },
        { status: 400 }
      );
    }

    // Get the quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
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

    // Check enrollment
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

    // Section 5: max 3 attempts by default; quiz can override via maxAttempts field
    const MAX_ATTEMPTS = quiz.maxAttempts ?? 3;
    const attemptsCount = await prisma.quizAttempt.count({
      where: { quizId: id, userId: tokenData.userId, completedAt: { not: null } },
    });
    if (attemptsCount >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: `Maximum attempts reached (${MAX_ATTEMPTS})` },
        { status: 409 }
      );
    }

    // Grade the answers
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers: Array<{
      questionId: string;
      answer: string | number;
      isCorrect: boolean;
      points: number;
      earnedPoints: number;
      correctAnswer?: string | number;
      explanation?: string | null;
    }> = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;

      const submittedAnswer = answers.find(a => a.questionId === question.id);
      let isCorrect = false;
      let correctAnswerValue: string | number = '';

      if (submittedAnswer) {
        // Parse options if it's a string
        let parsedOptions: QuestionOption[];
        if (typeof question.options === 'string') {
          try {
            parsedOptions = JSON.parse(question.options);
          } catch {
            parsedOptions = [];
          }
        } else {
          parsedOptions = question.options as unknown as QuestionOption[];
        }

        switch (question.type) {
          case 'MULTIPLE_CHOICE': {
            const correctIndex = Array.isArray(parsedOptions)
              ? parsedOptions.findIndex(opt => opt.isCorrect === true)
              : -1;
            correctAnswerValue = correctIndex;
            isCorrect = submittedAnswer.answer === correctIndex;
            break;
          }
          case 'TRUE_FALSE': {
            const correctIndex = Array.isArray(parsedOptions)
              ? parsedOptions.findIndex(opt => opt.isCorrect === true)
              : -1;
            correctAnswerValue = correctIndex;
            isCorrect = submittedAnswer.answer === correctIndex;
            break;
          }
          case 'SHORT_ANSWER': {
            // Case-insensitive comparison for short answers
            const correct = question.correctAnswer.toLowerCase().trim();
            const submitted = String(submittedAnswer.answer).toLowerCase().trim();
            correctAnswerValue = question.correctAnswer;
            isCorrect = correct === submitted;
            break;
          }
        }
      }

      if (isCorrect) {
        earnedPoints += question.points;
      }

      gradedAnswers.push({
        questionId: question.id,
        answer: submittedAnswer?.answer ?? '',
        isCorrect,
        points: question.points,
        earnedPoints: isCorrect ? question.points : 0,
        ...(quiz.showResults && {
          correctAnswer: correctAnswerValue,
          explanation: question.explanation,
        }),
      });
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    // Save the attempt - stringify answers for database storage
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: tokenData.userId,
        quizId: id,
        score,
        totalPoints,
        earnedPoints,
        passed,
        answers: JSON.stringify(gradedAnswers),
        timeSpent: timeSpent || null,
        completedAt: new Date(),
      },
    });

    // Notify quiz result (non-blocking)
    notifyQuizResult(tokenData.userId, quiz.titleEn, passed, score);

    // Return result
    const result = {
      id: attempt.id,
      score,
      totalPoints,
      earnedPoints,
      passed,
      passingScore: quiz.passingScore,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.completedAt,
    };

    // Include detailed results if showResults is enabled
    if (quiz.showResults) {
      return NextResponse.json({
        success: true,
        data: {
          ...result,
          answers: gradedAnswers,
          questionsCount: quiz.questions.length,
          correctCount: gradedAnswers.filter(a => a.isCorrect).length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
