import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

function getClientInfo(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ipAddress = forwarded?.split(',')[0].trim() || realIP || 'unknown';

  return { userAgent, ipAddress };
}

// GET - جلب جلسات المستخدم
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessions = await prisma.session.findMany({
      where: { userId: tokenData.userId },
      orderBy: { lastActive: 'desc' },
    });

    // Get current session token
    const currentToken = request.cookies.get('sessionToken')?.value;

    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      expires: session.expires,
      isCurrent: session.sessionToken === currentToken,
      device: parseUserAgent(session.userAgent || ''),
    }));

    return NextResponse.json({
      success: true,
      data: formattedSessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الجلسات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء جلسة جديدة
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userAgent, ipAddress } = getClientInfo(request);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Check session limit
    const sessionCount = await prisma.session.count({
      where: { userId: tokenData.userId },
    });

    const MAX_SESSIONS = 10;
    if (sessionCount >= MAX_SESSIONS) {
      // Remove oldest session
      const oldestSession = await prisma.session.findFirst({
        where: { userId: tokenData.userId },
        orderBy: { lastActive: 'asc' },
      });

      if (oldestSession) {
        await prisma.session.delete({
          where: { id: oldestSession.id },
        });
      }
    }

    const session = await prisma.session.create({
      data: {
        sessionToken,
        userId: tokenData.userId,
        expires,
        userAgent,
        ipAddress,
      },
    });

    // Notify about new login
    await prisma.notification.create({
      data: {
        userId: tokenData.userId,
        titleAr: 'تسجيل دخول جديد',
        titleEn: 'New Login',
        messageAr: `تم تسجيل الدخول من ${parseUserAgent(userAgent).device}`,
        messageEn: `New login from ${parseUserAgent(userAgent).device}`,
        type: 'security',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: tokenData.userId,
        action: 'LOGIN',
        entity: 'Session',
        entityId: session.id,
        ipAddress,
        userAgent,
      },
    });

    const response = NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        expires,
      },
    });

    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
    });

    return response;
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الجلسة' },
      { status: 500 }
    );
  }
}

// DELETE - إنهاء جلسة
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
    const sessionId = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    if (all) {
      // End all sessions except current
      const currentToken = request.cookies.get('sessionToken')?.value;

      await prisma.session.deleteMany({
        where: {
          userId: tokenData.userId,
          sessionToken: { not: currentToken },
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: tokenData.userId,
          action: 'LOGOUT_ALL',
          entity: 'Session',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم إنهاء جميع الجلسات الأخرى',
      });
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'معرف الجلسة مطلوب' },
        { status: 400 }
      );
    }

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: tokenData.userId,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'الجلسة غير موجودة' },
        { status: 404 }
      );
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: tokenData.userId,
        action: 'LOGOUT',
        entity: 'Session',
        entityId: sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنهاء الجلسة',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنهاء الجلسة' },
      { status: 500 }
    );
  }
}

// Helper function to parse user agent
function parseUserAgent(ua: string) {
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Unknown Device';

  // Browser detection
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Device type
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    device = 'Mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }

  return {
    browser,
    os,
    device: `${browser} on ${os}`,
    deviceType: device,
  };
}
