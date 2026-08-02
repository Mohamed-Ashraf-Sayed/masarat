import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true, teams: true } },
        teams: {
          select: { id: true, name: true, score: true, rank: true, leader: { select: { id: true, name: true } } },
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!competition) {
      return NextResponse.json({ success: false, error: 'Competition not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: competition });
  } catch (error) {
    console.error('Error fetching competition:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch competition' }, { status: 500 });
  }
}
