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

// GET - جلب المحادثات
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: tokenData.userId,
          },
        },
      },
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Format conversations with unread count
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find(
          (p) => p.userId === tokenData.userId
        );

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: tokenData.userId },
            createdAt: participant?.lastReadAt
              ? { gt: participant.lastReadAt }
              : undefined,
          },
        });

        const otherParticipants = conv.participants.filter(
          (p) => p.userId !== tokenData.userId
        );

        return {
          id: conv.id,
          participants: otherParticipants.map((p) => p.user),
          lastMessage: conv.messages[0] || null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المحادثات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء محادثة جديدة أو إرسال رسالة
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { recipientId, content, conversationId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'محتوى الرسالة مطلوب' },
        { status: 400 }
      );
    }

    let conversation;

    if (conversationId) {
      // Send message to existing conversation
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: {
            some: { userId: tokenData.userId },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { success: false, error: 'المحادثة غير موجودة' },
          { status: 404 }
        );
      }
    } else if (recipientId) {
      // Find or create conversation
      if (recipientId === tokenData.userId) {
        return NextResponse.json(
          { success: false, error: 'لا يمكنك مراسلة نفسك' },
          { status: 400 }
        );
      }

      // Check if conversation exists
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: tokenData.userId } } },
            { participants: { some: { userId: recipientId } } },
          ],
        },
      });

      if (existingConversation) {
        conversation = existingConversation;
      } else {
        // Verify recipient exists
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
        });

        if (!recipient) {
          return NextResponse.json(
            { success: false, error: 'المستلم غير موجود' },
            { status: 404 }
          );
        }

        // Create new conversation
        conversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId: tokenData.userId },
                { userId: recipientId },
              ],
            },
          },
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'معرف المستلم أو المحادثة مطلوب' },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: tokenData.userId,
        conversationId: conversation.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Update sender's last read
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: conversation.id,
        userId: tokenData.userId,
      },
      data: { lastReadAt: new Date() },
    });

    // Create notification for recipient
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId: conversation.id,
        userId: { not: tokenData.userId },
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { name: true },
    });

    for (const participant of participants) {
      await prisma.notification.create({
        data: {
          userId: participant.userId,
          titleAr: 'رسالة جديدة',
          titleEn: 'New Message',
          messageAr: `لديك رسالة جديدة من ${sender?.name}`,
          messageEn: `You have a new message from ${sender?.name}`,
          type: 'message',
        },
      });

      // Send real-time notification
      realtimeManager.notify(participant.userId, {
        type: 'new_message',
        conversationId: conversation.id,
        message: {
          ...message,
          senderId: message.sender.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message,
        conversationId: conversation.id,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إرسال الرسالة' },
      { status: 500 }
    );
  }
}
