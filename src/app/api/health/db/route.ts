import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // Simple query to test database connection
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
