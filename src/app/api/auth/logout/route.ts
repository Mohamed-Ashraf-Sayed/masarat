import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - تسجيل الخروج
export async function POST(request: NextRequest) {
  // حذف الجلسة من قاعدة البيانات
  const sessionToken = request.cookies.get('sessionToken')?.value;

  if (sessionToken) {
    try {
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  // حذف التوكن من الكوكيز
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
  });

  // حذف توكن الجلسة من الكوكيز
  response.cookies.set('sessionToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
  });

  return response;
}
