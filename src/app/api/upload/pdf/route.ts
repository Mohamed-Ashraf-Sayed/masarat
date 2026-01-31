import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import { sanitizeFilename, getJWTSecret } from '@/lib/security';

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
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type - only PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB for PDFs)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Upload directory for lesson resources
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'resources');

    // Ensure directory exists
    await mkdir(uploadPath, { recursive: true });

    // Generate unique filename with sanitization
    const sanitizedOriginalName = sanitizeFilename(file.name);
    const uniqueName = `${Date.now()}-${sanitizedOriginalName}`;
    const filePath = path.join(uploadPath, uniqueName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/resources/${uniqueName}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: uniqueName,
        originalName: file.name,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
