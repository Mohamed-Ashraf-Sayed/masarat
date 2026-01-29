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

// POST - إضافة سؤال جديد للاختبار
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      questionAr,
      questionEn,
      type,
      options,
      correctAnswer,
      points = 1,
      explanation,
    } = body;

    // Validate required fields
    if (!questionAr || !questionEn) {
      return NextResponse.json(
        { success: false, error: 'Question text is required in both languages' },
        { status: 400 }
      );
    }

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Get current max order
    const maxOrderQuestion = await prisma.question.findFirst({
      where: { quizId },
      orderBy: { order: 'desc' },
    });
    const newOrder = (maxOrderQuestion?.order ?? -1) + 1;

    // Convert options array to JSON string for storage
    const optionsToSave = Array.isArray(options) ? JSON.stringify(options) : '[]';

    // Find the correct answer index from isCorrect flag
    let correctAnswerToSave = correctAnswer;
    if ((correctAnswerToSave === undefined || correctAnswerToSave === '') && type !== 'SHORT_ANSWER') {
      if (options && Array.isArray(options)) {
        const correctIndex = options.findIndex((opt: { isCorrect?: boolean }) => opt.isCorrect === true);
        if (correctIndex !== -1) {
          correctAnswerToSave = String(correctIndex);
        }
      }
    }

    const question = await prisma.question.create({
      data: {
        questionAr,
        questionEn,
        type: type || 'MULTIPLE_CHOICE',
        options: optionsToSave,
        correctAnswer: correctAnswerToSave || '0',
        points,
        order: newOrder,
        explanation: explanation || null,
        quizId,
      },
    });

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

// GET - جلب جميع أسئلة الاختبار
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const questions = await prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
