import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, avatar: true } },
        entity: { select: { id: true, nameAr: true, nameEn: true } },
        _count: { select: { registrations: true } },
      },
    });

    if (!event || event.status !== 'PUBLISHED') {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch event' }, { status: 500 });
  }
}
