import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail, getEmailVerificationTemplate } from '@/lib/email';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(request, 'auth/resend-verification');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    // نرجع نفس الرسالة سواء وجد المستخدم أم لا (للأمان)
    const successMessage = 'إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة التأكيد';

    if (!user) {
      return NextResponse.json({ success: true, message: successMessage });
    }

    // التحقق من أن الإيميل غير مؤكد
    if (user.emailVerified) {
      return NextResponse.json({
        success: false,
        error: 'البريد الإلكتروني مؤكد بالفعل',
      });
    }

    // حذف التوكنات السابقة
    await prisma.emailVerificationToken.deleteMany({
      where: { email },
    });

    // إنشاء توكن جديد
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

    await prisma.emailVerificationToken.create({
      data: {
        token,
        email,
        expiresAt,
      },
    });

    // إرسال الإيميل
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    const emailHtml = getEmailVerificationTemplate(verifyUrl, user.name);

    await sendEmail({
      to: email,
      subject: 'تأكيد البريد الإلكتروني - مسارات',
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ، يرجى المحاولة لاحقاً' },
      { status: 500 }
    );
  }
}
