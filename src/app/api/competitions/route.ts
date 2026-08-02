import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const competitions = await prisma.competition.findMany({
      where: status
        ? { status: status as any }
        : { status: { in: ['OPEN', 'JUDGING', 'COMPLETED'] } },
      include: { _count: { select: { participants: true, teams: true } } },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ success: true, data: competitions });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch competitions' }, { status: 500 });
  }
}
