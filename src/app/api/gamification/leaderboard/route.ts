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

// GET - جلب الليدربورد
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '50');
    const courseId = searchParams.get('courseId');

    let dateFilter: Date | undefined;
    if (type === 'weekly') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (type === 'monthly') {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    // Get leaderboard based on total points or recent points
    let leaderboard;

    if (type === 'all') {
      leaderboard = await prisma.userPoints.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { totalPoints: 'desc' },
        take: limit,
      });
    } else {
      // Get points from transactions in the time period
      const pointsByUser = await prisma.pointTransaction.groupBy({
        by: ['userId'],
        _sum: {
          points: true,
        },
        where: {
          createdAt: dateFilter ? { gte: dateFilter } : undefined,
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
        take: limit,
      });

      const userIds = pointsByUser.map((p) => p.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          points: true,
        },
      });

      leaderboard = pointsByUser.map((p) => {
        const user = users.find((u) => u.id === p.userId);
        return {
          userId: p.userId,
          periodPoints: p._sum.points || 0,
          totalPoints: user?.points?.totalPoints || 0,
          level: user?.points?.level || 1,
          streak: user?.points?.streak || 0,
          user: {
            id: user?.id,
            name: user?.name,
            avatar: user?.avatar,
            role: user?.role,
          },
        };
      });
    }

    // Get current user's rank
    let userRank = null;
    if (tokenData) {
      if (type === 'all') {
        const userPoints = await prisma.userPoints.findUnique({
          where: { userId: tokenData.userId },
        });

        if (userPoints) {
          const rank = await prisma.userPoints.count({
            where: {
              totalPoints: { gt: userPoints.totalPoints },
            },
          });
          userRank = {
            rank: rank + 1,
            points: userPoints.totalPoints,
            level: userPoints.level,
            streak: userPoints.streak,
          };
        }
      } else {
        const userPeriodPoints = await prisma.pointTransaction.aggregate({
          where: {
            userId: tokenData.userId,
            createdAt: dateFilter ? { gte: dateFilter } : undefined,
          },
          _sum: {
            points: true,
          },
        });

        const higherRanks = await prisma.pointTransaction.groupBy({
          by: ['userId'],
          _sum: {
            points: true,
          },
          where: {
            createdAt: dateFilter ? { gte: dateFilter } : undefined,
          },
          having: {
            points: {
              _sum: {
                gt: userPeriodPoints._sum.points || 0,
              },
            },
          },
        });

        userRank = {
          rank: higherRanks.length + 1,
          periodPoints: userPeriodPoints._sum.points || 0,
        };
      }
    }

    // Course-specific leaderboard
    let courseLeaderboard = null;
    if (courseId) {
      const enrolledUsers = await prisma.enrollment.findMany({
        where: { courseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              points: true,
            },
          },
        },
      });

      courseLeaderboard = enrolledUsers
        .map((e) => ({
          userId: e.userId,
          user: {
            id: e.user.id,
            name: e.user.name,
            avatar: e.user.avatar,
          },
          totalPoints: e.user.points?.totalPoints || 0,
          level: e.user.points?.level || 1,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: type === 'all'
          ? leaderboard.map((item, index) => ({
              rank: index + 1,
              ...item,
            }))
          : leaderboard.map((item, index) => ({
              rank: index + 1,
              ...item,
            })),
        userRank,
        courseLeaderboard,
        type,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الليدربورد' },
      { status: 500 }
    );
  }
}
