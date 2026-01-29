import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to get user from token
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

// POST - رفع إيصال شراء الكتاب
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the book purchase
    const purchase = await prisma.bookPurchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (purchase.userId !== tokenData.userId && tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('receipt') as File;

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded or invalid file' },
        { status: 400 }
      );
    }

    // Validate file type - also check by extension as fallback
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const fileExtension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type (${file.type}). Allowed: JPG, PNG, WEBP, PDF` },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max 5MB allowed' },
        { status: 400 }
      );
    }

    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'book-receipts');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedExtension = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension) ? extension : 'jpg';
    const filename = `book-receipt-${id}-${Date.now()}.${sanitizedExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update purchase with receipt URL
    const receiptUrl = `/uploads/book-receipts/${filename}`;
    const updatedPurchase = await prisma.bookPurchase.update({
      where: { id },
      data: { receiptUrl },
    });

    return NextResponse.json({
      success: true,
      data: {
        receiptUrl,
        purchaseId: updatedPurchase.id,
      },
      message: 'Receipt uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to upload receipt: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// GET - جلب إيصال شراء الكتاب
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const purchase = await prisma.bookPurchase.findUnique({
      where: { id },
      select: {
        id: true,
        receiptUrl: true,
        userId: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      );
    }

    // Check access
    if (purchase.userId !== tokenData.userId && tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        receiptUrl: purchase.receiptUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}
