import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - جلب أعضاء الفريق النشطين (عام)
export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch team members' }, { status: 500 });
  }
}
