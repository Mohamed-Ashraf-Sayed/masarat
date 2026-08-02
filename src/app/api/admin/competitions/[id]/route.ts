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
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        teams: { include: { leader: { select: { id: true, name: true } } } },
      },
    });

    if (!competition) return NextResponse.json({ success: false, error: 'Competition not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: competition });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch competition' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const {
      titleAr, titleEn, descriptionAr, descriptionEn,
      image, mode, maxTeamSize, startDate, endDate, status, prizes, rules,
    } = await request.json();

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        titleAr, titleEn, descriptionAr, descriptionEn,
        image, mode, maxTeamSize,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status, prizes, rules,
      },
    });

    return NextResponse.json({ success: true, data: competition });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update competition' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.competition.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Competition deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete competition' }, { status: 500 });
  }
}
