import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get all book categories (public)
export async function GET() {
  try {
    const categories = await prisma.bookCategory.findMany({
      include: {
        _count: {
          select: {
            books: {
              where: { isPublished: true },
            },
          },
        },
      },
      orderBy: { nameAr: 'asc' },
    });

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: { ar: category.nameAr, en: category.nameEn },
      icon: category.icon,
      description: category.description,
      bookCount: category._count.books,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCategories,
    });
  } catch (error) {
    console.error('Error fetching book categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
