import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '@/lib/security';

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

export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch various security stats in parallel
    const [
      // Last 24 hours stats
      totalEvents24h,
      blockedRequests24h,
      authFailures24h,
      wafBlocks24h,
      botDetections24h,

      // Last 7 days stats
      totalEvents7d,
      blockedRequests7d,

      // Total blocked IPs
      activeBlockedIPs,
      totalBlockedIPs,

      // Rate limit records
      activeRateLimits,

      // Account lockouts
      activeLockouts,

      // Top offending IPs (last 24h)
      topOffendingIPs,

      // Event type distribution (last 24h)
      eventTypeDistribution,

      // Hourly distribution (last 24h)
      hourlyDistribution,
    ] = await Promise.all([
      // Last 24 hours
      prisma.securityAuditLog.count({ where: { createdAt: { gte: last24Hours } } }),
      prisma.securityAuditLog.count({ where: { createdAt: { gte: last24Hours }, blocked: true } }),
      prisma.securityAuditLog.count({
        where: { createdAt: { gte: last24Hours }, eventType: 'authentication_failure' },
      }),
      prisma.securityAuditLog.count({ where: { createdAt: { gte: last24Hours }, eventType: 'waf_block' } }),
      prisma.securityAuditLog.count({ where: { createdAt: { gte: last24Hours }, eventType: 'bot_detected' } }),

      // Last 7 days
      prisma.securityAuditLog.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.securityAuditLog.count({ where: { createdAt: { gte: last7Days }, blocked: true } }),

      // Blocked IPs
      prisma.blockedIP.count({
        where: {
          OR: [
            { isPermanent: true },
            { blockedUntil: { gte: now } },
          ],
        },
      }),
      prisma.blockedIP.count(),

      // Rate limits
      prisma.rateLimitRecord.count({ where: { windowStart: { gte: last24Hours } } }),

      // Account lockouts
      prisma.accountLockout.count({ where: { lockedUntil: { gte: now } } }),

      // Top offending IPs
      prisma.securityAuditLog.groupBy({
        by: ['ip'],
        where: { createdAt: { gte: last24Hours } },
        _count: { ip: true },
        orderBy: { _count: { ip: 'desc' } },
        take: 10,
      }),

      // Event type distribution
      prisma.securityAuditLog.groupBy({
        by: ['eventType'],
        where: { createdAt: { gte: last24Hours } },
        _count: { eventType: true },
      }),

      // Hourly distribution
      prisma.$queryRaw`
        SELECT HOUR(createdAt) as hour, COUNT(*) as count
        FROM security_audit_logs
        WHERE createdAt >= ${last24Hours}
        GROUP BY HOUR(createdAt)
        ORDER BY hour
      ` as Promise<Array<{ hour: number; count: bigint }>>,
    ]);

    // Calculate threat level
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const blockedRatio = totalEvents24h > 0 ? blockedRequests24h / totalEvents24h : 0;

    if (blockedRequests24h > 1000 || blockedRatio > 0.3) {
      threatLevel = 'critical';
    } else if (blockedRequests24h > 500 || blockedRatio > 0.2) {
      threatLevel = 'high';
    } else if (blockedRequests24h > 100 || blockedRatio > 0.1) {
      threatLevel = 'medium';
    }

    // Process hourly distribution
    const hourlyData = new Array(24).fill(0);
    (hourlyDistribution as Array<{ hour: number; count: bigint }>).forEach(({ hour, count }) => {
      hourlyData[hour] = Number(count);
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          threatLevel,
          totalEvents24h,
          blockedRequests24h,
          authFailures24h,
          wafBlocks24h,
          botDetections24h,
          totalEvents7d,
          blockedRequests7d,
        },
        blockedIPs: {
          active: activeBlockedIPs,
          total: totalBlockedIPs,
        },
        rateLimits: {
          active: activeRateLimits,
        },
        accountLockouts: {
          active: activeLockouts,
        },
        topOffendingIPs: topOffendingIPs.map((item) => ({
          ip: item.ip,
          count: item._count.ip,
        })),
        eventTypeDistribution: eventTypeDistribution.map((item) => ({
          eventType: item.eventType,
          count: item._count.eventType,
        })),
        hourlyDistribution: hourlyData,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching security stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch security stats' },
      { status: 500 }
    );
  }
}
