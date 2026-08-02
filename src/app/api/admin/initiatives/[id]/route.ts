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

/** Verify that ENTITY_OWNER owns the entity that this initiative belongs to */
async function verifyEntityOwnership(initiativeId: string, userId: string): Promise<boolean> {
  const initiative = await prisma.initiative.findUnique({
    where: { id: initiativeId },
    include: { entity: { select: { ownerId: true } } },
  });
  return initiative?.entity?.ownerId === userId;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN', 'ENTITY_OWNER'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // ENTITY_OWNER: التحقق من الملكية
    if (tokenData.role === 'ENTITY_OWNER') {
      const isOwner = await verifyEntityOwnership(id, tokenData.userId);
      if (!isOwner) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
      }
    }

    const initiative = await prisma.initiative.findUnique({
      where: { id },
      include: {
        entity: { select: { id: true, nameAr: true, nameEn: true } },
        leader: { select: { id: true, name: true, email: true } },
      },
    });

    if (!initiative) return NextResponse.json({ success: false, error: 'Initiative not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: initiative });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch initiative' }, { status: 500 });
  }
}

// PUT - تحديث المبادرة
// ADMIN/SUPER_ADMIN: تحديث كامل بما فيه نقل الجهة
// ENTITY_OWNER: تحديث مبادراتهم فقط (بما فيه تعيين قائد) بدون تغيير الجهة
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN', 'ENTITY_OWNER'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // ENTITY_OWNER: التحقق من الملكية
    if (tokenData.role === 'ENTITY_OWNER') {
      const isOwner = await verifyEntityOwnership(id, tokenData.userId);
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'You can only edit your own entity initiatives' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { titleAr, titleEn, descriptionAr, descriptionEn, leaderId, status, startDate, endDate } = body;

    const updateData: Record<string, unknown> = {
      titleAr, titleEn, descriptionAr, descriptionEn, leaderId, status,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };

    // فقط الأدمن يمكنه تغيير entityId
    if (['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role) && body.entityId) {
      updateData.entityId = body.entityId;
    }

    const initiative = await prisma.initiative.update({
      where: { id },
      data: updateData,
      include: {
        entity: { select: { id: true, nameAr: true, nameEn: true } },
        leader: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: initiative });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update initiative' }, { status: 500 });
  }
}

// DELETE - حذف المبادرة (ADMIN/SUPER_ADMIN فقط)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Only admins can delete initiatives' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.initiative.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Initiative deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete initiative' }, { status: 500 });
  }
}
