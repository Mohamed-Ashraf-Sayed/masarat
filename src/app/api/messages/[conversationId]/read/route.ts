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

// POST - Mark messages as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId: tokenData.userId,
          conversationId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بالوصول لهذه المحادثة' },
        { status: 403 }
      );
    }

    // Update last read timestamp for the participant
    await prisma.conversationParticipant.update({
      where: {
        userId_conversationId: {
          userId: tokenData.userId,
          conversationId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    // Mark all messages from other users as read
    const updatedMessages = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: tokenData.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // If messages were updated, notify the senders
    if (updatedMessages.count > 0) {
      // Get other participants to notify
      const otherParticipants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: tokenData.userId },
        },
        select: { userId: true },
      });

      // Notify senders that their messages were read
      otherParticipants.forEach((p) => {
        realtimeManager.notify(p.userId, {
          type: 'message_read',
          conversationId,
          readBy: tokenData.userId,
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة القراءة',
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث حالة القراءة' },
      { status: 500 }
    );
  }
}
