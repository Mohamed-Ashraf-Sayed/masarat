'use server';

import { mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getUserFromToken(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function uploadFile(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string;
    const authToken = formData.get('token') as string;

    // Verify token from formData if cookie not available
    let user = await getUserFromToken();

    if (!user && authToken) {
      try {
        user = jwt.verify(authToken, JWT_SECRET) as { userId: string; role: string };
      } catch {
        return { success: false, error: 'Unauthorized' };
      }
    }

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!file) {
      return { success: false, error: 'No file uploaded' };
    }

    // Validate file type
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];

    if (type === 'video') {
      if (!videoTypes.includes(file.type)) {
        return { success: false, error: 'Invalid video type. Only MP4, WebM, OGG, MOV, AVI, MKV allowed.' };
      }
    } else {
      if (!imageTypes.includes(file.type)) {
        return { success: false, error: 'Invalid image type. Only JPEG, PNG, WebP, GIF allowed.' };
      }
    }

    // Validate file size
    const maxSize = type === 'video' ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: type === 'video' ? 'Max 100MB for videos' : 'Max 5MB for images' };
    }

    // Determine upload directory
    const uploadDir = type === 'avatar' ? 'avatars' : type === 'video' ? 'videos' : 'courses';
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', uploadDir);

    // Ensure directory exists
    await mkdir(uploadPath, { recursive: true });

    // Generate unique filename
    const extension = file.name.split('.').pop();
    const uniqueName = `video-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
    const filePath = path.join(uploadPath, uniqueName);

    // Stream file to disk
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

    const publicUrl = `/api/files/${uploadDir}/${uniqueName}`;

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Upload failed' };
  }
}
