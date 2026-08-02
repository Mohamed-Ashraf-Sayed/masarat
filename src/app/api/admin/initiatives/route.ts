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

// GET - جلب المبادرات
// ADMIN/SUPER_ADMIN: جلب كل المبادرات أو فلترة حسب entity
// ENTITY_OWNER: جلب مبادرات جهاتهم فقط
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN', 'ENTITY_OWNER'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const status = searchParams.get('status');

    let whereClause: Record<string, unknown> = {};

    if (['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      // Admin يمكنه فلترة أو رؤية الكل
      if (entityId) whereClause.entityId = entityId;
    } else {
      // ENTITY_OWNER: مبادرات جهاته فقط
      const ownedEntities = await prisma.entity.findMany({
        where: { ownerId: tokenData.userId },
        select: { id: true },
      });
      const ownedEntityIds = ownedEntities.map((e) => e.id);

      if (entityId) {
        if (!ownedEntityIds.includes(entityId)) {
          return NextResponse.json({ success: false, error: 'Access denied to this entity' }, { status: 403 });
        }
        whereClause.entityId = entityId;
      } else {
        whereClause.entityId = { in: ownedEntityIds };
      }
    }

    if (status) whereClause.status = status;

    const initiatives = await prisma.initiative.findMany({
      where: whereClause,
      include: {
        entity: { select: { id: true, nameAr: true, nameEn: true } },
        leader: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: initiatives });
  } catch (error) {
    console.error('Error fetching initiatives:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch initiatives' }, { status: 500 });
  }
}

// POST - إنشاء مبادرة
// ADMIN/SUPER_ADMIN: يمكنهم إنشاء مبادرة لأي entity
// ENTITY_OWNER: يمكنهم إنشاء مبادرة لجهاتهم فقط (مع التحقق من الملكية)
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN', 'ENTITY_OWNER'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { titleAr, titleEn, descriptionAr, descriptionEn, entityId, leaderId, startDate, endDate } = await request.json();

    if (!titleAr || !titleEn || !descriptionAr || !descriptionEn || !entityId || !leaderId) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    // ENTITY_OWNER: التحقق من ملكية الجهة
    if (tokenData.role === 'ENTITY_OWNER') {
      const entity = await prisma.entity.findUnique({
        where: { id: entityId },
        select: { ownerId: true },
      });

      if (!entity) {
        return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 });
      }

      if (entity.ownerId !== tokenData.userId) {
        return NextResponse.json(
          { success: false, error: 'You can only create initiatives for your own entity' },
          { status: 403 }
        );
      }
    }

    const initiative = await prisma.initiative.create({
      data: {
        titleAr, titleEn, descriptionAr, descriptionEn, entityId, leaderId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        entity: { select: { id: true, nameAr: true, nameEn: true } },
        leader: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: initiative }, { status: 201 });
  } catch (error) {
    console.error('Error creating initiative:', error);
    return NextResponse.json({ success: false, error: 'Failed to create initiative' }, { status: 500 });
  }
}
