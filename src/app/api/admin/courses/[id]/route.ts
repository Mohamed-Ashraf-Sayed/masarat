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

// GET - جلب كورس معين
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: course });
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
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const data: Record<string, unknown> = {};
    const allowedFields = [
      'titleAr', 'titleEn', 'descriptionAr', 'descriptionEn',
      'thumbnail', 'previewVideo', 'price', 'originalPrice',
      'level', 'duration', 'categoryId', 'instructorId',
      'isPublished', 'isFeatured', 'enableWatermark',
      'learningOutcomesAr', 'learningOutcomesEn',
      'requirementsAr', 'requirementsEn',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث جزئي (مثل isPublished)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const data: Record<string, unknown> = {};
    const patchFields = [
      'isPublished', 'isFeatured', 'enableWatermark',
      'titleAr', 'titleEn', 'price', 'level',
    ];

    for (const field of patchFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: course });
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
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // حذف البيانات المرتبطة أولاً
    await prisma.lessonProgress.deleteMany({
      where: { lesson: { courseId: id } },
    });

    await prisma.lesson.deleteMany({
      where: { courseId: id },
    });

    await prisma.review.deleteMany({
      where: { courseId: id },
    });

    await prisma.certificate.deleteMany({
      where: { courseId: id },
    });

    await prisma.enrollment.deleteMany({
      where: { courseId: id },
    });

    // حذف الكورس
    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
