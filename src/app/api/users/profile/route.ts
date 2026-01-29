import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from token
function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

// GET - جلب الملف الشخصي
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        bio: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            certificates: true,
            courses: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        enrollmentsCount: user._count.enrollments,
        certificatesCount: user._count.certificates,
        coursesCount: user._count.courses,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - تحديث الملف الشخصي
export async function PUT(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, avatar, bio, phone, currentPassword, newPassword } = await request.json();

    // إذا كان المستخدم يريد تغيير كلمة المرور
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: tokenData.userId },
        select: { password: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      if (!user.password) {
        return NextResponse.json(
          { success: false, error: 'Cannot change password for OAuth accounts' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: tokenData.userId },
        data: { password: hashedPassword },
      });
    }

    // تحديث البيانات الأخرى
    const updateData: any = {};
    if (name) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await prisma.user.update({
      where: { id: tokenData.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        bio: true,
        phone: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
