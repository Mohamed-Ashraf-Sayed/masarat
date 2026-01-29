import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : cookieToken;

  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// GET - Get single book details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);

    const book = await prisma.book.findUnique({
      where: { id },
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

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    if (!book.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Book not available' },
        { status: 404 }
      );
    }

    // Check if user has purchased this book
    let hasPurchased = false;
    if (tokenData) {
      const purchase = await prisma.bookPurchase.findUnique({
        where: {
          userId_bookId: {
            userId: tokenData.userId,
            bookId: id,
          },
        },
      });
      hasPurchased = purchase?.status === 'COMPLETED';
    }

    const formattedBook = {
      id: book.id,
      title: { ar: book.titleAr, en: book.titleEn },
      description: { ar: book.descriptionAr, en: book.descriptionEn },
      author: { ar: book.authorAr, en: book.authorEn },
      cover: book.cover,
      price: book.price,
      originalPrice: book.originalPrice,
      previewUrl: book.previewUrl,
      pages: book.pages,
      language: book.language,
      isbn: book.isbn,
      publishedYear: book.publishedYear,
      isFeatured: book.isFeatured,
      downloads: book.downloads,
      purchaseCount: book._count.purchases,
      hasPurchased,
      category: book.category
        ? {
            id: book.category.id,
            name: { ar: book.category.nameAr, en: book.category.nameEn },
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: formattedBook,
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}
