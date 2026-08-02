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

// GET - جلب اختبار معين مع الأسئلة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
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
        },
        _count: {
          select: {
            attempts: true,
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

    // Get statistics
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: id, completedAt: { not: null } },
      select: { score: true, passed: true },
    });

    const stats = {
      totalAttempts: attempts.length,
      passedAttempts: attempts.filter(a => a.passed).length,
      averageScore: attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: { ...quiz, stats },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

// PUT - تحديث اختبار
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      lessonId,
      passingScore,
      timeLimit,
      isPublished,
      showResults,
      shuffleQuestions,
      maxAttempts,
    } = body;

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Verify lesson if provided
    if (lessonId) {
      const lesson = await prisma.lesson.findFirst({
        where: { id: lessonId, courseId: existingQuiz.courseId },
      });

      if (!lesson) {
        return NextResponse.json(
          { success: false, error: 'Lesson not found or does not belong to this course' },
          { status: 404 }
        );
      }
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        titleAr: titleAr || existingQuiz.titleAr,
        titleEn: titleEn || existingQuiz.titleEn,
        descriptionAr: descriptionAr !== undefined ? descriptionAr : existingQuiz.descriptionAr,
        descriptionEn: descriptionEn !== undefined ? descriptionEn : existingQuiz.descriptionEn,
        lessonId: lessonId !== undefined ? (lessonId || null) : existingQuiz.lessonId,
        passingScore: passingScore !== undefined ? passingScore : existingQuiz.passingScore,
        timeLimit: timeLimit !== undefined ? (timeLimit || null) : existingQuiz.timeLimit,
        isPublished: isPublished !== undefined ? isPublished : existingQuiz.isPublished,
        showResults: showResults !== undefined ? showResults : existingQuiz.showResults,
        shuffleQuestions: shuffleQuestions !== undefined ? shuffleQuestions : existingQuiz.shuffleQuestions,
        maxAttempts: maxAttempts !== undefined ? (maxAttempts || null) : existingQuiz.maxAttempts,
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
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quiz' },
      { status: 500 }
    );
  }
}

// DELETE - حذف اختبار
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}
