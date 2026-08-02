import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { loginSchema, validateRequest, formatZodErrors } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/security';
import {
  analyzeRequest,
  detectBot,
  checkBruteForce,
  resetBruteForce,
  logSecurityEvent,
  generateFingerprint,
} from '@/lib/advanced-security';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MAX_SESSIONS = 10;

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const fingerprint = generateFingerprint(request);

  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'auth/login');
    if (!rateLimit.allowed) {
      logSecurityEvent({
        eventType: 'rate_limit_exceeded',
        severity: 'warning',
        ip,
        endpoint: '/api/auth/login',
        method: 'POST',
        details: { resetAt: rateLimit.resetAt },
        fingerprint: fingerprint.hash,
      });
      return rateLimitResponse(rateLimit.resetAt);
    }

    // Bot detection
    const botResult = detectBot(request);
    if (botResult.isBot && botResult.confidence > 80) {
      logSecurityEvent({
        eventType: 'bot_detected',
        severity: 'warning',
        ip,
        endpoint: '/api/auth/login',
        method: 'POST',
        details: { reasons: botResult.reasons, confidence: botResult.confidence },
        fingerprint: fingerprint.hash,
      });
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // WAF Analysis
    const wafResult = analyzeRequest(JSON.stringify(body));
    if (wafResult.blocked) {
      logSecurityEvent({
        eventType: 'waf_block',
        severity: 'critical',
        ip,
        endpoint: '/api/auth/login',
        method: 'POST',
        details: { matchedRules: wafResult.matchedRules, threatScore: wafResult.threatScore },
        fingerprint: fingerprint.hash,
      });
      return NextResponse.json(
        { success: false, error: 'Request blocked' },
        { status: 403 }
      );
    }
    const { twoFactorCode } = body;

    // التحقق من البيانات باستخدام Zod
    const validation = validateRequest(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Brute force protection
    const bruteForceIdentifier = `${ip}:${email}`;
    const bruteForceResult = checkBruteForce(bruteForceIdentifier);
    if (!bruteForceResult.allowed) {
      logSecurityEvent({
        eventType: 'account_locked',
        severity: 'critical',
        ip,
        endpoint: '/api/auth/login',
        method: 'POST',
        details: {
          email,
          lockUntil: bruteForceResult.lockUntil,
          reason: 'Too many failed login attempts',
        },
        fingerprint: fingerprint.hash,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Account temporarily locked due to too many failed attempts. Please try again later.',
          lockUntil: bruteForceResult.lockUntil,
        },
        { status: 429 }
      );
    }

    // البحث عن المستخدم مع إعدادات 2FA
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        avatar: true,
        role: true,
        isActive: true,
        status: true,
        isDeleted: true,
        twoFactor: {
          select: {
            isEnabled: true,
            secret: true,
            backupCodes: true,
          },
        },
      },
    });

    if (!user) {
      // Record failed attempt
      checkBruteForce(bruteForceIdentifier);
      logSecurityEvent({
        eventType: 'authentication_failure',
        severity: 'warning',
        ip,
        endpoint: '/api/auth/login',
        method: 'POST',
        details: { email, reason: 'User not found' },
        fingerprint: fingerprint.hash,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Section 12: Immediate access revocation — block DELETED accounts
    if (user.isDeleted) {
      return NextResponse.json(
        { success: false, error: 'This account no longer exists' },
        { status: 403 }
      );
    }

    // Block SUSPENDED or inactive accounts
    if (!user.isActive || user.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, error: 'Account is suspended. Please contact support.' },
        { status: 403 }
      );
    }

    // التحقق من وجود كلمة مرور (حسابات OAuth لا تملك كلمة مرور)
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'This account uses social login. Please use OAuth to sign in.' },
        { status: 400 }
      );
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Record failed attempt
      checkBruteForce(bruteForceIdentifier);
      logSecurityEvent({
        eventType: 'authentication_failure',
        severity: 'warning',
        ip,
        userId: user.id,
        endpoint: '/api/auth/login',
        method: 'POST',
        details: { email, reason: 'Invalid password' },
        fingerprint: fingerprint.hash,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // التحقق من 2FA إذا كان مفعلاً
    if (user.twoFactor?.isEnabled) {
      // إذا لم يتم إرسال كود 2FA، اطلبه
      if (!twoFactorCode) {
        return NextResponse.json({
          success: false,
          requires2FA: true,
          error: 'Two-factor authentication code required',
        });
      }

      // التحقق من كود TOTP
      const isValidCode = authenticator.verify({
        token: twoFactorCode,
        secret: user.twoFactor.secret,
      });

      // إذا لم يكن الكود صحيحاً، تحقق من الـ backup codes
      if (!isValidCode) {
        const backupCodes: string[] = JSON.parse(user.twoFactor.backupCodes || '[]');
        let usedBackupCodeIndex = -1;

        for (let i = 0; i < backupCodes.length; i++) {
          const isMatch = await bcrypt.compare(twoFactorCode, backupCodes[i]);
          if (isMatch) {
            usedBackupCodeIndex = i;
            break;
          }
        }

        if (usedBackupCodeIndex === -1) {
          // Record failed 2FA attempt
          checkBruteForce(bruteForceIdentifier);
          logSecurityEvent({
            eventType: 'authentication_failure',
            severity: 'warning',
            ip,
            userId: user.id,
            endpoint: '/api/auth/login',
            method: 'POST',
            details: { email, reason: 'Invalid 2FA code' },
            fingerprint: fingerprint.hash,
          });
          return NextResponse.json(
            { success: false, error: 'Invalid two-factor authentication code' },
            { status: 401 }
          );
        }

        // حذف الـ backup code المستخدم
        backupCodes.splice(usedBackupCodeIndex, 1);
        await prisma.twoFactorSecret.update({
          where: { userId: user.id },
          data: { backupCodes: JSON.stringify(backupCodes) },
        });
      }
    }

    // Reset brute force counter on successful login
    resetBruteForce(bruteForceIdentifier);
    resetBruteForce(ip);

    // إنشاء التوكن
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // الحصول على معلومات العميل
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0].trim() || realIP || 'unknown';

    // إنشاء جلسة جديدة
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // التحقق من عدد الجلسات وحذف الأقدم إذا تجاوز الحد
    const sessionCount = await prisma.session.count({
      where: { userId: user.id },
    });

    if (sessionCount >= MAX_SESSIONS) {
      const oldestSession = await prisma.session.findFirst({
        where: { userId: user.id },
        orderBy: { lastActive: 'asc' },
      });

      if (oldestSession) {
        await prisma.session.delete({
          where: { id: oldestSession.id },
        });
      }
    }

    // إنشاء الجلسة
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
        userAgent,
        ipAddress,
      },
    });

    // إرجاع بيانات المستخدم (بدون كلمة المرور و 2FA secret)
    const { password: _, twoFactor: __, ...userData } = user;

    const response = NextResponse.json({
      success: true,
      data: {
        user: userData,
        token,
      },
      message: 'Login successful',
    });

    // تخزين التوكن في الكوكيز
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
    });

    // تخزين توكن الجلسة
    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
