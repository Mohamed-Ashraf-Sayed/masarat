import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getJWTSecret, getClientIP } from '@/lib/security';
import { logSecurityEvent } from '@/lib/advanced-security';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    // Get JWT secret lazily at runtime, not at module import time
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

// GET - Fetch security logs
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
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const ip = searchParams.get('ip');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (eventType) {
      where.eventType = eventType;
    }

    if (severity) {
      where.severity = severity;
    }

    if (ip) {
      where.ip = ip;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.securityAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          ...log,
          details: JSON.parse(log.details || '{}'),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch security logs' },
      { status: 500 }
    );
  }
}

// DELETE - Clear old security logs
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
    const olderThan = searchParams.get('olderThan'); // days

    if (!olderThan) {
      return NextResponse.json(
        { success: false, error: 'olderThan parameter is required' },
        { status: 400 }
      );
    }

    const days = parseInt(olderThan);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.securityAuditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    // Log this admin action
    const ip = getClientIP(request);
    logSecurityEvent({
      eventType: 'suspicious_request',
      severity: 'info',
      ip,
      userId: tokenData.userId,
      endpoint: '/api/admin/security/logs',
      method: 'DELETE',
      details: { action: 'clear_logs', deletedCount: result.count, olderThanDays: days },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error) {
    console.error('Error clearing security logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear security logs' },
      { status: 500 }
    );
  }
}
