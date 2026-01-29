import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// التحقق من صلاحية الأدمن
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// GET - جلب جميع المدربين
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const instructors = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        isActive: true,
        createdAt: true,
        courses: {
          select: {
            id: true,
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // حساب الإحصائيات لكل مدرب
    const instructorsWithStats = await Promise.all(
      instructors.map(async (instructor) => {
        const totalStudents = instructor.courses.reduce(
          (sum, course) => sum + course._count.enrollments,
          0
        );

        // حساب متوسط التقييم
        const avgRating = await prisma.review.aggregate({
          where: {
            course: {
              instructorId: instructor.id,
            },
          },
          _avg: { rating: true },
        });

        return {
          id: instructor.id,
          name: instructor.name,
          email: instructor.email,
          avatar: instructor.avatar,
          bio: instructor.bio,
          isActive: instructor.isActive,
          createdAt: instructor.createdAt,
          coursesCount: instructor.courses.length,
          studentsCount: totalStudents,
          rating: avgRating._avg.rating || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: instructorsWithStats,
    });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}

// POST - إضافة مدرب جديد
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, password, bio, avatar } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    // التحقق من وجود البريد
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const instructor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'INSTRUCTOR',
        bio: bio || null,
        avatar: avatar || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        avatar: instructor.avatar,
        bio: instructor.bio,
      },
    });
  } catch (error) {
    console.error('Error creating instructor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create instructor' },
      { status: 500 }
    );
  }
}

// PUT - تحديث بيانات مدرب
export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, name, email, password, bio, avatar } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const instructor = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        avatar: instructor.avatar,
        bio: instructor.bio,
      },
    });
  } catch (error) {
    console.error('Error updating instructor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update instructor' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مدرب
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    // التحقق من وجود دورات للمدرب
    const coursesCount = await prisma.course.count({
      where: { instructorId: id },
    });

    if (coursesCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete instructor with existing courses. Please delete or reassign the courses first.'
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Instructor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting instructor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete instructor' },
      { status: 500 }
    );
  }
}
