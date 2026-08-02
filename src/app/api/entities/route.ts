import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');

    const entities = await prisma.entity.findMany({
      where: {
        isActive: true,
        ...(unionId ? { unionId } : {}),
      },
      include: {
        union: { select: { id: true, nameAr: true, nameEn: true } },
        _count: { select: { initiatives: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: entities });
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch entities' }, { status: 500 });
  }
}
