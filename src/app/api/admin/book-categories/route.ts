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

// GET - Get all book categories (admin)
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const categories = await prisma.bookCategory.findMany({
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      icon: category.icon,
      description: category.description,
      bookCount: category._count.books,
      createdAt: category.createdAt.toISOString(),
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

// POST - Create new book category (admin)
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nameAr, nameEn, icon, description } = body;

    if (!nameAr || !nameEn) {
      return NextResponse.json(
        { success: false, error: 'Name is required in both languages' },
        { status: 400 }
      );
    }

    const category = await prisma.bookCategory.create({
      data: {
        nameAr,
        nameEn,
        icon,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    console.error('Error creating book category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT - Update book category (admin)
export async function PUT(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, nameAr, nameEn, icon, description } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const category = await prisma.bookCategory.update({
      where: { id },
      data: {
        nameAr,
        nameEn,
        icon,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Error updating book category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete book category (admin)
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category has books
    const category = await prisma.bookCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { books: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    if (category._count.books > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with existing books' },
        { status: 400 }
      );
    }

    await prisma.bookCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting book category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
