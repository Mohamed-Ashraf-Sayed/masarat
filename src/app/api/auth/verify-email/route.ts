import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - تأكيد الإيميل باستخدام التوكن
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'التوكن مطلوب' },
        { status: 400 }
      );
    }

    // البحث عن التوكن
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'رابط التأكيد غير صالح' },
        { status: 400 }
      );
    }

    // التحقق من انتهاء الصلاحية
    if (verificationToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية رابط التأكيد' },
        { status: 400 }
      );
    }

    // التحقق من أن التوكن لم يُستخدم
    if (verificationToken.used) {
      return NextResponse.json(
        { success: false, error: 'تم استخدام هذا الرابط مسبقاً' },
        { status: 400 }
      );
    }

    // تحديث المستخدم وتعليم التوكن كمستخدم
    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.email },
        data: { emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { used: true },
      }),
    ]);

    // إعادة التوجيه لصفحة النجاح
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/login?verified=true`);
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ، يرجى المحاولة لاحقاً' },
      { status: 500 }
    );
  }
}
