import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getRevenueSettings } from '@/lib/revenue';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

/**
 * GET /api/admin/revenue-settings
 * Returns current revenue split configuration.
 */
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getRevenueSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch revenue settings' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/revenue-settings
 * Update revenue split percentages and payout rules.
 * Shares must sum to 1.0 (100%).
 */
export async function PUT(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { instructorShare, platformShare, entityShare, minPayoutAmount, payoutCycleDays, refundBufferDays } = body;

    // Validate shares sum to 1.0
    if (instructorShare !== undefined || platformShare !== undefined || entityShare !== undefined) {
      const current = await getRevenueSettings();
      const i = instructorShare ?? current.instructorShare;
      const p = platformShare   ?? current.platformShare;
      const e = entityShare     ?? current.entityShare;
      const sum = +(i + p + e).toFixed(10);
      if (sum !== 1.0) {
        return NextResponse.json(
          { success: false, error: `Shares must sum to 1.0 (got ${sum}). Current: ${i}+${p}+${e}` },
          { status: 400 }
        );
      }
    }

    const current = await getRevenueSettings();

    const updated = await prisma.revenueSettings.update({
      where: { id: current.id },
      data: {
        ...(instructorShare  !== undefined && { instructorShare }),
        ...(platformShare    !== undefined && { platformShare }),
        ...(entityShare      !== undefined && { entityShare }),
        ...(minPayoutAmount  !== undefined && { minPayoutAmount }),
        ...(payoutCycleDays  !== undefined && { payoutCycleDays }),
        ...(refundBufferDays !== undefined && { refundBufferDays }),
        updatedById: tokenData.userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Revenue settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating revenue settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update revenue settings' }, { status: 500 });
  }
}
