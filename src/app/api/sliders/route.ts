import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const SLIDER_KEY = 'slider_images';

// Public GET - fetch slider images for display
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SLIDER_KEY },
    });

    const slides = setting ? JSON.parse(setting.value) : [];

    // Sort by order
    slides.sort((a: { order: number }, b: { order: number }) => a.order - b.order);

    return NextResponse.json({ success: true, data: slides });
  } catch (error) {
    console.error('Error fetching sliders:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
