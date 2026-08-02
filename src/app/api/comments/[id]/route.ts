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

// PUT - تحديث تعليق
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Only owner or admin can edit
    if (comment.userId !== tokenData.userId && !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to edit this comment' },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE - حذف تعليق
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Only owner or admin can delete
    if (comment.userId !== tokenData.userId && !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this comment' },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
