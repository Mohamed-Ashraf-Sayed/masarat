import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/certificates/[id] — public certificate view by database ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            thumbnail: true,
            instructor: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: certificate });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch certificate' }, { status: 500 });
  }
}
