import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
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

// POST - إعداد 2FA
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if 2FA already exists
    const existing = await prisma.twoFactorSecret.findUnique({
      where: { userId: tokenData.userId },
    });

    if (existing?.isEnabled) {
      return NextResponse.json(
        { success: false, error: 'التحقق بخطوتين مفعل بالفعل' },
        { status: 400 }
      );
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    const appName = 'Masarat';
    const otpAuthUrl = authenticator.keyuri(tokenData.email, appName, secret);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpAuthUrl);

    // Generate backup codes
    const backupCodes: string[] = [];
    const hashedBackupCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
      hashedBackupCodes.push(await bcrypt.hash(code, 10));
    }

    // Save or update secret (not enabled yet)
    if (existing) {
      await prisma.twoFactorSecret.update({
        where: { userId: tokenData.userId },
        data: {
          secret,
          backupCodes: JSON.stringify(hashedBackupCodes),
          isEnabled: false,
        },
      });
    } else {
      await prisma.twoFactorSecret.create({
        data: {
          userId: tokenData.userId,
          secret,
          backupCodes: JSON.stringify(hashedBackupCodes),
          isEnabled: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        qrCode,
        secret,
        backupCodes,
      },
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إعداد التحقق بخطوتين' },
      { status: 500 }
    );
  }
}

// PUT - تفعيل 2FA بعد التحقق
export async function PUT(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'الرمز مطلوب' },
        { status: 400 }
      );
    }

    const twoFactor = await prisma.twoFactorSecret.findUnique({
      where: { userId: tokenData.userId },
    });

    if (!twoFactor) {
      return NextResponse.json(
        { success: false, error: 'يرجى إعداد التحقق بخطوتين أولاً' },
        { status: 400 }
      );
    }

    // Verify code
    const isValid = authenticator.verify({
      token: code,
      secret: twoFactor.secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'الرمز غير صحيح' },
        { status: 400 }
      );
    }

    // Enable 2FA
    await prisma.twoFactorSecret.update({
      where: { userId: tokenData.userId },
      data: { isEnabled: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: tokenData.userId,
        action: 'ENABLE_2FA',
        entity: 'User',
        entityId: tokenData.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل التحقق بخطوتين بنجاح',
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تفعيل التحقق بخطوتين' },
      { status: 500 }
    );
  }
}

// DELETE - إلغاء 2FA
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code, password } = await request.json();

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
    });

    if (!user?.password) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن إلغاء التحقق بخطوتين لحسابات OAuth' },
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور غير صحيحة' },
        { status: 400 }
      );
    }

    const twoFactor = await prisma.twoFactorSecret.findUnique({
      where: { userId: tokenData.userId },
    });

    if (!twoFactor?.isEnabled) {
      return NextResponse.json(
        { success: false, error: 'التحقق بخطوتين غير مفعل' },
        { status: 400 }
      );
    }

    // Verify 2FA code
    const isValid = authenticator.verify({
      token: code,
      secret: twoFactor.secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'رمز التحقق غير صحيح' },
        { status: 400 }
      );
    }

    // Delete 2FA
    await prisma.twoFactorSecret.delete({
      where: { userId: tokenData.userId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: tokenData.userId,
        action: 'DISABLE_2FA',
        entity: 'User',
        entityId: tokenData.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء التحقق بخطوتين',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إلغاء التحقق بخطوتين' },
      { status: 500 }
    );
  }
}

// GET - حالة 2FA
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const twoFactor = await prisma.twoFactorSecret.findUnique({
      where: { userId: tokenData.userId },
    });

    return NextResponse.json({
      success: true,
      data: {
        isEnabled: twoFactor?.isEnabled || false,
        backupCodesRemaining: twoFactor
          ? JSON.parse(twoFactor.backupCodes || '[]').length
          : 0,
      },
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب حالة التحقق بخطوتين' },
      { status: 500 }
    );
  }
}
