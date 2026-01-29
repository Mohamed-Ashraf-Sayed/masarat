import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// GET - جلب المنتديات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const includeGeneral = searchParams.get('includeGeneral') === 'true';

    const where: { courseId?: string | null; isGeneral?: boolean } = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (includeGeneral) {
      // Get course forums and general forums
    }

    const forums = await prisma.forum.findMany({
      where: courseId
        ? {
            OR: [
              { courseId },
              { isGeneral: true },
            ],
          }
        : { isGeneral: true },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
        _count: {
          select: {
            threads: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: forums,
    });
  } catch (error) {
    console.error('Error fetching forums:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المنتديات' },
      { status: 500 }
    );
  }
}

// POST - إنشاء منتدى جديد (Admin only)
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بهذا الإجراء' },
        { status: 403 }
      );
    }

    const { titleAr, titleEn, descriptionAr, descriptionEn, courseId, isGeneral } =
      await request.json();

    if (!titleAr || !titleEn) {
      return NextResponse.json(
        { success: false, error: 'العنوان مطلوب بالعربية والإنجليزية' },
        { status: 400 }
      );
    }

    const forum = await prisma.forum.create({
      data: {
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        courseId,
        isGeneral: isGeneral || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: forum,
    });
  } catch (error) {
    console.error('Error creating forum:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء المنتدى' },
      { status: 500 }
    );
  }
}
