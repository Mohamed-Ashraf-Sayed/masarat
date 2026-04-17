import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

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

const DEFAULT_PAYMENT_SETTINGS = {
  currency: 'USD',
  paymentMethods: {
    card: { enabled: true, label: { ar: 'بطاقة ائتمان', en: 'Credit Card' } },
    paypal: { enabled: true, label: { ar: 'باي بال', en: 'PayPal' } },
    bank: { enabled: true, label: { ar: 'تحويل بنكي', en: 'Bank Transfer' } },
  },
  bankDetails: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
    notes: { ar: '', en: '' },
  },
  taxRate: 0,
  requireManualApproval: true,
  notifyAdminOnNewOrder: true,
  notifyUserOnStatusChange: true,
};

// GET - جلب إعدادات الدفع
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'payment_settings' },
    });

    let data = DEFAULT_PAYMENT_SETTINGS;
    if (setting?.value) {
      try {
        data = JSON.parse(setting.value);
      } catch {
        data = DEFAULT_PAYMENT_SETTINGS;
      }
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment settings' },
      { status: 500 }
    );
  }
}

// PUT - تحديث إعدادات الدفع
export async function PUT(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const valueString = JSON.stringify(body);

    const setting = await prisma.siteSetting.upsert({
      where: { key: 'payment_settings' },
      update: { value: valueString },
      create: { key: 'payment_settings', value: valueString },
    });

    return NextResponse.json({
      success: true,
      data: JSON.parse(setting.value),
      message: 'Payment settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}
