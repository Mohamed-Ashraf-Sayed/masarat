import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { notifyAccountSuspended, notifyAccountReactivated } from '@/lib/notifications';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; email: string; role: string };
  } catch { return null; }
}

// GET - جلب جميع المستخدمين (ADMIN + SUPER_ADMIN)
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    const includeDeleted = searchParams.get('includeDeleted') === 'true';
    const where: any = {};
    // Exclude soft-deleted users by default
    if (!includeDeleted) where.isDeleted = false;
    if (role && role !== 'all') where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, avatar: true,
          role: true, isActive: true, status: true, isDeleted: true, createdAt: true,
          _count: { select: { enrollments: true, courses: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({ ...u, enrollmentsCount: u._count.enrollments, coursesCount: u._count.courses })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - إنشاء مستخدم (ADMIN يمكنه إنشاء STUDENT/INSTRUCTOR, SUPER_ADMIN يمكنه إنشاء أي role)
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email and password are required' }, { status: 400 });
    }

    // ADMIN لا يستطيع إنشاء مستخدم بصلاحيات أعلى منه
    const adminOnlyRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (role && adminOnlyRoles.includes(role) && tokenData.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN users' },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'STUDENT' },
      select: { id: true, name: true, email: true, avatar: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: user, message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT - تحديث مستخدم
// - ADMIN: يمكنه تعديل name/email/isActive للمستخدمين العاديين فقط
// - SUPER_ADMIN: يمكنه تعديل كل شيء بما في ذلك role لأي مستخدم
export async function PUT(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, email, role, isActive, password } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // التحقق من المستخدم المراد تعديله
    const targetUser = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // ADMIN لا يمكنه تعديل ADMIN أو SUPER_ADMIN آخر
    if (tokenData.role === 'ADMIN' && ['ADMIN', 'SUPER_ADMIN'].includes(targetUser.role)) {
      return NextResponse.json(
        { success: false, error: 'ADMIN cannot modify another admin account' },
        { status: 403 }
      );
    }

    // تغيير الـ role يتطلب SUPER_ADMIN فقط
    if (role && role !== targetUser.role && tokenData.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only SUPER_ADMIN can change user roles' },
        { status: 403 }
      );
    }

    // ADMIN لا يمكنه ترقية مستخدم إلى ADMIN أو SUPER_ADMIN
    if (role && ['ADMIN', 'SUPER_ADMIN'].includes(role) && tokenData.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only SUPER_ADMIN can assign admin roles' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    // USER WORKFLOW: sync isActive + UserStatus together
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      updateData.status = isActive ? 'ACTIVE' : 'SUSPENDED';
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, avatar: true,
        role: true, isActive: true, status: true, createdAt: true,
      },
    });

    // Notify user on account status change
    if (isActive !== undefined) {
      if (isActive) {
        notifyAccountReactivated(id);
      } else {
        notifyAccountSuspended(id);
      }
    }

    return NextResponse.json({ success: true, data: user, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - حذف ناعم للمستخدم (SUPER_ADMIN فقط)
// USER WORKFLOW: Active/Suspended → Soft Deleted
// يتم تعيين isDeleted=true بدلاً من الحذف الفعلي لحفظ البيانات والسجلات
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete يتطلب SUPER_ADMIN فقط
    if (tokenData.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only SUPER_ADMIN can delete users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true'; // hard=true for permanent delete

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    if (id === tokenData.userId) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 });
    }

    if (hard) {
      // Hard delete — permanent, irreversible
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'User permanently deleted' });
    }

    // Soft delete — USER WORKFLOW: → DELETED
    await prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'User soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
