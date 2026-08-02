import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

/**
 * POST /api/instructor/courses/[id]/submit
 * COURSE WORKFLOW: DRAFT → SUBMITTED
 *
 * Instructor submits their course for admin review.
 * Only allowed from DRAFT status.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, titleEn: true, titleAr: true, instructorId: true, status: true, _count: { select: { lessons: true } } },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Instructors can only submit their own courses
    if (tokenData.role === 'INSTRUCTOR' && course.instructorId !== tokenData.userId) {
      return NextResponse.json({ success: false, error: 'You can only submit your own courses' }, { status: 403 });
    }

    // Section 8 validation: course must have at least 1 lesson before submission
    if (course._count.lessons === 0) {
      return NextResponse.json(
        { success: false, error: 'Course must have at least one lesson before submission' },
        { status: 422 }
      );
    }

    // Transition validation: only DRAFT courses can be submitted
    if (course.status !== 'DRAFT') {
      const messages: Record<string, string> = {
        SUBMITTED: 'Course is already submitted and awaiting review',
        APPROVED:  'Course has already been approved',
        PUBLISHED: 'Course is already published',
        ARCHIVED:  'Archived courses cannot be re-submitted',
        SUSPENDED: 'Suspended courses cannot be submitted — contact admin',
      };
      return NextResponse.json(
        { success: false, error: messages[course.status] || 'Invalid status transition' },
        { status: 409 }
      );
    }

    const updated = await prisma.course.update({
      where: { id },
      data: { status: 'SUBMITTED' },
      select: { id: true, titleEn: true, titleAr: true, status: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Course submitted for review successfully',
    });
  } catch (error) {
    console.error('Error submitting course:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit course' }, { status: 500 });
  }
}
