import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from token
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

// GET - جلب الإشعارات
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const skip = (page - 1) * limit;

    // الأدمن يشوف كل الإشعارات، المستخدم العادي يشوف إشعاراته فقط
    const isAdmin = tokenData.role === 'ADMIN';

    const where = {
      ...(isAdmin ? {} : { userId: tokenData.userId }),
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const unreadWhere = {
      ...(isAdmin ? {} : { userId: tokenData.userId }),
      isRead: false,
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: unreadWhere }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PUT - تحديث حالة الإشعار (قراءة)
export async function PUT(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { notificationId, markAllAsRead } = await request.json();

    const isAdmin = tokenData.role === 'ADMIN';

    if (markAllAsRead) {
      // تحديد جميع الإشعارات كمقروءة
      await prisma.notification.updateMany({
        where: {
          ...(isAdmin ? {} : { userId: tokenData.userId }),
          isRead: false,
        },
        data: { isRead: true },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تحديد جميع الإشعارات كمقروءة',
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // التحقق من ملكية الإشعار (الأدمن يقدر يعدل أي إشعار)
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        ...(isAdmin ? {} : { userId: tokenData.userId }),
      },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديد الإشعار كمقروء',
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - حذف إشعار
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const isAdmin = tokenData.role === 'ADMIN';

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        ...(isAdmin ? {} : { userId: tokenData.userId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الإشعار',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
