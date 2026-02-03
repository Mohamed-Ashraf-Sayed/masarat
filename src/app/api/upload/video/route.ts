import { NextRequest, NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { sanitizeFilename, getJWTSecret } from '@/lib/security';

// Route segment config for large video uploads
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large videos

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

export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('video') as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No video file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const fileExtension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type (${file.type}). Allowed: MP4, WebM, OGG, MOV` },
        { status: 400 }
      );
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 500MB.' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'videos');
    await mkdir(uploadPath, { recursive: true });

    // Generate unique filename with sanitization
    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const sanitizedExtension = ['mp4', 'webm', 'ogg', 'mov'].includes(extension) ? extension : 'mp4';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const uniqueName = sanitizeFilename(`video-${timestamp}-${randomStr}.${sanitizedExtension}`);
    const filePath = path.join(uploadPath, uniqueName);

    // Stream file to disk for large files
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const chunkSize = 1024 * 1024; // 1MB chunks
    const writeStream = createWriteStream(filePath);

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      writeStream.write(chunk);
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      writeStream.end();
    });

    // Return the public URL (using API route for Docker standalone)
    const publicUrl = `/api/files/videos/${uniqueName}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: uniqueName,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to upload video: ${errorMessage}` },
      { status: 500 }
    );
  }
}
