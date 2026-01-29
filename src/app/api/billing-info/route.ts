import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

// GET - Fetch all billing info for a user
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    const billingInfos = await prisma.billingInfo.findMany({
      where: { userId: tokenData.userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json({
      success: true,
      data: billingInfos,
    });
  } catch (error) {
    console.error('Error fetching billing info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing info' },
      { status: 500 }
    );
  }
}

// POST - Create new billing info
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, email, phone, country, city, address, label, isDefault } = body;

    // Validate required fields
    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.billingInfo.updateMany({
        where: { userId: tokenData.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the first billing info, make it default
    const existingCount = await prisma.billingInfo.count({
      where: { userId: tokenData.userId },
    });

    const billingInfo = await prisma.billingInfo.create({
      data: {
        fullName,
        email,
        phone,
        country: country || null,
        city: city || null,
        address: address || null,
        label: label || null,
        isDefault: isDefault || existingCount === 0,
        userId: tokenData.userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: billingInfo,
    });
  } catch (error) {
    console.error('Error creating billing info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create billing info' },
      { status: 500 }
    );
  }
}

// PATCH - Update billing info
export async function PATCH(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, fullName, email, phone, country, city, address, label, isDefault } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing billing info ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.billingInfo.findFirst({
      where: { id, userId: tokenData.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Billing info not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.billingInfo.updateMany({
        where: { userId: tokenData.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const billingInfo = await prisma.billingInfo.update({
      where: { id },
      data: {
        fullName: fullName ?? existing.fullName,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        country: country ?? existing.country,
        city: city ?? existing.city,
        address: address ?? existing.address,
        label: label ?? existing.label,
        isDefault: isDefault ?? existing.isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      data: billingInfo,
    });
  } catch (error) {
    console.error('Error updating billing info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update billing info' },
      { status: 500 }
    );
  }
}

// DELETE - Delete billing info
export async function DELETE(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing billing info ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.billingInfo.findFirst({
      where: { id, userId: tokenData.userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Billing info not found' },
        { status: 404 }
      );
    }

    await prisma.billingInfo.delete({
      where: { id },
    });

    // If deleted was default, set another as default
    if (existing.isDefault) {
      const first = await prisma.billingInfo.findFirst({
        where: { userId: tokenData.userId },
        orderBy: { createdAt: 'desc' },
      });

      if (first) {
        await prisma.billingInfo.update({
          where: { id: first.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Billing info deleted',
    });
  } catch (error) {
    console.error('Error deleting billing info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete billing info' },
      { status: 500 }
    );
  }
}
