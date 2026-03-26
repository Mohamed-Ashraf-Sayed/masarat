import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const SITE_IMAGES_KEY = 'site_images';

// Public GET - fetch site images
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SITE_IMAGES_KEY },
    });

    const images = setting ? JSON.parse(setting.value) : {};

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('Error fetching site images:', error);
    return NextResponse.json({ success: true, data: {} });
  }
}
