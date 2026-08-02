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
    const union = await prisma.union.findUnique({
      where: { id },
      include: { entities: { include: { _count: { select: { initiatives: true } } } } },
    });

    if (!union) return NextResponse.json({ success: false, error: 'Union not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: union });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch union' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { nameAr, nameEn, descriptionAr, descriptionEn, logo, isActive } = await request.json();

    const union = await prisma.union.update({
      where: { id },
      data: { nameAr, nameEn, descriptionAr, descriptionEn, logo, isActive },
    });

    return NextResponse.json({ success: true, data: union });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update union' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.union.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Union deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete union' }, { status: 500 });
  }
}
