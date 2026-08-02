import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { registerSchema, validateRequest, formatZodErrors } from '@/lib/validations';
import { sendEmail, getEmailVerificationTemplate } from '@/lib/email';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'auth/register');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const body = await request.json();

    // التحقق من البيانات باستخدام Zod
    const validation = validateRequest(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // Section 13: Terms of Service acceptance is mandatory
    if (!body.tosAccepted) {
      return NextResponse.json(
        { success: false, error: 'You must accept the Terms of Service to register' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        tosAcceptedAt: new Date(), // record ToS acceptance timestamp
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
      },
    });

    // إنشاء توكن تأكيد الإيميل
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        email,
        expiresAt,
      },
    });

    // إرسال إيميل التأكيد
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    const emailHtml = getEmailVerificationTemplate(verifyUrl, name);

    // إرسال الإيميل في الخلفية (لا ننتظره)
    sendEmail({
      to: email,
      subject: 'تأكيد البريد الإلكتروني - مسارات',
      html: emailHtml,
    }).catch(console.error);

    // إنشاء التوكن
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user,
          token,
        },
        message: 'تم التسجيل بنجاح! يرجى تأكيد بريدك الإلكتروني',
        emailVerificationRequired: true,
      },
      { status: 201 }
    );

    // تخزين التوكن في الكوكيز
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 أيام
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
