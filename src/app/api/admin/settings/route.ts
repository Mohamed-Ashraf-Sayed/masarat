import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

const SETTING_KEYS = [
  'general_settings',
  'localization_settings',
  'notification_settings',
  'security_settings',
  'payment_settings',
  'email_settings',
];

const DEFAULTS = {
  general_settings: {
    siteName: { ar: 'مسارات', en: 'Masarat' },
    contactEmail: 'support@masarat.com',
    supportPhone: '',
    maintenanceMode: false,
  },
  localization_settings: {
    defaultLanguage: 'ar',
    currency: 'USD',
    taxRate: 0,
  },
  notification_settings: {
    enableNotifications: true,
    emailNotifications: true,
  },
  security_settings: {
    enableRegistration: true,
    requireEmailVerification: false,
  },
  payment_settings: {
    currency: 'USD',
    requireManualApproval: true,
    bankAccountDetails: '',
  },
  email_settings: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: '',
  },
};

export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const records = await prisma.siteSetting.findMany({
      where: { key: { in: SETTING_KEYS } },
    });

    const result: Record<string, unknown> = {};
    for (const key of SETTING_KEYS) {
      const record = records.find((r) => r.key === key);
      const defaultVal = DEFAULTS[key as keyof typeof DEFAULTS];
      result[key] = record ? { ...defaultVal, ...JSON.parse(record.value) } : defaultVal;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Upsert each provided settings group
    const upserts = Object.entries(body)
      .filter(([key]) => SETTING_KEYS.includes(key))
      .map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: JSON.stringify(value) },
          update: { value: JSON.stringify(value) },
        })
      );

    await Promise.all(upserts);

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
