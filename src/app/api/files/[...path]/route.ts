import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: filePath } = await params;
    const fullPath = path.join(process.cwd(), 'public', 'uploads', ...filePath);

    // Security check - prevent directory traversal
    const normalizedPath = path.normalize(fullPath);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!normalizedPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const file = await readFile(fullPath);

    // Determine content type
    const ext = path.extname(fullPath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.pdf': 'application/pdf',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
