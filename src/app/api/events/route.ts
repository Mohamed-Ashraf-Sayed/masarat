import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const upcoming = searchParams.get('upcoming');

    const where: any = { status: 'PUBLISHED' };

    if (search) {
      where.OR = [
        { titleAr: { contains: search } },
        { titleEn: { contains: search } },
        { venue: { contains: search } },
      ];
    }

    if (upcoming === 'true') {
      where.startDate = { gte: new Date() };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true, avatar: true } },
        entity: { select: { id: true, nameAr: true, nameEn: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}
