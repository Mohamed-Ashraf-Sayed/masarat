import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default configurations for different endpoints
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  'auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 20 }, // 20 attempts per 15 min
  'auth/register': { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour
  'auth/forgot-password': { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour
  'auth/reset-password': { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour
  'default': { windowMs: 60 * 1000, maxRequests: 200 }, // 200 per minute
};

// Get client IP from request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

// Check rate limit
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const ip = getClientIP(request);
  const config = rateLimitConfigs[endpoint] || rateLimitConfigs['default'];
  const key = `${ip}:${endpoint}`;

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    // Clean old records
    await prisma.rateLimitRecord.deleteMany({
      where: {
        windowStart: { lt: windowStart },
      },
    });

    // Find or create rate limit record
    const record = await prisma.rateLimitRecord.findFirst({
      where: {
        key,
        endpoint,
      },
    });

    if (!record) {
      // First request - create record
      await prisma.rateLimitRecord.create({
        data: {
          key,
          endpoint,
          count: 1,
          windowStart: now,
        },
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }

    // Check if window has expired
    if (record.windowStart < windowStart) {
      // Reset window
      await prisma.rateLimitRecord.update({
        where: { id: record.id },
        data: {
          count: 1,
          windowStart: now,
        },
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      const resetAt = new Date(record.windowStart.getTime() + config.windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Increment count
    await prisma.rateLimitRecord.update({
      where: { id: record.id },
      data: { count: record.count + 1 },
    });

    return {
      allowed: true,
      remaining: config.maxRequests - record.count - 1,
      resetAt: new Date(record.windowStart.getTime() + config.windowMs),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow request on error (fail open)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }
}

// Rate limit response
export function rateLimitResponse(resetAt: Date) {
  const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      success: false,
      error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': resetAt.toISOString(),
      },
    }
  );
}
