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

    const competitions = await prisma.competition.findMany({
      include: { _count: { select: { participants: true, teams: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: competitions });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch competitions' }, { status: 500 });
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
      image, mode, maxTeamSize, startDate, endDate, prizes, rules, status,
    } = await request.json();

    if (!titleAr || !titleEn || !descriptionAr || !descriptionEn || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'All required fields must be provided' }, { status: 400 });
    }

    const competition = await prisma.competition.create({
      data: {
        titleAr, titleEn, descriptionAr, descriptionEn,
        image: image || null,
        mode: mode || 'INDIVIDUAL',
        maxTeamSize: maxTeamSize || 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        prizes: prizes || null,
        rules: rules || null,
        ...(status && { status }),
      },
    });

    return NextResponse.json({ success: true, data: competition }, { status: 201 });
  } catch (error) {
    console.error('Error creating competition:', error);
    return NextResponse.json({ success: false, error: 'Failed to create competition' }, { status: 500 });
  }
}
