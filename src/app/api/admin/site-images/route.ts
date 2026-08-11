import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SITE_IMAGES_KEY = 'site_images';

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

// GET - fetch site images
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { key: SITE_IMAGES_KEY },
    });

    const images = setting ? JSON.parse(setting.value) : {};

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('Error fetching site images:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch site images' }, { status: 500 });
  }
}

// POST - upload a site image (hero or about)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const imageType = formData.get('type') as string; // 'hero' or 'about'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    if (!imageType || !['hero', 'about'].includes(imageType)) {
      return NextResponse.json({ success: false, error: 'Invalid image type' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Save file
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'site');
    await mkdir(uploadPath, { recursive: true });

    const extension = file.name.split('.').pop();
    const uniqueName = `${imageType}-${Date.now()}.${extension}`;
    const filePath = path.join(uploadPath, uniqueName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const publicUrl = `/api/files/site/${uniqueName}`;

    // Update site images in DB
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SITE_IMAGES_KEY },
    });

    const images = setting ? JSON.parse(setting.value) : {};
    images[imageType] = publicUrl;

    await prisma.siteSetting.upsert({
      where: { key: SITE_IMAGES_KEY },
      update: { value: JSON.stringify(images) },
      create: { key: SITE_IMAGES_KEY, value: JSON.stringify(images) },
    });

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('Error uploading site image:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
  }
}

// DELETE - remove a site image
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get('type');

    if (!imageType || !['hero', 'about'].includes(imageType)) {
      return NextResponse.json({ success: false, error: 'Invalid image type' }, { status: 400 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { key: SITE_IMAGES_KEY },
    });

    const images = setting ? JSON.parse(setting.value) : {};

    // Try to delete the file
    if (images[imageType]) {
      try {
        const filePath = path.join(process.cwd(), 'public', images[imageType]);
        await unlink(filePath);
      } catch {
        // File might not exist
      }
      delete images[imageType];
    }

    await prisma.siteSetting.upsert({
      where: { key: SITE_IMAGES_KEY },
      update: { value: JSON.stringify(images) },
      create: { key: SITE_IMAGES_KEY, value: JSON.stringify(images) },
    });

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('Error deleting site image:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete image' }, { status: 500 });
  }
}
