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

    const unions = await prisma.union.findMany({
      include: { _count: { select: { entities: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: unions });
  } catch (error) {
    console.error('Error fetching unions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch unions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { nameAr, nameEn, descriptionAr, descriptionEn, logo } = await request.json();

    if (!nameAr || !nameEn || !descriptionAr || !descriptionEn) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    const union = await prisma.union.create({
      data: { nameAr, nameEn, descriptionAr, descriptionEn, logo: logo || null },
    });

    return NextResponse.json({ success: true, data: union }, { status: 201 });
  } catch (error) {
    console.error('Error creating union:', error);
    return NextResponse.json({ success: false, error: 'Failed to create union' }, { status: 500 });
  }
}
