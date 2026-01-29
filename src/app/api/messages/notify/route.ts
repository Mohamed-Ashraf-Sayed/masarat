import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { realtimeManager } from '@/lib/realtime';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// POST - Notify typing status
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { conversationId, isTyping } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Get other participants
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: tokenData.userId },
      },
      select: { userId: true },
    });

    const sender = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { id: true, name: true },
    });

    // Update typing status in realtime manager
    if (isTyping) {
      realtimeManager.setTyping(conversationId, tokenData.userId, sender?.name || 'Someone');
    } else {
      realtimeManager.clearTyping(conversationId, tokenData.userId);
    }

    // Notify all participants via SSE
    participants.forEach((p) => {
      realtimeManager.notify(p.userId, {
        type: 'typing',
        conversationId,
        userId: tokenData.userId,
        userName: sender?.name,
        isTyping,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error notifying typing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to notify' },
      { status: 500 }
    );
  }
}
