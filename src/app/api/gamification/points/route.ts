import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { calculateLevelPoints, calculateNextLevelPoints } from '@/lib/gamification';

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

// GET - جلب نقاط المستخدم
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || tokenData.userId;

    const userPoints = await prisma.userPoints.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!userPoints) {
      // Create points record if doesn't exist
      const newPoints = await prisma.userPoints.create({
        data: {
          userId,
          totalPoints: 0,
          level: 1,
          streak: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...newPoints,
          nextLevelPoints: calculateNextLevelPoints(1),
          currentLevelProgress: 0,
        },
      });
    }

    // Calculate level progress
    const currentLevelPoints = calculateLevelPoints(userPoints.level);
    const nextLevelPoints = calculateNextLevelPoints(userPoints.level);
    const currentLevelProgress =
      ((userPoints.totalPoints - currentLevelPoints) /
        (nextLevelPoints - currentLevelPoints)) *
      100;

    // Get recent transactions
    const recentTransactions = await prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...userPoints,
        nextLevelPoints,
        currentLevelProgress: Math.min(100, Math.max(0, currentLevelProgress)),
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب النقاط' },
      { status: 500 }
    );
  }
}

