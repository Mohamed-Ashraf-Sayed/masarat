import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - جلب جميع الكورسات من قاعدة البيانات مع بحث متقدم
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // بحث متقدم - فلاتر جديدة
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const sortBy = searchParams.get('sortBy') || 'newest'; // newest, popular, price-low, price-high, rating
    const instructorId = searchParams.get('instructor');

    const where: Prisma.CourseWhereInput = {
      isPublished: true,
      status: 'PUBLISHED',
    };

    if (category && category !== 'all') {
      where.categoryId = category;
    }

    if (level && level !== 'all') {
      where.level = level.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { titleAr: { contains: search } },
        { titleEn: { contains: search } },
        { descriptionAr: { contains: search } },
        { descriptionEn: { contains: search } },
      ];
    }

    // فلتر السعر
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // فلتر المدرب
    if (instructorId) {
      where.instructorId = instructorId;
    }

    // ترتيب النتائج
    let orderBy: Prisma.CourseOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sortBy) {
      case 'popular':
        orderBy = { enrollments: { _count: 'desc' } };
        break;
      case 'price-low':
        orderBy = { price: 'asc' };
        break;
      case 'price-high':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        // سيتم الترتيب بعد جلب البيانات
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // جلب الكورسات مع التقييمات في query واحد (إصلاح N+1)
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          category: true,
          instructor: {
            select: {
              id: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
          lessons: {
            orderBy: { order: 'asc' },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true,
              reviews: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.course.count({ where }),
    ]);

    // تحويل البيانات للشكل المطلوب (بدون N+1 - التقييم محسوب من البيانات المجلوبة)
    let coursesWithDetails = courses.map((course) => {
      // حساب متوسط التقييم من البيانات المجلوبة
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0;

      return {
        id: course.id,
        title: {
          ar: course.titleAr,
          en: course.titleEn,
        },
        description: {
          ar: course.descriptionAr,
          en: course.descriptionEn,
        },
        instructor: {
          id: course.instructor.id,
          name: course.instructor.name,
          avatar: course.instructor.avatar,
          bio: {
            ar: course.instructor.bio || '',
            en: course.instructor.bio || '',
          },
        },
        thumbnail: course.thumbnail,
        price: course.price,
        originalPrice: course.originalPrice,
        category: course.categoryId,
        level: course.level.toLowerCase(),
        duration: course.duration,
        lessonsCount: course._count.lessons,
        studentsCount: course._count.enrollments,
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: course._count.reviews,
        isFeatured: course.isFeatured,
        isNew: new Date(course.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lessons: course.lessons.map((lesson) => ({
          id: lesson.id,
          title: {
            ar: lesson.titleAr,
            en: lesson.titleEn,
          },
          duration: lesson.duration,
          videoUrl: lesson.videoUrl,
          isFree: lesson.isFree,
          order: lesson.order,
        })),
      };
    });

    // فلتر التقييم (بعد الجلب لأنه محسوب)
    if (minRating) {
      const minRatingValue = parseFloat(minRating);
      coursesWithDetails = coursesWithDetails.filter(c => c.rating >= minRatingValue);
    }

    // ترتيب حسب التقييم إذا مطلوب
    if (sortBy === 'rating') {
      coursesWithDetails.sort((a, b) => b.rating - a.rating);
    }

    return NextResponse.json({
      success: true,
      data: coursesWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        category,
        level,
        search,
        minPrice,
        maxPrice,
        minRating,
        sortBy,
        instructorId,
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST - إضافة كورس جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      thumbnail,
      price,
      originalPrice,
      level,
      duration,
      categoryId,
      instructorId,
    } = body;

    if (!titleAr || !titleEn || !categoryId || !instructorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        titleAr,
        titleEn,
        descriptionAr: descriptionAr || '',
        descriptionEn: descriptionEn || '',
        thumbnail,
        price: price || 0,
        originalPrice,
        level: level?.toUpperCase() || 'BEGINNER',
        duration: duration || 0,
        categoryId,
        instructorId,
        isPublished: true,
      },
      include: {
        category: true,
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: course,
        message: 'Course created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
