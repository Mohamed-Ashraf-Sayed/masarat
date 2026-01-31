import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getJWTSecret, getClientIP } from '@/lib/security';
import { logSecurityEvent } from '@/lib/advanced-security';

const JWT_SECRET = getJWTSecret();

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

// GET - Fetch blocked IPs
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const includeExpired = searchParams.get('includeExpired') === 'true';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (!includeExpired) {
      where.OR = [
        { isPermanent: true },
        { blockedUntil: { gte: new Date() } },
        { blockedUntil: null },
      ];
    }

    const [blockedIPs, total] = await Promise.all([
      prisma.blockedIP.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.blockedIP.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        blockedIPs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blocked IPs' },
      { status: 500 }
    );
  }
}

// POST - Block an IP
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ip, reason, duration, isPermanent } = body;

    if (!ip || !reason) {
      return NextResponse.json(
        { success: false, error: 'IP and reason are required' },
        { status: 400 }
      );
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    let blockedUntil = null;
    if (!isPermanent && duration) {
      blockedUntil = new Date(Date.now() + duration * 60 * 60 * 1000); // duration in hours
    }

    const blockedIP = await prisma.blockedIP.upsert({
      where: { ip },
      update: {
        reason,
        blockedBy: tokenData.userId,
        blockedUntil,
        isPermanent: isPermanent || false,
      },
      create: {
        ip,
        reason,
        blockedBy: tokenData.userId,
        blockedUntil,
        isPermanent: isPermanent || false,
      },
    });

    // Log this action
    const adminIP = getClientIP(request);
    logSecurityEvent({
      eventType: 'suspicious_request',
      severity: 'info',
      ip: adminIP,
      userId: tokenData.userId,
      endpoint: '/api/admin/security/blocked-ips',
      method: 'POST',
      details: { action: 'block_ip', blockedIP: ip, reason, isPermanent },
    });

    return NextResponse.json({
      success: true,
      data: blockedIP,
    });
  } catch (error) {
    console.error('Error blocking IP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to block IP' },
      { status: 500 }
    );
  }
}

// DELETE - Unblock an IP
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json(
        { success: false, error: 'IP is required' },
        { status: 400 }
      );
    }

    const result = await prisma.blockedIP.delete({
      where: { ip },
    });

    // Log this action
    const adminIP = getClientIP(request);
    logSecurityEvent({
      eventType: 'suspicious_request',
      severity: 'info',
      ip: adminIP,
      userId: tokenData.userId,
      endpoint: '/api/admin/security/blocked-ips',
      method: 'DELETE',
      details: { action: 'unblock_ip', unblockedIP: ip },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unblock IP' },
      { status: 500 }
    );
  }
}
