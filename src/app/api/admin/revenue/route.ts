import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where = status ? { status: status as any } : {};

    const [transactions, summary] = await Promise.all([
      prisma.revenueTransaction.findMany({
        where,
        include: {
          instructor: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, titleAr: true, titleEn: true } },
          payment: { select: { id: true, amount: true, currency: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.revenueTransaction.groupBy({
        by: ['status'],
        _sum: { totalAmount: true },
      }),
    ]);

    // Build summary
    const summaryMap: Record<string, number> = { held: 0, available: 0, paid: 0, refunded: 0 };
    for (const s of summary) {
      summaryMap[s.status.toLowerCase()] = s._sum.totalAmount || 0;
    }
    summaryMap.total = Object.values(summaryMap).reduce((a, b) => a + b, 0);

    // Format transactions
    const formatted = transactions.map(tx => ({
      ...tx,
      course: {
        id: tx.course.id,
        title: { ar: tx.course.titleAr, en: tx.course.titleEn },
      },
    }));

    return NextResponse.json({ success: true, data: { transactions: formatted, summary: summaryMap } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch revenue' }, { status: 500 });
  }
}
