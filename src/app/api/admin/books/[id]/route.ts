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

// GET - Get single book (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: book.id,
        titleAr: book.titleAr,
        titleEn: book.titleEn,
        descriptionAr: book.descriptionAr,
        descriptionEn: book.descriptionEn,
        authorAr: book.authorAr,
        authorEn: book.authorEn,
        cover: book.cover,
        price: book.price,
        originalPrice: book.originalPrice,
        fileUrl: book.fileUrl,
        previewUrl: book.previewUrl,
        pages: book.pages,
        language: book.language,
        isbn: book.isbn,
        publishedYear: book.publishedYear,
        categoryId: book.categoryId,
        isPublished: book.isPublished,
        isFeatured: book.isFeatured,
        downloads: book.downloads,
        purchaseCount: book._count.purchases,
        createdAt: book.createdAt.toISOString(),
        category: book.category,
      },
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}

// PUT - Update book (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        titleAr: body.titleAr,
        titleEn: body.titleEn,
        descriptionAr: body.descriptionAr,
        descriptionEn: body.descriptionEn,
        authorAr: body.authorAr,
        authorEn: body.authorEn,
        cover: body.cover,
        price: body.price,
        originalPrice: body.originalPrice,
        fileUrl: body.fileUrl,
        previewUrl: body.previewUrl,
        pages: body.pages,
        language: body.language,
        isbn: body.isbn,
        publishedYear: body.publishedYear,
        categoryId: body.categoryId || null,
        isPublished: body.isPublished,
        isFeatured: body.isFeatured,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBook,
      message: 'Book updated successfully',
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

// DELETE - Delete book (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        _count: { select: { purchases: true } },
      },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if book has purchases
    if (book._count.purchases > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete book with existing purchases' },
        { status: 400 }
      );
    }

    await prisma.book.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}
