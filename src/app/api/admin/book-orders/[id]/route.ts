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

// GET - جلب طلب كتاب واحد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const purchase = await prisma.bookPurchase.findUnique({
      where: { id },
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
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error('Error fetching book order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch book order' },
      { status: 500 }
    );
  }
}

// PUT - تحديث حالة طلب الكتاب (قبول/رفض)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, adminNote } = body;

    // Validate status
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get current purchase
    const currentPurchase = await prisma.bookPurchase.findUnique({
      where: { id },
      include: {
        user: true,
        book: true,
      },
    });

    if (!currentPurchase) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update purchase
    const updatedPurchase = await prisma.bookPurchase.update({
      where: { id },
      data: {
        ...(status && { status }),
      },
    });

    // If status changed to COMPLETED, notify user
    if (status === 'COMPLETED' && currentPurchase.status !== 'COMPLETED') {
      await prisma.notification.create({
        data: {
          userId: currentPurchase.userId,
          titleAr: 'تم قبول طلبك',
          titleEn: 'Your order has been approved',
          messageAr: `تم قبول طلبك لكتاب "${currentPurchase.book?.titleAr}" بنجاح. يمكنك الآن تحميل الكتاب.`,
          messageEn: `Your order for "${currentPurchase.book?.titleEn}" has been approved. You can now download the book.`,
          type: 'ORDER_APPROVED',
        },
      });
    }

    // If status changed to FAILED/REFUNDED, notify user
    if ((status === 'FAILED' || status === 'REFUNDED') && currentPurchase.status === 'PENDING') {
      await prisma.notification.create({
        data: {
          userId: currentPurchase.userId,
          titleAr: status === 'REFUNDED' ? 'تم استرداد المبلغ' : 'تم رفض الطلب',
          titleEn: status === 'REFUNDED' ? 'Payment refunded' : 'Order rejected',
          messageAr: status === 'REFUNDED'
            ? `تم استرداد مبلغ ${currentPurchase.amount} ${currentPurchase.currency} بنجاح.`
            : `عذراً، تم رفض طلبك لكتاب "${currentPurchase.book?.titleAr}". ${adminNote || ''}`,
          messageEn: status === 'REFUNDED'
            ? `${currentPurchase.amount} ${currentPurchase.currency} has been refunded successfully.`
            : `Sorry, your order for "${currentPurchase.book?.titleEn}" has been rejected. ${adminNote || ''}`,
          type: status === 'REFUNDED' ? 'ORDER_REFUNDED' : 'ORDER_REJECTED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedPurchase,
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('Error updating book order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update book order' },
      { status: 500 }
    );
  }
}

// DELETE - حذف طلب كتاب
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const purchase = await prisma.bookPurchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    await prisma.bookPurchase.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting book order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete book order' },
      { status: 500 }
    );
  }
}
