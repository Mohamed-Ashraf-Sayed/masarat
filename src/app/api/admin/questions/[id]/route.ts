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

// GET - جلب سؤال معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

// PUT - تحديث سؤال
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      points,
      explanation,
    } = body;

    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    // Convert options array to JSON string for storage
    const optionsToSave = options !== undefined
      ? (Array.isArray(options) ? JSON.stringify(options) : options)
      : existingQuestion.options;

    // Find the correct answer index from isCorrect flag
    let correctAnswerToSave = correctAnswer;
    if (correctAnswerToSave === undefined || correctAnswerToSave === '') {
      if (options && Array.isArray(options)) {
        const correctIndex = options.findIndex((opt: { isCorrect?: boolean }) => opt.isCorrect === true);
        if (correctIndex !== -1) {
          correctAnswerToSave = String(correctIndex);
        }
      }
    }
    if (correctAnswerToSave === undefined) {
      correctAnswerToSave = existingQuestion.correctAnswer;
    }

    const question = await prisma.question.update({
      where: { id },
      data: {
        questionAr: questionAr || existingQuestion.questionAr,
        questionEn: questionEn || existingQuestion.questionEn,
        type: type || existingQuestion.type,
        options: optionsToSave,
        correctAnswer: correctAnswerToSave,
        points: points !== undefined ? points : existingQuestion.points,
        explanation: explanation !== undefined ? explanation : existingQuestion.explanation,
      },
    });

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE - حذف سؤال
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
