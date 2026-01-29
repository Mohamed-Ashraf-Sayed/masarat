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

// POST - Purchase a book
export async function POST(
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
    const body = await request.json();
    const { paymentMethod } = body;

    // Get book
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    if (!book.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Book not available' },
        { status: 400 }
      );
    }

    // Check if already purchased
    const existingPurchase = await prisma.bookPurchase.findUnique({
      where: {
        userId_bookId: {
          userId: tokenData.userId,
          bookId,
        },
      },
    });

    if (existingPurchase) {
      if (existingPurchase.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Already purchased this book' },
          { status: 400 }
        );
      }
      // If pending, return existing purchase
      return NextResponse.json({
        success: true,
        data: {
          purchaseId: existingPurchase.id,
          status: existingPurchase.status,
          requiresApproval: true,
        },
      });
    }

    // Get payment settings
    const paymentSettingsRecord = await prisma.siteSetting.findUnique({
      where: { key: 'payment_settings' },
    });
    const paymentSettings = paymentSettingsRecord?.value
      ? JSON.parse(paymentSettingsRecord.value) as Record<string, unknown>
      : null;
    const currency = (paymentSettings?.currency as string) || 'USD';
    const requireManualApproval = paymentSettings?.requireManualApproval ?? true;

    // Determine payment status
    const isBankTransfer = paymentMethod?.toUpperCase() === 'BANK';
    const needsApproval = isBankTransfer || requireManualApproval;
    const paymentStatus = needsApproval ? 'PENDING' : 'COMPLETED';

    // Create purchase record
    const purchase = await prisma.bookPurchase.create({
      data: {
        userId: tokenData.userId,
        bookId,
        amount: book.price,
        currency,
        status: paymentStatus,
        paymentMethod: paymentMethod?.toUpperCase() || 'BANK',
        transactionId: `BOOK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
    });

    // If auto-approved, increment download count
    if (!needsApproval) {
      await prisma.book.update({
        where: { id: bookId },
        data: { downloads: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        purchaseId: purchase.id,
        transactionId: purchase.transactionId,
        amount: purchase.amount,
        currency: purchase.currency,
        status: purchase.status,
        requiresApproval: needsApproval,
      },
      message: needsApproval
        ? 'Order submitted. Waiting for approval.'
        : 'Purchase successful!',
    });
  } catch (error) {
    console.error('Error purchasing book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process purchase' },
      { status: 500 }
    );
  }
}
