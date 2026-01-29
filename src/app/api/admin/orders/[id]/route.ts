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

// GET - جلب طلب واحد
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

    const payment = await prisma.payment.findUnique({
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
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            price: true,
            thumbnail: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        adminNote: payment.adminNote,
        createdAt: payment.createdAt.toISOString(),
        user: payment.user,
        course: payment.course ? {
          id: payment.course.id,
          title: {
            ar: payment.course.titleAr,
            en: payment.course.titleEn,
          },
          price: payment.course.price,
          thumbnail: payment.course.thumbnail,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT - تحديث حالة الطلب (قبول/رفض)
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

    // Get current payment
    const currentPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: true,
        course: true,
      },
    });

    if (!currentPayment) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote }),
      },
    });

    // If status changed to COMPLETED, create enrollment if not exists
    if (status === 'COMPLETED' && currentPayment.status !== 'COMPLETED' && currentPayment.courseId) {
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: currentPayment.userId,
            courseId: currentPayment.courseId,
          },
        },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            userId: currentPayment.userId,
            courseId: currentPayment.courseId,
            status: 'ACTIVE',
          },
        });
      }

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: currentPayment.userId,
          titleAr: 'تم قبول طلبك',
          titleEn: 'Your order has been approved',
          messageAr: `تم قبول طلبك للدورة "${currentPayment.course?.titleAr}" بنجاح. يمكنك الآن البدء في التعلم.`,
          messageEn: `Your order for "${currentPayment.course?.titleEn}" has been approved. You can now start learning.`,
          type: 'ORDER_APPROVED',
        },
      });
    }

    // If status changed to FAILED/REFUNDED, notify user
    if ((status === 'FAILED' || status === 'REFUNDED') && currentPayment.status === 'PENDING') {
      await prisma.notification.create({
        data: {
          userId: currentPayment.userId,
          titleAr: status === 'REFUNDED' ? 'تم استرداد المبلغ' : 'تم رفض الطلب',
          titleEn: status === 'REFUNDED' ? 'Payment refunded' : 'Order rejected',
          messageAr: status === 'REFUNDED'
            ? `تم استرداد مبلغ ${currentPayment.amount} ${currentPayment.currency} بنجاح.`
            : `عذراً، تم رفض طلبك للدورة "${currentPayment.course?.titleAr}". ${adminNote || ''}`,
          messageEn: status === 'REFUNDED'
            ? `${currentPayment.amount} ${currentPayment.currency} has been refunded successfully.`
            : `Sorry, your order for "${currentPayment.course?.titleEn}" has been rejected. ${adminNote || ''}`,
          type: status === 'REFUNDED' ? 'ORDER_REFUNDED' : 'ORDER_REJECTED',
        },
      });

      // If status is FAILED/REFUNDED and there was an enrollment, cancel it
      if (currentPayment.courseId) {
        await prisma.enrollment.updateMany({
          where: {
            userId: currentPayment.userId,
            courseId: currentPayment.courseId,
          },
          data: {
            status: 'CANCELLED',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPayment,
      message: 'Order updated successfully',
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE - حذف طلب
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

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
