import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { createAuditLog } from '@/lib/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

/**
 * Event Workflow (Section 6):
 * DRAFT → SUBMITTED → APPROVED → PUBLISHED → COMPLETED | CANCELLED
 *
 * Rules:
 * - Registration is open only in PUBLISHED status
 * - COMPLETED and CANCELLED are terminal states
 */
const ALLOWED_EVENT_TRANSITIONS: Record<string, string[]> = {
  DRAFT:     ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['APPROVED', 'DRAFT'],
  APPROVED:  ['PUBLISHED', 'DRAFT'],
  PUBLISHED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * PATCH /api/admin/events/[id]/status
 * Admin-only event status transitions with validation.
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
    const { status: newStatus } = await request.json();

    if (!newStatus) {
      return NextResponse.json({ success: false, error: 'status is required' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, titleAr: true, titleEn: true, status: true, organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    // ADMIN and SUPER_ADMIN can bypass transition rules for flexibility
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role);
    const allowed = ALLOWED_EVENT_TRANSITIONS[event.status] || [];
    if (!isAdmin && !allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid transition: ${event.status} → ${newStatus}`,
          allowedTransitions: allowed,
        },
        { status: 409 }
      );
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, titleAr: true, titleEn: true, status: true },
    });

    // Audit
    createAuditLog({
      userId: tokenData.userId,
      action: `EVENT_${newStatus}`,
      entity: 'Event',
      entityId: id,
      oldValue: { status: event.status },
      newValue: { status: newStatus },
    });

    // Notify organizer on key transitions
    if (event.organizerId && ['APPROVED', 'PUBLISHED', 'CANCELLED'].includes(newStatus)) {
      const msgs: Record<string, { ar: string; en: string }> = {
        APPROVED:  { ar: 'تمت الموافقة على فعاليتك', en: 'Your event has been approved' },
        PUBLISHED: { ar: 'تم نشر فعاليتك', en: 'Your event is now published' },
        CANCELLED: { ar: 'تم إلغاء فعاليتك', en: 'Your event has been cancelled' },
      };
      const msg = msgs[newStatus];
      await prisma.notification.create({
        data: {
          userId: event.organizerId,
          titleAr: msg.ar,
          titleEn: msg.en,
          messageAr: `الفعالية "${event.titleAr}" — ${msg.ar}`,
          messageEn: `Event "${event.titleEn}" — ${msg.en}`,
          type: 'EVENT_STATUS_CHANGE',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Event status updated: ${event.status} → ${newStatus}`,
    });
  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update event status' }, { status: 500 });
  }
}

/**
 * GET /api/admin/events/[id]/status
 * Returns current status and allowed transitions.
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
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, titleAr: true, titleEn: true, status: true },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        allowedTransitions: ALLOWED_EVENT_TRANSITIONS[event.status] || [],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch event status' }, { status: 500 });
  }
}

// Keep backward-compatible PUT (delegates to PATCH logic)
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PATCH(request, context);
}
