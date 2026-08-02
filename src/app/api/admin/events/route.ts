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
    const status = searchParams.get('status');

    const events = await prisma.event.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        entity: { select: { id: true, nameAr: true, nameEn: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const {
      titleAr, titleEn, descriptionAr, descriptionEn,
      image, venue, startDate, endDate, capacity, price,
      entityId, refundPolicy,
    } = await request.json();

    if (!titleAr || !titleEn || !descriptionAr || !descriptionEn || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'All required fields must be provided' }, { status: 400 });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ success: false, error: 'Start date must be before end date' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        titleAr, titleEn, descriptionAr, descriptionEn,
        image: image || null,
        venue: venue || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity: capacity || 0,
        price: price || 0,
        organizerId: tokenData.userId,
        entityId: entityId || null,
        refundPolicy: refundPolicy || null,
      },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 500 });
  }
}
