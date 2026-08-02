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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        union: { select: { id: true, nameAr: true, nameEn: true } },
        owner: { select: { id: true, name: true, email: true } },
        initiatives: true,
      },
    });

    if (!entity) return NextResponse.json({ success: false, error: 'Entity not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: entity });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch entity' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { nameAr, nameEn, descriptionAr, descriptionEn, logo, unionId, ownerId, isActive } = await request.json();

    const entity = await prisma.entity.update({
      where: { id },
      data: { nameAr, nameEn, descriptionAr, descriptionEn, logo, unionId, ownerId, isActive },
    });

    return NextResponse.json({ success: true, data: entity });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update entity' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.entity.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Entity deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete entity' }, { status: 500 });
  }
}
