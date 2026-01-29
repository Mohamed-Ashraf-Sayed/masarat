import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get all published books (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { titleAr: { contains: search } },
        { titleEn: { contains: search } },
        { authorAr: { contains: search } },
        { authorEn: { contains: search } },
      ];
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sort === 'price-low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'popular') {
      orderBy = { downloads: 'desc' };
    }

    const books = await prisma.book.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });

    const formattedBooks = books.map((book) => ({
      id: book.id,
      title: { ar: book.titleAr, en: book.titleEn },
      description: { ar: book.descriptionAr, en: book.descriptionEn },
      author: { ar: book.authorAr, en: book.authorEn },
      cover: book.cover,
      price: book.price,
      originalPrice: book.originalPrice,
      pages: book.pages,
      language: book.language,
      isbn: book.isbn,
      publishedYear: book.publishedYear,
      isFeatured: book.isFeatured,
      downloads: book.downloads,
      purchaseCount: book._count.purchases,
      category: book.category
        ? {
            id: book.category.id,
            name: { ar: book.category.nameAr, en: book.category.nameEn },
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedBooks,
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
