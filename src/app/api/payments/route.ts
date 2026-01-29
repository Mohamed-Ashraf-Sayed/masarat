import { NextRequest, NextResponse } from 'next/server';

// POST - إنشاء عملية دفع
export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, amount, paymentMethod } = await request.json();

    if (!userId || !courseId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // هنا يمكنك دمج بوابة دفع حقيقية مثل Stripe أو PayPal
    const payment = {
      id: `PAY-${Date.now()}`,
      userId,
      courseId,
      amount,
      currency: 'USD',
      paymentMethod: paymentMethod || 'card',
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment successful'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Payment failed' },
      { status: 500 }
    );
  }
}

// GET - جلب سجل المدفوعات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // بيانات تجريبية
    const payments = [
      {
        id: 'PAY-001',
        userId,
        courseId: '1',
        courseName: 'دورة تطوير الويب الشاملة',
        amount: 199,
        currency: 'USD',
        status: 'completed',
        createdAt: '2024-01-15',
      },
      {
        id: 'PAY-002',
        userId,
        courseId: '2',
        courseName: 'التصميم الجرافيكي',
        amount: 149,
        currency: 'USD',
        status: 'completed',
        createdAt: '2024-01-10',
      },
    ];

    return NextResponse.json({
      success: true,
      data: payments
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
