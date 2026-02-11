import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - جلب تفاصيل كورس معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            _count: {
              select: {
                courses: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            description: true,
            duration: true,
            videoUrl: true,
            isFree: true,
            order: true,
            requireQuizPass: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // حساب متوسط التقييم
    const avgRating = course.reviews.length > 0
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
      : 0;

    // حساب مدة الكورس الكلية (بالدقائق ثم تحويلها لساعات)
    const totalDuration = course.lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
    const durationHours = Math.round(totalDuration / 60 * 10) / 10;

    // تنسيق البيانات
    const formattedCourse = {
      id: course.id,
      title: {
        ar: course.titleAr,
        en: course.titleEn,
      },
      description: {
        ar: course.descriptionAr,
        en: course.descriptionEn,
      },
      thumbnail: course.thumbnail,
      previewVideo: course.previewVideo,
      price: course.price,
      originalPrice: course.originalPrice,
      level: course.level,
      duration: durationHours,
      isPublished: course.isPublished,
      isFeatured: course.isFeatured,
      learningOutcomes: {
        ar: course.learningOutcomesAr ? course.learningOutcomesAr.split('\n').filter((l: string) => l.trim()) : [],
        en: course.learningOutcomesEn ? course.learningOutcomesEn.split('\n').filter((l: string) => l.trim()) : [],
      },
      requirements: {
        ar: course.requirementsAr ? course.requirementsAr.split('\n').filter((l: string) => l.trim()) : [],
        en: course.requirementsEn ? course.requirementsEn.split('\n').filter((l: string) => l.trim()) : [],
      },
      createdAt: course.createdAt,
      category: {
        id: course.category.id,
        name: {
          ar: course.category.nameAr,
          en: course.category.nameEn,
        },
      },
      instructor: {
        id: course.instructor.id,
        name: course.instructor.name,
        avatar: course.instructor.avatar,
        bio: course.instructor.bio,
        coursesCount: course.instructor._count.courses,
      },
      lessons: course.lessons.map(l => ({
        id: l.id,
        title: {
          ar: l.titleAr,
          en: l.titleEn,
        },
        description: l.description,
        duration: l.duration,
        videoUrl: l.videoUrl,
        isFree: l.isFree,
        order: l.order,
        requireQuizPass: l.requireQuizPass,
      })),
      reviews: course.reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        user: r.user,
        createdAt: r.createdAt,
      })),
      stats: {
        studentsCount: course._count.enrollments,
        lessonsCount: course._count.lessons,
        reviewsCount: course._count.reviews,
        rating: Math.round(avgRating * 10) / 10,
      },
    };

    return NextResponse.json({
      success: true,
      data: formattedCourse,
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT - تحديث كورس
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    if (data.titleAr) updateData.titleAr = data.titleAr;
    if (data.titleEn) updateData.titleEn = data.titleEn;
    if (data.descriptionAr) updateData.descriptionAr = data.descriptionAr;
    if (data.descriptionEn) updateData.descriptionEn = data.descriptionEn;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.previewVideo !== undefined) updateData.previewVideo = data.previewVideo;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
    if (data.level) updateData.level = data.level;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.categoryId) updateData.categoryId = data.categoryId;

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course updated successfully',
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE - حذف كورس
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
