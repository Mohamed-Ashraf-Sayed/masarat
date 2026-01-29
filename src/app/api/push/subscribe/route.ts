import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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

// POST - الاشتراك في الإشعارات
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'بيانات الاشتراك غير صالحة' },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        userId: tokenData.userId,
        endpoint: subscription.endpoint,
      },
    });

    if (existing) {
      // Update existing subscription
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
    } else {
      // Create new subscription
      await prisma.pushSubscription.create({
        data: {
          userId: tokenData.userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل الإشعارات',
    });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تفعيل الإشعارات' },
      { status: 500 }
    );
  }
}

// DELETE - إلغاء الاشتراك
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      // Delete all subscriptions for user
      await prisma.pushSubscription.deleteMany({
        where: { userId: tokenData.userId },
      });
    } else {
      // Delete specific subscription
      await prisma.pushSubscription.deleteMany({
        where: {
          userId: tokenData.userId,
          endpoint,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء الإشعارات',
    });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إلغاء الإشعارات' },
      { status: 500 }
    );
  }
}

// GET - حالة الاشتراك
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscriptions = await prisma.pushSubscription.count({
      where: { userId: tokenData.userId },
    });

    return NextResponse.json({
      success: true,
      data: {
        isSubscribed: subscriptions > 0,
        subscriptionCount: subscriptions,
        vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      },
    });
  } catch (error) {
    console.error('Push status error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب حالة الإشعارات' },
      { status: 500 }
    );
  }
}
