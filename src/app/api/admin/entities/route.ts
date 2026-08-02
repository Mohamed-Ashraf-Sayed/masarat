import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');

    const entities = await prisma.entity.findMany({
      where: unionId ? { unionId } : undefined,
      include: {
        union: { select: { id: true, nameAr: true, nameEn: true } },
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { initiatives: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: entities });
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch entities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { nameAr, nameEn, descriptionAr, descriptionEn, logo, unionId, ownerId } = await request.json();

    if (!nameAr || !nameEn || !descriptionAr || !descriptionEn || !unionId || !ownerId) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    const entity = await prisma.entity.create({
      data: { nameAr, nameEn, descriptionAr, descriptionEn, logo: logo || null, unionId, ownerId },
      include: {
        union: { select: { id: true, nameAr: true, nameEn: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: entity }, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json({ success: false, error: 'Failed to create entity' }, { status: 500 });
  }
}
