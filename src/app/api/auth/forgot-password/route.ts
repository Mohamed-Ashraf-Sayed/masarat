import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail, getPasswordResetEmailTemplate } from '@/lib/email';
import { forgotPasswordSchema, validateRequest, formatZodErrors } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق من صحة البيانات باستخدام Zod
    const validation = validateRequest(forgotPasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // نرجع نفس الرسالة سواء وجد المستخدم أم لا (للأمان)
    const successMessage = 'إذا كان البريد الإلكتروني مسجلاً لدينا، ستصلك رسالة لإعادة تعيين كلمة المرور';

    if (!user) {
      // لا نكشف أن المستخدم غير موجود
      return NextResponse.json({
        success: true,
        message: successMessage,
      });
    }

    // حذف أي توكنات سابقة لنفس المستخدم
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // إنشاء توكن جديد
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

    // حفظ التوكن في قاعدة البيانات
    await prisma.passwordResetToken.create({
      data: {
        token,
        email,
        expiresAt,
      },
    });

    // إنشاء رابط إعادة التعيين
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // إرسال البريد الإلكتروني
    const emailHtml = getPasswordResetEmailTemplate(resetUrl, user.name);
    await sendEmail({
      to: email,
      subject: 'إعادة تعيين كلمة المرور - مسارات',
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ، يرجى المحاولة لاحقاً' },
      { status: 500 }
    );
  }
}
