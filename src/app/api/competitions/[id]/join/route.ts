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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { teamId } = body;

    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition || competition.status !== 'OPEN') {
      return NextResponse.json({ success: false, error: 'Competition is not open for registration' }, { status: 404 });
    }

    const existing = await prisma.competitionParticipant.findUnique({
      where: { competitionId_userId: { competitionId: id, userId: tokenData.userId } },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Already joined this competition' }, { status: 409 });
    }

    const participant = await prisma.competitionParticipant.create({
      data: {
        competitionId: id,
        userId: tokenData.userId,
        teamId: teamId || null,
      },
    });

    return NextResponse.json({ success: true, data: participant }, { status: 201 });
  } catch (error) {
    console.error('Error joining competition:', error);
    return NextResponse.json({ success: false, error: 'Failed to join competition' }, { status: 500 });
  }
}
