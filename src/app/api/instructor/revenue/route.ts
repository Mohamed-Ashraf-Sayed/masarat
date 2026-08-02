import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getInstructorRevenueSummary } from '@/lib/revenue';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

/**
 * GET /api/instructor/revenue
 * Returns revenue summary and transaction list for the authenticated instructor.
 */
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const instructorId = tokenData.role === 'INSTRUCTOR' ? tokenData.userId : (new URL(request.url).searchParams.get('instructorId') || tokenData.userId);

    const [summary, transactions] = await Promise.all([
      getInstructorRevenueSummary(instructorId),
      prisma.revenueTransaction.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          payment: { select: { id: true, amount: true, currency: true, createdAt: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { summary, transactions },
    });
  } catch (error) {
    console.error('Error fetching instructor revenue:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch revenue' }, { status: 500 });
  }
}
