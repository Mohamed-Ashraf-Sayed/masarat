import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - جلب تسجيلات المستخدم وشهاداته
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // جلب التسجيلات
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
    });

    // جلب الشهادات
    const certificates = await prisma.certificate.findMany({
      where: { userId },
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

    return NextResponse.json({
      success: true,
      data: {
        enrollments: enrollments.map((e) => ({
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
        certificates: certificates.map((c) => ({
          id: c.id,
          courseId: c.courseId,
          course: {
            id: c.course.id,
            title: {
              ar: c.course.titleAr,
              en: c.course.titleEn,
            },
          },
          certificateId: c.certificateId,
          issuedAt: c.issuedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
