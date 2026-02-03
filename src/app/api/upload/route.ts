import { NextRequest, NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';

// Route segment config for Next.js 14 App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large videos
export const fetchCache = 'force-no-store';

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
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string; // 'avatar' or 'course'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type based on upload type
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];

    if (type === 'video') {
      if (!videoTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid file type. Only MP4, WebM, OGG, MOV, AVI, and MKV videos are allowed.' },
          { status: 400 }
        );
      }
    } else {
      if (!imageTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
          { status: 400 }
        );
      }
    }

    // Validate file size (5MB for images, 100MB for videos)
    const maxSize = type === 'video' ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: type === 'video' ? 'File too large. Maximum size is 100MB.' : 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Determine upload directory
    const uploadDir = type === 'avatar' ? 'avatars' : type === 'video' ? 'videos' : 'courses';
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', uploadDir);

    // Ensure directory exists
    await mkdir(uploadPath, { recursive: true });

    // Generate unique filename
    const extension = file.name.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
    const filePath = path.join(uploadPath, uniqueName);

    // Stream file to disk to handle large files
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write in chunks for large files
    const chunkSize = 1024 * 1024; // 1MB chunks
    const fs = await import('fs');
    const writeStream = fs.createWriteStream(filePath);

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      writeStream.write(chunk);
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      writeStream.end();
    });

    // Return the public URL (using API route for standalone build compatibility)
    const publicUrl = `/api/files/${uploadDir}/${uniqueName}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: uniqueName,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
