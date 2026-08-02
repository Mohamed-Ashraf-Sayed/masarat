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
 * GET /api/entity-owner/report
 * View Entity Reports — ENTITY_OWNER, ADMIN, SUPER_ADMIN
 *
 * Returns a summary report for all entities owned by the authenticated user:
 * - Entity info
 * - Number of initiatives (by status)
 * - Number of initiative leaders assigned
 */
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');

    // Build where clause based on role
    let entityWhere: Record<string, unknown> = {};

    if (tokenData.role === 'ENTITY_OWNER') {
      // ENTITY_OWNER can only see their own entities
      entityWhere.ownerId = tokenData.userId;
      if (entityId) entityWhere.id = entityId;
    } else {
      // ADMIN/SUPER_ADMIN can view any entity
      if (entityId) entityWhere.id = entityId;
    }

    const entities = await prisma.entity.findMany({
      where: entityWhere,
      include: {
        union: { select: { id: true, nameAr: true, nameEn: true } },
        initiatives: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            status: true,
            leaderId: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
        },
        _count: {
          select: { initiatives: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build report for each entity
    const report = entities.map((entity) => {
      const initiativesByStatus = entity.initiatives.reduce(
        (acc: Record<string, number>, initiative) => {
          const status = initiative.status || 'ACTIVE';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {}
      );

      const assignedLeaders = entity.initiatives.filter((i) => i.leaderId).length;

      return {
        entity: {
          id: entity.id,
          nameAr: entity.nameAr,
          nameEn: entity.nameEn,
          logo: entity.logo,
          union: entity.union,
        },
        summary: {
          totalInitiatives: entity._count.initiatives,
          initiativesByStatus,
          assignedLeaders,
        },
        initiatives: entity.initiatives,
      };
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching entity report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entity report' },
      { status: 500 }
    );
  }
}
