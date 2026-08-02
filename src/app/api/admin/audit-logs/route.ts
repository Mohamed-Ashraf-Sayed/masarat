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

export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const entity = searchParams.get('entity') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entity: { contains: search } },
        { actor: { name: { contains: search } } },
        { actor: { email: { contains: search } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get unique actions and entities for filter dropdowns
    const [actions, entities] = await Promise.all([
      prisma.auditLog.findMany({ select: { action: true }, distinct: ['action'] }),
      prisma.auditLog.findMany({ select: { entity: true }, distinct: ['entity'], where: { entity: { not: null } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        page,
        pages: Math.ceil(total / limit),
        actions: actions.map(a => a.action),
        entities: entities.map(e => e.entity).filter(Boolean),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
