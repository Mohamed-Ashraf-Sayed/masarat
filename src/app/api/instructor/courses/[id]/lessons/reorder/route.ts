import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// PUT - إعادة ترتيب الدروس
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;

    // التحقق من ملكية الكورس
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.instructorId !== tokenData.userId && tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lessonIds } = body;

    if (!lessonIds || !Array.isArray(lessonIds)) {
      return NextResponse.json(
        { success: false, error: 'lessonIds array is required' },
        { status: 400 }
      );
    }

    // تحديث ترتيب كل درس
    for (let i = 0; i < lessonIds.length; i++) {
      await prisma.lesson.update({
        where: { id: lessonIds[i] },
        data: { order: i + 1 },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Lessons reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder lessons' },
      { status: 500 }
    );
  }
}
