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

// GET - جلب الشارات
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get all badges
    const allBadges = await prisma.badge.findMany({
      orderBy: [
        { category: 'asc' },
        { requirement: 'asc' },
      ],
    });

    // Get user's earned badges
    let earnedBadgeIds: string[] = [];
    if (tokenData || userId) {
      const targetUserId = userId || tokenData?.userId;
      const userBadges = await prisma.userBadge.findMany({
        where: { userId: targetUserId },
        select: { badgeId: true, earnedAt: true },
      });
      earnedBadgeIds = userBadges.map((ub) => ub.badgeId);
    }

    // Format badges with earned status
    const badges = allBadges.map((badge) => ({
      ...badge,
      earned: earnedBadgeIds.includes(badge.id),
    }));

    // Group by category
    const groupedBadges = {
      LEARNING: badges.filter((b) => b.category === 'LEARNING'),
      ACHIEVEMENT: badges.filter((b) => b.category === 'ACHIEVEMENT'),
      SOCIAL: badges.filter((b) => b.category === 'SOCIAL'),
      SPECIAL: badges.filter((b) => b.category === 'SPECIAL'),
    };

    return NextResponse.json({
      success: true,
      data: {
        badges,
        groupedBadges,
        earnedCount: earnedBadgeIds.length,
        totalCount: allBadges.length,
      },
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الشارات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء شارة (Admin only)
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      icon,
      category,
      requirement,
    } = await request.json();

    if (!nameAr || !nameEn || !descriptionAr || !descriptionEn || !icon || !category) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const badge = await prisma.badge.create({
      data: {
        nameAr,
        nameEn,
        descriptionAr,
        descriptionEn,
        icon,
        category,
        requirement: requirement || 1,
      },
    });

    return NextResponse.json({
      success: true,
      data: badge,
    });
  } catch (error) {
    console.error('Error creating badge:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الشارة' },
      { status: 500 }
    );
  }
}
