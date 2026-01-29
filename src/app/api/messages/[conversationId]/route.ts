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

// GET - جلب رسائل محادثة معينة
export async function GET(
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

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

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        select: {
          id: true,
          content: true,
          senderId: true,
          isRead: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    // Mark messages as read
    await prisma.conversationParticipant.update({
      where: {
        userId_conversationId: {
          userId: tokenData.userId,
          conversationId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(), // Oldest first
        conversation: {
          id: conversation?.id,
          participants: conversation?.participants
            .filter((p) => p.userId !== tokenData.userId)
            .map((p) => p.user),
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الرسائل' },
      { status: 500 }
    );
  }
}

// POST - إرسال رسالة في محادثة موجودة
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

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'محتوى الرسالة مطلوب' },
        { status: 400 }
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
        { success: false, error: 'غير مصرح لك بالكتابة في هذه المحادثة' },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: tokenData.userId,
        conversationId,
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        isRead: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Update sender's last read
    await prisma.conversationParticipant.update({
      where: {
        userId_conversationId: {
          userId: tokenData.userId,
          conversationId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    // Create notification for other participants
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: tokenData.userId },
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { name: true },
    });

    for (const p of otherParticipants) {
      await prisma.notification.create({
        data: {
          userId: p.userId,
          titleAr: 'رسالة جديدة',
          titleEn: 'New Message',
          messageAr: `لديك رسالة جديدة من ${sender?.name}`,
          messageEn: `You have a new message from ${sender?.name}`,
          type: 'message',
        },
      });

      // Send real-time notification
      realtimeManager.notify(p.userId, {
        type: 'new_message',
        conversationId,
        message,
      });
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إرسال الرسالة' },
      { status: 500 }
    );
  }
}

// DELETE - حذف محادثة
export async function DELETE(
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
        { success: false, error: 'غير مصرح لك بحذف هذه المحادثة' },
        { status: 403 }
      );
    }

    // Remove user from conversation
    await prisma.conversationParticipant.delete({
      where: {
        userId_conversationId: {
          userId: tokenData.userId,
          conversationId,
        },
      },
    });

    // Check if conversation is empty
    const remainingParticipants = await prisma.conversationParticipant.count({
      where: { conversationId },
    });

    if (remainingParticipants === 0) {
      // Delete conversation and messages
      await prisma.conversation.delete({
        where: { id: conversationId },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف المحادثة',
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المحادثة' },
      { status: 500 }
    );
  }
}
