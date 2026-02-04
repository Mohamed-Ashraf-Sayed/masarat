import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { createReadStream, statSync, existsSync } from 'fs';
import path from 'path';

const VIDEO_SECRET = process.env.VIDEO_SECRET || 'video-signing-secret-key';

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

// GET - Stream video with range support
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse('Token required', { status: 401 });
    }

    const tokenData = verifyVideoToken(token);
    if (!tokenData) {
      return new NextResponse('Invalid or expired token', { status: 401 });
    }

    const { lessonId } = await params;

    // Verify lessonId matches token
    if (tokenData.lessonId !== lessonId) {
      return new NextResponse('Token mismatch', { status: 403 });
    }

    // Get lesson
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || !lesson.videoUrl) {
      return new NextResponse('Video not found', { status: 404 });
    }

    // Check if it's a local file or external URL
    const isLocalFile = lesson.videoUrl.startsWith('/uploads/') || lesson.videoUrl.startsWith('/api/files/');

    if (!isLocalFile) {
      // For external URLs, redirect (YouTube, Vimeo handled client-side)
      return NextResponse.redirect(lesson.videoUrl);
    }

    // Handle local file streaming
    // Convert /api/files/xxx to /uploads/xxx for file path
    let videoFilePath = lesson.videoUrl;
    if (videoFilePath.startsWith('/api/files/')) {
      videoFilePath = '/uploads/' + videoFilePath.substring('/api/files/'.length);
    }
    const videoPath = path.join(process.cwd(), 'public', videoFilePath);

    if (!existsSync(videoPath)) {
      return new NextResponse('Video file not found', { status: 404 });
    }

    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    // Get file extension for content type
    const ext = path.extname(videoPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
    };
    const contentType = contentTypes[ext] || 'video/mp4';

    if (range) {
      // Handle range request for video seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      // Read file chunk
      const fileBuffer = await readFileChunk(videoPath, start, end);

      return new NextResponse(fileBuffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } else {
      // Handle full file request
      const fileBuffer = await readFile(videoPath);

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Helper function to read file chunk
async function readFileChunk(filePath: string, start: number, end: number): Promise<Buffer> {
  const { open } = await import('fs/promises');
  const fileHandle = await open(filePath, 'r');
  const buffer = Buffer.alloc(end - start + 1);
  await fileHandle.read(buffer, 0, buffer.length, start);
  await fileHandle.close();
  return buffer;
}

// Helper function to read full file
async function readFile(filePath: string): Promise<Buffer> {
  const { readFile: fsReadFile } = await import('fs/promises');
  return fsReadFile(filePath);
}
