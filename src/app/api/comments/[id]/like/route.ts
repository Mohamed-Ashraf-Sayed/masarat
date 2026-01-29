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

// POST - إضافة أو إزالة إعجاب
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: tokenData.userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      // Remove like
      await prisma.commentLike.delete({
        where: { id: existingLike.id },
      });

      const likesCount = await prisma.commentLike.count({
        where: { commentId },
      });

      return NextResponse.json({
        success: true,
        liked: false,
        likesCount,
      });
    } else {
      // Add like
      await prisma.commentLike.create({
        data: {
          userId: tokenData.userId,
          commentId,
        },
      });

      const likesCount = await prisma.commentLike.count({
        where: { commentId },
      });

      return NextResponse.json({
        success: true,
        liked: true,
        likesCount,
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
