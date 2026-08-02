import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import {
  notifyCourseApproved,
  notifyCourseSuspended,
  notifyCourseSubmittedToAdmin,
  notifyCourseRejected,
} from '@/lib/notifications';
import {
  auditCourseApproved,
  auditCourseRejected,
  auditCoursePublished,
  auditCourseSuspended,
} from '@/lib/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

/**
 * Valid course status transitions
 *
 * COURSE WORKFLOW: Draft → Submitted → Approved → Published → Archived/Suspended
 *
 * from       → to (allowed)
 * ──────────────────────────────────────────────────────
 * SUBMITTED  → APPROVED   (admin approves)
 * SUBMITTED  → DRAFT      (admin rejects → back to draft)
 * APPROVED   → PUBLISHED  (admin publishes)
 * APPROVED   → DRAFT      (admin reverts before publishing)
 * PUBLISHED  → SUSPENDED  (admin suspends)
 * PUBLISHED  → ARCHIVED   (admin archives)
 * SUSPENDED  → PUBLISHED  (admin reinstates)
 * ARCHIVED   → PUBLISHED  (admin reactivates)
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT:     ['SUBMITTED', 'APPROVED', 'PUBLISHED'],
  SUBMITTED: ['APPROVED', 'PUBLISHED', 'DRAFT'],
  APPROVED:  ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['SUSPENDED', 'ARCHIVED', 'DRAFT'],
  SUSPENDED: ['PUBLISHED', 'DRAFT'],
  ARCHIVED:  ['PUBLISHED', 'DRAFT'],
};

/**
 * PATCH /api/admin/courses/[id]/status
 * Admin-only course status transitions with validation and notifications.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status: newStatus, reason } = await request.json();

    if (!newStatus) {
      return NextResponse.json({ success: false, error: 'status is required' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, titleEn: true, titleAr: true, status: true, instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const allowed = ALLOWED_TRANSITIONS[course.status] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid transition: ${course.status} → ${newStatus}`,
          allowedTransitions: allowed,
        },
        { status: 409 }
      );
    }

    // Sync isPublished with status
    const isPublished = newStatus === 'PUBLISHED';

    const updated = await prisma.course.update({
      where: { id },
      data: { status: newStatus, isPublished },
      select: { id: true, titleEn: true, titleAr: true, status: true, isPublished: true },
    });

    // ── Notifications + Audit ───────────────────────────────────────────────────
    const adminId = tokenData.userId;
    if (course.instructorId) {
      switch (newStatus) {
        case 'APPROVED':
          notifyCourseApproved(course.instructorId, course.titleEn);
          auditCourseApproved(adminId, course.id, course.status);
          break;
        case 'DRAFT':
          // Rejection: admin sent back to draft (with optional reason)
          notifyCourseRejected(course.instructorId, course.titleEn, reason);
          auditCourseRejected(adminId, course.id, reason);
          break;
        case 'PUBLISHED':
          auditCoursePublished(adminId, course.id);
          break;
        case 'SUSPENDED':
          notifyCourseSuspended(course.instructorId, course.titleEn);
          auditCourseSuspended(adminId, course.id);
          break;
        case 'ARCHIVED':
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Course status updated: ${course.status} → ${newStatus}`,
    });
  } catch (error) {
    console.error('Error updating course status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update course status' }, { status: 500 });
  }
}

/**
 * GET /api/admin/courses/[id]/status
 * Returns current status and available next transitions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, titleEn: true, titleAr: true, status: true, isPublished: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        allowedTransitions: ALLOWED_TRANSITIONS[course.status] || [],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch course status' }, { status: 500 });
  }
}
