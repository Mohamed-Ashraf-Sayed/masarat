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

// GET - list all certificates
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const certificates = await prisma.certificate.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, titleAr: true, titleEn: true, certificateTemplate: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

// POST - issue certificate manually
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const {
      userId, courseId, certificateTemplate,
      customCertNumber, trainingHours,
      ceuCount, generalCeus, supervisionCeus, ethicsCeus,
      eventModality, providerNumber,
      startDate, completionDate,
    } = await request.json();

    if (!userId || !courseId) {
      return NextResponse.json({ success: false, error: 'userId and courseId are required' }, { status: 400 });
    }

    // Check user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateTemplate: certificateTemplate || null,
        certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        customCertNumber: customCertNumber || null,
        trainingHours: trainingHours != null ? parseInt(trainingHours) : null,
        ceuCount: ceuCount != null ? parseFloat(ceuCount) : null,
        generalCeus: generalCeus != null ? parseFloat(generalCeus) : null,
        supervisionCeus: supervisionCeus != null ? parseFloat(supervisionCeus) : null,
        ethicsCeus: ethicsCeus != null ? parseFloat(ethicsCeus) : null,
        eventModality: eventModality || null,
        providerNumber: providerNumber || null,
        startDate: startDate ? new Date(startDate) : null,
        completionDate: completionDate ? new Date(completionDate) : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, titleAr: true, titleEn: true } },
      },
    });

    return NextResponse.json({ success: true, data: certificate });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json({ success: false, error: 'Failed to create certificate' }, { status: 500 });
  }
}

// DELETE - revoke certificate
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Certificate ID required' }, { status: 400 });
    }

    await prisma.certificate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete certificate' }, { status: 500 });
  }
}
