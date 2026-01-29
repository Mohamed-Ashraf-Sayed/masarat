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

// GET - جلب الإنجازات
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

    // Get all achievements
    const achievements = await prisma.achievement.findMany({
      orderBy: { target: 'asc' },
    });

    // Get user's achievement progress
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
    });

    // Calculate progress for each achievement
    const achievementsWithProgress = await Promise.all(
      achievements.map(async (achievement) => {
        const userProgress = userAchievements.find(
          (ua) => ua.achievementId === achievement.id
        );

        let progress = userProgress?.progress || 0;
        let completed = userProgress?.completed || false;

        // Calculate actual progress if not completed
        if (!completed) {
          switch (achievement.type) {
            case 'COURSES_COMPLETED': {
              const completedCourses = await prisma.enrollment.count({
                where: {
                  userId,
                  status: 'COMPLETED',
                },
              });
              progress = completedCourses;
              break;
            }
            case 'QUIZZES_PASSED': {
              const passedQuizzes = await prisma.quizAttempt.count({
                where: {
                  userId,
                  passed: true,
                },
              });
              progress = passedQuizzes;
              break;
            }
            case 'STREAK_DAYS': {
              const userPoints = await prisma.userPoints.findUnique({
                where: { userId },
              });
              progress = userPoints?.streak || 0;
              break;
            }
            case 'POINTS_EARNED': {
              const userPoints = await prisma.userPoints.findUnique({
                where: { userId },
              });
              progress = userPoints?.totalPoints || 0;
              break;
            }
            case 'COMMENTS_MADE': {
              const comments = await prisma.comment.count({
                where: { userId },
              });
              const forumPosts = await prisma.forumPost.count({
                where: { authorId: userId },
              });
              progress = comments + forumPosts;
              break;
            }
            case 'HELPFUL_ANSWERS': {
              const helpfulAnswers = await prisma.forumPost.count({
                where: {
                  authorId: userId,
                  isAnswer: true,
                },
              });
              progress = helpfulAnswers;
              break;
            }
          }

          // Update progress in database
          if (userProgress) {
            await prisma.userAchievement.update({
              where: { id: userProgress.id },
              data: { progress },
            });
          } else {
            await prisma.userAchievement.create({
              data: {
                userId,
                achievementId: achievement.id,
                progress,
              },
            });
          }

          // Check if completed
          if (progress >= achievement.target) {
            completed = true;
            await prisma.userAchievement.updateMany({
              where: {
                userId,
                achievementId: achievement.id,
              },
              data: {
                completed: true,
                completedAt: new Date(),
              },
            });

            // Award points
            const userPoints = await prisma.userPoints.findUnique({
              where: { userId },
            });

            if (userPoints) {
              await prisma.userPoints.update({
                where: { userId },
                data: {
                  totalPoints: userPoints.totalPoints + achievement.points,
                },
              });

              await prisma.pointTransaction.create({
                data: {
                  userId,
                  points: achievement.points,
                  type: 'BADGE_EARNED',
                  description: `إنجاز: ${achievement.nameAr}`,
                  referenceId: achievement.id,
                },
              });
            }

            // Notify user
            await prisma.notification.create({
              data: {
                userId,
                titleAr: `إنجاز جديد: ${achievement.nameAr}`,
                titleEn: `Achievement Unlocked: ${achievement.nameEn}`,
                messageAr: `حصلت على ${achievement.points} نقطة`,
                messageEn: `You earned ${achievement.points} points`,
                type: 'achievement',
              },
            });
          }
        }

        return {
          ...achievement,
          progress,
          completed,
          completedAt: userProgress?.completedAt,
          progressPercentage: Math.min(100, (progress / achievement.target) * 100),
        };
      })
    );

    // Group achievements
    const completedAchievements = achievementsWithProgress.filter((a) => a.completed);
    const inProgressAchievements = achievementsWithProgress.filter((a) => !a.completed);

    return NextResponse.json({
      success: true,
      data: {
        achievements: achievementsWithProgress,
        completed: completedAchievements,
        inProgress: inProgressAchievements,
        stats: {
          total: achievements.length,
          completed: completedAchievements.length,
          totalPointsEarned: completedAchievements.reduce((sum, a) => sum + a.points, 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الإنجازات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء إنجاز (Admin only)
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
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
      type,
      target,
      points,
    } = await request.json();

    const achievement = await prisma.achievement.create({
      data: {
        nameAr,
        nameEn,
        descriptionAr,
        descriptionEn,
        icon,
        type,
        target,
        points,
      },
    });

    return NextResponse.json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الإنجاز' },
      { status: 500 }
    );
  }
}
