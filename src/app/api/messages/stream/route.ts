import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { realtimeManager } from '@/lib/realtime';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const tokenData = getUserFromToken(request);
  if (!tokenData) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = tokenData.userId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send connected message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`));

      // Subscribe to realtime events
      const unsubscribe = realtimeManager.subscribe(userId, (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Connection closed
        }
      });

      // Heartbeat every 25 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
