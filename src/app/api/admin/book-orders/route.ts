import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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

// GET - جلب جميع طلبات الكتب
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { transactionId: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const [purchases, total] = await Promise.all([
      prisma.bookPurchase.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone: true,
            },
          },
          book: {
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
              price: true,
              cover: true,
              authorAr: true,
              authorEn: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bookPurchase.count({ where }),
    ]);

    const formattedPurchases = purchases.map((purchase) => ({
      id: purchase.id,
      amount: purchase.amount,
      currency: purchase.currency,
      status: purchase.status,
      paymentMethod: purchase.paymentMethod,
      transactionId: purchase.transactionId,
      receiptUrl: purchase.receiptUrl,
      downloadCount: purchase.downloadCount,
      createdAt: purchase.createdAt.toISOString(),
      user: purchase.user,
      book: purchase.book ? {
        id: purchase.book.id,
        title: {
          ar: purchase.book.titleAr,
          en: purchase.book.titleEn,
        },
        author: {
          ar: purchase.book.authorAr,
          en: purchase.book.authorEn,
        },
        price: purchase.book.price,
        cover: purchase.book.cover,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        purchases: formattedPurchases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching book orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch book orders' },
      { status: 500 }
    );
  }
}
