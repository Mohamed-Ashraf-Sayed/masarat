import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (!['ADMIN', 'SUPER_ADMIN'].includes(decoded.role)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// GET - جلب جميع أعضاء الفريق
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch team members' }, { status: 500 });
  }
}

// POST - إضافة عضو جديد
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nameAr, nameEn, roleAr, roleEn, image, credentials, order } = body;

    if (!nameAr || !nameEn || !roleAr || !roleEn) {
      return NextResponse.json({ success: false, error: 'Name and role are required in both languages' }, { status: 400 });
    }

    const member = await prisma.teamMember.create({
      data: {
        nameAr,
        nameEn,
        roleAr,
        roleEn,
        image: image || null,
        credentials: credentials || null,
        order: order || 0,
      },
    });

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ success: false, error: 'Failed to create team member' }, { status: 500 });
  }
}

// PUT - تعديل عضو
export async function PUT(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, nameAr, nameEn, roleAr, roleEn, image, credentials, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (roleAr !== undefined) updateData.roleAr = roleAr;
    if (roleEn !== undefined) updateData.roleEn = roleEn;
    if (image !== undefined) updateData.image = image || null;
    if (credentials !== undefined) updateData.credentials = credentials || null;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const member = await prisma.teamMember.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: member });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json({ success: false, error: 'Failed to update team member' }, { status: 500 });
  }
}

// DELETE - حذف عضو
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }

    await prisma.teamMember.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Team member deleted' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete team member' }, { status: 500 });
  }
}
