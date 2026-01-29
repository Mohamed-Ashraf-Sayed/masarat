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

// POST - رفع إيصال الدفع
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

    // Get the payment
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (payment.userId !== tokenData.userId && tokenData.role !== 'ADMIN') {
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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedExtension = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension) ? extension : 'jpg';
    const filename = `receipt-${id}-${Date.now()}.${sanitizedExtension}`;
    const filePath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update payment with receipt URL
    const receiptUrl = `/uploads/receipts/${filename}`;
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { receiptUrl },
    });

    return NextResponse.json({
      success: true,
      data: {
        receiptUrl,
        paymentId: updatedPayment.id,
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

// GET - جلب إيصال الدفع
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

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        receiptUrl: true,
        userId: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check access
    if (payment.userId !== tokenData.userId && tokenData.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        receiptUrl: payment.receiptUrl,
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
