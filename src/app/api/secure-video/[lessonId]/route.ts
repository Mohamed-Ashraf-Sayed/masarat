import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createReadStream, statSync } from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const VIDEO_SECRET = process.env.VIDEO_SECRET || 'video-signing-secret-key';

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

// Generate signed video token
function generateVideoToken(userId: string, lessonId: string, expiresIn: number = 3600): string {
  const payload = {
    userId,
    lessonId,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const signature = crypto
    .createHmac('sha256', VIDEO_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64url');
}

// Verify signed video token
function verifyVideoToken(token: string): { userId: string; lessonId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
    const { signature, ...payload } = decoded;

    const expectedSignature = crypto
      .createHmac('sha256', VIDEO_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { userId: payload.userId, lessonId: payload.lessonId };
  } catch {
    return null;
  }
}

// GET - Get signed video URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lessonId } = await params;

    // Get lesson and course info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { userId: tokenData.userId },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled or is the instructor/admin
    const isEnrolled = lesson.course.enrollments.length > 0;
    const isInstructor = lesson.course.instructorId === tokenData.userId;
    const isAdmin = tokenData.role === 'ADMIN';
    const isFreeLesson = lesson.isFree;

    if (!isEnrolled && !isInstructor && !isAdmin && !isFreeLesson) {
      return NextResponse.json(
        { success: false, error: 'Access denied - Not enrolled' },
        { status: 403 }
      );
    }

    if (!lesson.videoUrl) {
      return NextResponse.json(
        { success: false, error: 'No video available' },
        { status: 404 }
      );
    }

    // Get user info for watermark
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { name: true, email: true },
    });

    // Generate signed token (expires in 1 hour)
    const videoToken = generateVideoToken(tokenData.userId, lessonId, 3600);

    // Check if watermark is enabled for this course
    const enableWatermark = lesson.course.enableWatermark !== false;

    return NextResponse.json({
      success: true,
      data: {
        token: videoToken,
        streamUrl: `/api/secure-video/${lessonId}/stream?token=${videoToken}`,
        expiresIn: 3600,
        enableWatermark,
        watermark: enableWatermark ? {
          text: user?.name || user?.email || tokenData.userId.slice(0, 8),
          id: tokenData.userId.slice(0, 8),
        } : null,
      },
    });
  } catch (error) {
    console.error('Error generating video token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate video access' },
      { status: 500 }
    );
  }
}
