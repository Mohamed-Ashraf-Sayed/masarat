import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - جلب جميع التصنيفات
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: {
        ar: cat.nameAr,
        en: cat.nameEn,
      },
      icon: cat.icon,
      color: cat.color,
      coursesCount: cat._count.courses,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - إضافة تصنيف جديد
export async function POST(request: NextRequest) {
  try {
    const { nameAr, nameEn, icon, color } = await request.json();

    if (!nameAr || !nameEn) {
      return NextResponse.json(
        { success: false, error: 'Name is required in both languages' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        nameAr,
        nameEn,
        icon,
        color,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: 'Category created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
