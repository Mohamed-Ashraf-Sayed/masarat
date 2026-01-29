import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from token
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

// GET - جلب جميع التسجيلات (للأدمن فقط) أو تسجيلات المستخدم
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // إذا طلب userId معين
    if (userId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
              thumbnail: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: enrollments.map((e) => ({
          id: e.id,
          courseId: e.courseId,
          course: {
            id: e.course.id,
            title: {
              ar: e.course.titleAr,
              en: e.course.titleEn,
            },
            thumbnail: e.course.thumbnail,
          },
          progress: e.progress,
          completed: e.status === 'COMPLETED',
          enrolledAt: e.enrolledAt,
          completedAt: e.completedAt,
        })),
      });
    }

    // للأدمن - جلب كل التسجيلات
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: enrollments.map((e) => ({
        id: e.id,
        user: e.user,
        course: {
          id: e.course.id,
          title: {
            ar: e.course.titleAr,
            en: e.course.titleEn,
          },
          thumbnail: e.course.thumbnail,
        },
        progress: e.progress,
        completed: e.status === 'COMPLETED',
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

// POST - تسجيل في كورس جديد
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // التحقق من وجود الكورس
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // التحقق من عدم التسجيل المسبق
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: tokenData.userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 409 }
      );
    }

    // إنشاء التسجيل
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: tokenData.userId,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: enrollment.id,
          courseId: enrollment.courseId,
          course: {
            id: enrollment.course.id,
            title: {
              ar: enrollment.course.titleAr,
              en: enrollment.course.titleEn,
            },
          },
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
        },
        message: 'Enrolled successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enroll' },
      { status: 500 }
    );
  }
}
