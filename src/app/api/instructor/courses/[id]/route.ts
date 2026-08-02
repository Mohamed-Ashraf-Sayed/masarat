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

// GET - جلب تفاصيل كورس
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        _count: {
          select: {
            lessons: true,
            enrollments: true,
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

    // التحقق من ملكية الكورس
    if (course.instructorId !== tokenData.userId && !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
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
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // التحقق من وجود الكورس وملكيته
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (existingCourse.instructorId !== tokenData.userId && !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      price,
      originalPrice,
      level,
      categoryId,
      thumbnail,
      isPublished,
      isFeatured,
    } = body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        price,
        originalPrice,
        level,
        categoryId,
        thumbnail,
        isPublished,
        isFeatured: ['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role) ? isFeatured : existingCourse.isFeatured,
      },
    });

    return NextResponse.json({
      success: true,
      data: course,
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
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // التحقق من وجود الكورس وملكيته
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (existingCourse.instructorId !== tokenData.userId && !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // التحقق من عدم وجود طلاب مسجلين
    if (existingCourse._count.enrollments > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete course with enrolled students' },
        { status: 400 }
      );
    }

    // حذف الدروس أولاً
    await prisma.lesson.deleteMany({
      where: { courseId: id },
    });

    // حذف الكورس
    await prisma.course.delete({
      where: { id },
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
