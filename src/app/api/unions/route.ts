import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const unions = await prisma.union.findMany({
      where: { isActive: true },
      include: {
        entities: {
          where: { isActive: true },
          include: {
            initiatives: {
              where: { status: 'ACTIVE' },
              select: { id: true, titleAr: true, titleEn: true, status: true, startDate: true, endDate: true },
            },
            _count: { select: { initiatives: true } },
          },
        },
        _count: { select: { entities: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: unions });
  } catch (error) {
    console.error('Error fetching unions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch unions' }, { status: 500 });
  }
}
