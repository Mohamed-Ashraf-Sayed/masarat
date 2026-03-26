import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SLIDER_KEY = 'slider_images';

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

// GET - fetch all slider images
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { key: SLIDER_KEY },
    });

    const slides = setting ? JSON.parse(setting.value) : [];

    return NextResponse.json({ success: true, data: slides });
  } catch (error) {
    console.error('Error fetching sliders:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch sliders' }, { status: 500 });
  }
}

// POST - upload a new slider image
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB for banners
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Save file
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'sliders');
    await mkdir(uploadPath, { recursive: true });

    const extension = file.name.split('.').pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
    const filePath = path.join(uploadPath, uniqueName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/sliders/${uniqueName}`;

    // Update slider list in DB
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SLIDER_KEY },
    });

    const slides = setting ? JSON.parse(setting.value) : [];
    const newSlide = {
      id: `slide-${Date.now()}`,
      src: publicUrl,
      alt: title || `Slider ${slides.length + 1}`,
      order: slides.length,
    };
    slides.push(newSlide);

    await prisma.siteSetting.upsert({
      where: { key: SLIDER_KEY },
      update: { value: JSON.stringify(slides) },
      create: { key: SLIDER_KEY, value: JSON.stringify(slides) },
    });

    return NextResponse.json({ success: true, data: newSlide });
  } catch (error) {
    console.error('Error uploading slider:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload slider' }, { status: 500 });
  }
}

// PUT - reorder or update slides
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { slides } = await request.json();

    await prisma.siteSetting.upsert({
      where: { key: SLIDER_KEY },
      update: { value: JSON.stringify(slides) },
      create: { key: SLIDER_KEY, value: JSON.stringify(slides) },
    });

    return NextResponse.json({ success: true, data: slides });
  } catch (error) {
    console.error('Error updating sliders:', error);
    return NextResponse.json({ success: false, error: 'Failed to update sliders' }, { status: 500 });
  }
}

// DELETE - remove a slider image
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slideId = searchParams.get('id');

    if (!slideId) {
      return NextResponse.json({ success: false, error: 'Slide ID required' }, { status: 400 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { key: SLIDER_KEY },
    });

    if (!setting) {
      return NextResponse.json({ success: false, error: 'No slides found' }, { status: 404 });
    }

    const slides = JSON.parse(setting.value);
    const slideToDelete = slides.find((s: { id: string }) => s.id === slideId);

    if (!slideToDelete) {
      return NextResponse.json({ success: false, error: 'Slide not found' }, { status: 404 });
    }

    // Try to delete the file
    try {
      const filePath = path.join(process.cwd(), 'public', slideToDelete.src);
      await unlink(filePath);
    } catch {
      // File might not exist, continue
    }

    const updatedSlides = slides
      .filter((s: { id: string }) => s.id !== slideId)
      .map((s: { id: string; order: number }, i: number) => ({ ...s, order: i }));

    await prisma.siteSetting.upsert({
      where: { key: SLIDER_KEY },
      update: { value: JSON.stringify(updatedSlides) },
      create: { key: SLIDER_KEY, value: JSON.stringify(updatedSlides) },
    });

    return NextResponse.json({ success: true, data: updatedSlides });
  } catch (error) {
    console.error('Error deleting slider:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete slider' }, { status: 500 });
  }
}
