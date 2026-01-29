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

// GET - Get user's purchased books
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const purchases = await prisma.bookPurchase.findMany({
      where: { userId: tokenData.userId },
      include: {
        book: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            authorAr: true,
            authorEn: true,
            cover: true,
            pages: true,
            fileUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedPurchases = purchases.map((purchase) => ({
      id: purchase.id,
      status: purchase.status,
      amount: purchase.amount,
      currency: purchase.currency,
      downloadCount: purchase.downloadCount,
      purchasedAt: purchase.createdAt.toISOString(),
      book: {
        id: purchase.book.id,
        title: { ar: purchase.book.titleAr, en: purchase.book.titleEn },
        author: { ar: purchase.book.authorAr, en: purchase.book.authorEn },
        cover: purchase.book.cover,
        pages: purchase.book.pages,
        hasFile: !!purchase.book.fileUrl,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedPurchases,
    });
  } catch (error) {
    console.error('Error fetching purchased books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchased books' },
      { status: 500 }
    );
  }
}
