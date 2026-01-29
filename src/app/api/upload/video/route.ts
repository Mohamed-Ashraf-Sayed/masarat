import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    // Generate unique filename
    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const sanitizedExtension = ['mp4', 'webm', 'ogg', 'mov'].includes(extension) ? extension : 'mp4';
    const uniqueName = `video-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${sanitizedExtension}`;
    const filePath = path.join(uploadPath, uniqueName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/videos/${uniqueName}`;

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
