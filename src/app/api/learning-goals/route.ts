import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// GET - جلب أهداف التعلم
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const goals = await prisma.learningGoal.findMany({
      where: { userId: tokenData.userId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total learning time
    const progressData = await prisma.lessonProgress.findMany({
      where: { userId: tokenData.userId },
      select: { watchedTime: true },
    });

    const totalWatchedMinutes = progressData.reduce(
      (sum, p) => sum + (p.watchedTime || 0),
      0
    ) / 60;

    // Update goal progress
    const updatedGoals = goals.map((goal) => {
      const progressHours = totalWatchedMinutes / 60;
      const progress = Math.min(100, (progressHours / goal.targetHours) * 100);
      return {
        ...goal,
        currentHours: Math.round(progressHours * 10) / 10,
        progress: Math.round(progress),
        completed: progress >= 100,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        goals: updatedGoals,
        stats: {
          totalHours: Math.round(totalWatchedMinutes / 60 * 10) / 10,
          activeGoals: goals.filter((g) => !g.completed).length,
          completedGoals: goals.filter((g) => g.completed).length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching learning goals:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب أهداف التعلم' },
      { status: 500 }
    );
  }
}

// POST - إنشاء هدف تعلم
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { titleAr, titleEn, targetHours, deadline } = await request.json();

    if (!titleAr || !titleEn || !targetHours) {
      return NextResponse.json(
        { success: false, error: 'العنوان وعدد الساعات المستهدفة مطلوبان' },
        { status: 400 }
      );
    }

    const goal = await prisma.learningGoal.create({
      data: {
        userId: tokenData.userId,
        titleAr,
        titleEn,
        targetHours,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('Error creating learning goal:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء هدف التعلم' },
      { status: 500 }
    );
  }
}

// PUT - تحديث هدف تعلم
export async function PUT(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, titleAr, titleEn, targetHours, deadline, completed } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الهدف مطلوب' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.learningGoal.findFirst({
      where: {
        id,
        userId: tokenData.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'الهدف غير موجود' },
        { status: 404 }
      );
    }

    const goal = await prisma.learningGoal.update({
      where: { id },
      data: {
        titleAr: titleAr || existing.titleAr,
        titleEn: titleEn || existing.titleEn,
        targetHours: targetHours || existing.targetHours,
        deadline: deadline ? new Date(deadline) : existing.deadline,
        completed: completed !== undefined ? completed : existing.completed,
      },
    });

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('Error updating learning goal:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث هدف التعلم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف هدف تعلم
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الهدف مطلوب' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.learningGoal.findFirst({
      where: {
        id,
        userId: tokenData.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'الهدف غير موجود' },
        { status: 404 }
      );
    }

    await prisma.learningGoal.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الهدف',
    });
  } catch (error) {
    console.error('Error deleting learning goal:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف الهدف' },
      { status: 500 }
    );
  }
}
