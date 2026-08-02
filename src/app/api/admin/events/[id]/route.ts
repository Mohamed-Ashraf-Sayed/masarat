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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        entity: { select: { id: true, nameAr: true, nameEn: true } },
        registrations: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!event) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      titleAr, titleEn, descriptionAr, descriptionEn,
      image, venue, startDate, endDate, capacity, price,
      entityId, refundPolicy,
    } = body;

    // Section 8 validations
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ success: false, error: 'Start date must be before end date' }, { status: 400 });
    }
    if (capacity !== undefined && capacity < 0) {
      return NextResponse.json({ success: false, error: 'Capacity must be 0 (unlimited) or a positive number' }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        titleAr, titleEn, descriptionAr, descriptionEn,
        image, venue,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        capacity, price,
        entityId: entityId || null,
        refundPolicy,
      },
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 });
  }
}
