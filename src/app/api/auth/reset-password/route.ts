import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { resetPasswordSchema, validateRequest, formatZodErrors } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق من صحة البيانات باستخدام Zod
    const validation = validateRequest(resetPasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // البحث عن التوكن
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'رابط إعادة التعيين غير صالح' },
        { status: 400 }
      );
    }

    // التحقق من انتهاء صلاحية التوكن
    if (resetToken.expiresAt < new Date()) {
      // حذف التوكن المنتهي
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية رابط إعادة التعيين' },
        { status: 400 }
      );
    }

    // التحقق من أن التوكن لم يُستخدم
    if (resetToken.used) {
      return NextResponse.json(
        { success: false, error: 'تم استخدام هذا الرابط مسبقاً' },
        { status: 400 }
      );
    }

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(password, 12);

    // تحديث كلمة المرور وتعليم التوكن كمستخدم
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ، يرجى المحاولة لاحقاً' },
      { status: 500 }
    );
  }
}

// للتحقق من صلاحية التوكن
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

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, valid: false, error: 'رابط إعادة التعيين غير صالح' },
        { status: 400 }
      );
    }

    if (resetToken.expiresAt < new Date() || resetToken.used) {
      return NextResponse.json(
        { success: false, valid: false, error: 'انتهت صلاحية رابط إعادة التعيين' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ، يرجى المحاولة لاحقاً' },
      { status: 500 }
    );
  }
}
