import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_TTL  = '15m';  // short-lived access token
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * POST /api/auth/refresh
 * Section 14.12 — JWT Refresh Token mechanism
 *
 * Flow:
 * 1. Client sends the sessionToken (httpOnly cookie) + expired JWT in Authorization header
 * 2. Server validates session exists and isn't expired
 * 3. Server issues a new short-lived access token (15 min)
 * 4. Session lastActive is updated
 *
 * If the session cookie is missing or expired → 401, client must re-login.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    // Validate session in DB
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: { id: true, email: true, role: true, isActive: true, isDeleted: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session. Please log in again.' },
        { status: 401 }
      );
    }

    if (session.expires < new Date()) {
      // Clean up expired session
      await prisma.session.delete({ where: { sessionToken } }).catch(() => {});
      return NextResponse.json(
        { success: false, error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    const { user } = session;

    // Revoke if user is suspended or deleted
    if (!user.isActive || user.isDeleted) {
      await prisma.session.delete({ where: { sessionToken } }).catch(() => {});
      return NextResponse.json(
        { success: false, error: 'Account deactivated. Access revoked.' },
        { status: 403 }
      );
    }

    // Update session lastActive
    await prisma.session.update({
      where: { sessionToken },
      data: { lastActive: new Date() },
    });

    // Issue a fresh access token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const response = NextResponse.json({
      success: true,
      data: { token: newToken },
      message: 'Token refreshed successfully',
    });

    // Update JWT cookie
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
