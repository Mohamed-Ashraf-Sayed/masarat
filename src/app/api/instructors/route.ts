import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - جلب جميع المدربين (عام للزوار)
export async function GET(request: NextRequest) {
  try {
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        courses: {
          where: { isPublished: true },
          select: {
            id: true,
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // حساب الإحصائيات لكل مدرب
    const instructorsWithStats = await Promise.all(
      instructors.map(async (instructor) => {
        const totalStudents = instructor.courses.reduce(
          (sum, course) => sum + course._count.enrollments,
          0
        );

        // حساب متوسط التقييم
        const avgRating = await prisma.review.aggregate({
          where: {
            course: {
              instructorId: instructor.id,
              isPublished: true,
            },
          },
          _avg: { rating: true },
        });

        return {
          id: instructor.id,
          name: instructor.name,
          avatar: instructor.avatar,
          bio: instructor.bio,
          coursesCount: instructor.courses.length,
          studentsCount: totalStudents,
          rating: avgRating._avg.rating || 0,
        };
      })
    );

    // فلترة المدربين الذين لديهم دورات منشورة على الأقل
    const activeInstructors = instructorsWithStats.filter(
      (instructor) => instructor.coursesCount > 0
    );

    return NextResponse.json({
      success: true,
      data: activeInstructors,
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}
