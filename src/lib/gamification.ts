import prisma from '@/lib/prisma';

// Helper functions for level calculation
export function calculateLevelPoints(level: number): number {
  // Points needed to reach this level
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function calculateNextLevelPoints(level: number): number {
  // Points needed for next level
  return Math.floor(100 * Math.pow(1.5, level));
}

// Function to check and update level
export async function checkAndUpdateLevel(userId: string) {
  const userPoints = await prisma.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) return;

  let newLevel = 1;
  while (calculateNextLevelPoints(newLevel) <= userPoints.totalPoints) {
    newLevel++;
  }

  if (newLevel > userPoints.level) {
    await prisma.userPoints.update({
      where: { userId },
      data: { level: newLevel },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        titleAr: `ترقية! وصلت للمستوى ${newLevel}`,
        titleEn: `Level Up! You reached level ${newLevel}`,
        messageAr: `مبروك! لقد وصلت للمستوى ${newLevel}`,
        messageEn: `Congratulations! You reached level ${newLevel}`,
        type: 'level_up',
      },
    });

    // Check for level badges
    await checkBadges(userId, 'level', newLevel);
  }
}

// Check and award badges
export async function checkBadges(userId: string, type: string, value: number) {
  const badges = await prisma.badge.findMany({
    where: {
      category: type === 'level' ? 'ACHIEVEMENT' : 'LEARNING',
      requirement: { lte: value },
    },
  });

  for (const badge of badges) {
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
    });

    if (!existing) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });

      await prisma.notification.create({
        data: {
          userId,
          titleAr: `شارة جديدة: ${badge.nameAr}`,
          titleEn: `New Badge: ${badge.nameEn}`,
          messageAr: badge.descriptionAr,
          messageEn: badge.descriptionEn,
          type: 'badge_earned',
        },
      });
    }
  }
}

// Add points to user
export async function addPoints(
  userId: string,
  points: number,
  type: string,
  description: string,
  referenceId?: string
) {
  const userPoints = await prisma.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    await prisma.userPoints.create({
      data: {
        userId,
        totalPoints: points,
        level: 1,
        streak: 0,
      },
    });
  } else {
    await prisma.userPoints.update({
      where: { userId },
      data: {
        totalPoints: userPoints.totalPoints + points,
      },
    });
  }

  // Create transaction record
  await prisma.pointTransaction.create({
    data: {
      userId,
      points,
      type: type as 'COURSE_COMPLETE' | 'QUIZ_PASS' | 'STREAK' | 'BADGE_EARNED' | 'COMMENT' | 'HELPFUL_ANSWER' | 'FIRST_ENROLLMENT' | 'DAILY_LOGIN',
      description,
      referenceId,
    },
  });

  // Check for level up
  await checkAndUpdateLevel(userId);
}
