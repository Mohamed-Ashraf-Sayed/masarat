import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const status = searchParams.get('status');

    const initiatives = await prisma.initiative.findMany({
      where: {
        ...(entityId ? { entityId } : {}),
        ...(status ? { status: status as any } : { status: 'ACTIVE' }),
      },
      include: {
        entity: { select: { id: true, nameAr: true, nameEn: true } },
        leader: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: initiatives });
  } catch (error) {
    console.error('Error fetching initiatives:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch initiatives' }, { status: 500 });
  }
}
