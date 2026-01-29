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

// GET - Get download link for purchased book
export async function GET(
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

    const { id: bookId } = await params;

    // Check if user has purchased this book
    const purchase = await prisma.bookPurchase.findUnique({
      where: {
        userId_bookId: {
          userId: tokenData.userId,
          bookId,
        },
      },
      include: {
        book: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            fileUrl: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'You have not purchased this book' },
        { status: 403 }
      );
    }

    if (purchase.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Purchase is pending approval' },
        { status: 403 }
      );
    }

    if (!purchase.book.fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Book file not available' },
        { status: 404 }
      );
    }

    // Update download count
    await prisma.bookPurchase.update({
      where: { id: purchase.id },
      data: { downloadCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: purchase.book.fileUrl,
        title: {
          ar: purchase.book.titleAr,
          en: purchase.book.titleEn,
        },
      },
    });
  } catch (error) {
    console.error('Error getting download link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get download link' },
      { status: 500 }
    );
  }
}
