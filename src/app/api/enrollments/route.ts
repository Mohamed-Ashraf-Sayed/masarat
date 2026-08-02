import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { notifyEnrollment, notifyInstructorNewStudent } from '@/lib/notifications';
import { courseNotAvailable, alreadyEnrolled, paymentRequired, notFound, unauthorized, internalError } from '@/lib/errors';

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
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
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
// Section 14.4: Enrollment Rules — course must be PUBLISHED, paid courses need verified payment
// Section 14.9: Concurrency — uses $transaction to prevent duplicate enrollments
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) return unauthorized();

    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ success: false, error: 'courseId is required' }, { status: 400 });
    }

    // ── Rule 1: Course must exist and be PUBLISHED ───────────────────────────
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, titleAr: true, titleEn: true, status: true, isPublished: true, price: true, instructorId: true },
    });

    if (!course) return notFound('Course');

    // Only PUBLISHED courses can be enrolled in
    if (course.status !== 'PUBLISHED' || !course.isPublished) {
      return courseNotAvailable(course.status);
    }

    // ── Rule 2: Paid courses require a verified COMPLETED payment ────────────
    if (course.price > 0) {
      const completedPayment = await prisma.payment.findFirst({
        where: {
          userId: tokenData.userId,
          courseId,
          status: 'COMPLETED',
        },
      });
      if (!completedPayment) {
        return paymentRequired();
      }
    }

    // ── Rule 3 + Concurrency: atomic enrollment creation via $transaction ────
    // Prevents race conditions / duplicate enrollments
    const enrollment = await prisma.$transaction(async (tx) => {
      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: tokenData.userId, courseId } },
      });
      if (existing) throw new Error('ALREADY_ENROLLED');

      return tx.enrollment.create({
        data: { userId: tokenData.userId, courseId, status: 'ACTIVE' },
        include: {
          course: { select: { id: true, titleAr: true, titleEn: true } },
        },
      });
    }).catch((err: Error) => {
      if (err.message === 'ALREADY_ENROLLED') return 'ALREADY_ENROLLED' as const;
      throw err;
    });

    if (enrollment === 'ALREADY_ENROLLED') return alreadyEnrolled();

    // ── Notifications (non-blocking) ─────────────────────────────────────────
    const enrolledUser = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { name: true },
    });
    notifyEnrollment(tokenData.userId, enrollment.course.titleEn);
    if (course.instructorId) {
      notifyInstructorNewStudent(course.instructorId, enrolledUser?.name ?? '', enrollment.course.titleEn);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: enrollment.id,
          courseId: enrollment.courseId,
          course: {
            id: enrollment.course.id,
            title: { ar: enrollment.course.titleAr, en: enrollment.course.titleEn },
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
    return internalError('Failed to enroll');
  }
}
