import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { InvoiceStatus } from '@prisma/client';
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

// GET - جلب الفواتير
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: { userId: string; status?: InvoiceStatus } = {
      userId: tokenData.userId,
    };

    if (status && Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      where.status = status as InvoiceStatus;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
              thumbnail: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    // Calculate totals
    const totals = await prisma.invoice.aggregate({
      where: { userId: tokenData.userId },
      _sum: {
        total: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        invoices,
        totals: {
          totalSpent: totals._sum.total || 0,
          invoiceCount: totals._count,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الفواتير' },
      { status: 500 }
    );
  }
}
