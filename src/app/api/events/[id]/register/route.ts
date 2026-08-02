import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { createNotification } from '@/lib/notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.status !== 'PUBLISHED') {
      return NextResponse.json({ success: false, error: 'Event not available' }, { status: 404 });
    }

    if (event.capacity > 0 && event.registeredCount >= event.capacity) {
      return NextResponse.json({ success: false, error: 'Event is full' }, { status: 409 });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: tokenData.userId } },
    });
    if (existing && existing.status !== 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Already registered' }, { status: 409 });
    }

    let registration;
    if (existing && existing.status === 'CANCELLED') {
      [registration] = await prisma.$transaction([
        prisma.eventRegistration.update({
          where: { id: existing.id },
          data: { status: 'REGISTERED' },
        }),
        prisma.event.update({ where: { id }, data: { registeredCount: { increment: 1 } } }),
      ]);
    } else {
      [registration] = await prisma.$transaction([
        prisma.eventRegistration.create({
          data: { eventId: id, userId: tokenData.userId },
        }),
        prisma.event.update({ where: { id }, data: { registeredCount: { increment: 1 } } }),
      ]);
    }

    await createNotification({
      userId: tokenData.userId,
      titleAr: 'تم التسجيل في الفعالية',
      titleEn: 'Event Registration Confirmed',
      messageAr: `تم تسجيلك بنجاح في "${event.titleAr}"`,
      messageEn: `You have been successfully registered for "${event.titleEn}"`,
      type: 'enrollment',
    });

    return NextResponse.json({ success: true, data: registration }, { status: 201 });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json({ success: false, error: 'Failed to register' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: tokenData.userId } },
    });

    if (!registration || registration.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.eventRegistration.update({
        where: { id: registration.id },
        data: { status: 'CANCELLED' },
      }),
      prisma.event.update({ where: { id }, data: { registeredCount: { decrement: 1 } } }),
    ]);

    return NextResponse.json({ success: true, message: 'Registration cancelled' });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel registration' }, { status: 500 });
  }
}
