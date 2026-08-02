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
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const participations = await prisma.competitionParticipant.findMany({
      where: { userId: tokenData.userId },
      include: {
        competition: {
          select: {
            id: true, titleAr: true, titleEn: true,
            image: true, startDate: true, endDate: true,
            status: true, mode: true,
          },
        },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: participations });
  } catch (error) {
    console.error('Error fetching user competitions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch competitions' }, { status: 500 });
  }
}
