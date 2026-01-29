import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// GET - Get all books (admin)
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const books = await prisma.book.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    const formattedBooks = books.map((book) => ({
      id: book.id,
      title: { ar: book.titleAr, en: book.titleEn },
      description: { ar: book.descriptionAr, en: book.descriptionEn },
      author: { ar: book.authorAr, en: book.authorEn },
      cover: book.cover,
      price: book.price,
      originalPrice: book.originalPrice,
      fileUrl: book.fileUrl,
      previewUrl: book.previewUrl,
      pages: book.pages,
      language: book.language,
      isbn: book.isbn,
      publishedYear: book.publishedYear,
      isPublished: book.isPublished,
      isFeatured: book.isFeatured,
      downloads: book.downloads,
      purchaseCount: book._count.purchases,
      createdAt: book.createdAt.toISOString(),
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

// POST - Create new book (admin)
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      authorAr,
      authorEn,
      cover,
      price,
      originalPrice,
      fileUrl,
      previewUrl,
      pages,
      language,
      isbn,
      publishedYear,
      categoryId,
      isPublished,
      isFeatured,
    } = body;

    if (!titleAr || !titleEn || !authorAr || !authorEn) {
      return NextResponse.json(
        { success: false, error: 'Title and author are required in both languages' },
        { status: 400 }
      );
    }

    const book = await prisma.book.create({
      data: {
        titleAr,
        titleEn,
        descriptionAr: descriptionAr || '',
        descriptionEn: descriptionEn || '',
        authorAr,
        authorEn,
        cover,
        price: price || 0,
        originalPrice,
        fileUrl,
        previewUrl,
        pages,
        language: language || 'ar',
        isbn,
        publishedYear,
        categoryId,
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: book.id,
        title: { ar: book.titleAr, en: book.titleEn },
        author: { ar: book.authorAr, en: book.authorEn },
        isPublished: book.isPublished,
      },
      message: 'Book created successfully',
    });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create book' },
      { status: 500 }
    );
  }
}
