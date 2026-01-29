import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
};

// GET - جلب إعدادات الدفع (للمستخدمين العاديين)
export async function GET(request: NextRequest) {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'payment_settings' },
    });

    let data: Record<string, unknown> = DEFAULT_PAYMENT_SETTINGS;
    if (setting?.value) {
      try {
        data = JSON.parse(setting.value);
      } catch {
        data = DEFAULT_PAYMENT_SETTINGS;
      }
    }

    // Return only public settings needed for checkout
    return NextResponse.json({
      success: true,
      data: {
        currency: data.currency || 'USD',
        paymentMethods: data.paymentMethods || DEFAULT_PAYMENT_SETTINGS.paymentMethods,
        bankDetails: data.bankDetails || DEFAULT_PAYMENT_SETTINGS.bankDetails,
        taxRate: data.taxRate || 0,
        requireManualApproval: data.requireManualApproval ?? true,
      },
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_PAYMENT_SETTINGS,
    });
  }
}
