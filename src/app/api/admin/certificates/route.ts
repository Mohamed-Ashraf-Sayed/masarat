import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { createAuditLog } from '@/lib/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

// GET - list all certificates
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
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
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
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

    // منع تكرار الشهادة لنفس الطالب في نفس الكورس (مفيش unique constraint في الـ schema)
    const existing = await prisma.certificate.findFirst({ where: { userId, courseId } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Certificate already issued for this user and course' },
        { status: 409 }
      );
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

    // Audit
    createAuditLog({
      userId: user.userId,
      action: 'CERTIFICATE_ISSUED',
      entity: 'Certificate',
      entityId: certificate.id,
      newValue: { userId, courseId, certificateId: certificate.certificateId },
    });

    // إشعار الطالب بإصدار الشهادة
    prisma.notification
      .create({
        data: {
          userId,
          titleAr: 'تهانينا! حصلت على شهادة',
          titleEn: 'Congratulations! You earned a certificate',
          messageAr: `تم إصدار شهادة إتمام دورة "${course.titleAr}" لك`,
          messageEn: `A certificate for "${course.titleEn}" has been issued to you`,
          type: 'achievement',
        },
      })
      .catch((e) => console.error('Failed to create certificate notification:', e));

    return NextResponse.json({ success: true, data: certificate });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error creating certificate:', errMsg);
    return NextResponse.json({ success: false, error: errMsg || 'Failed to create certificate' }, { status: 500 });
  }
}

// DELETE - revoke certificate
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Certificate ID required' }, { status: 400 });
    }

    const deleted = await prisma.certificate.delete({ where: { id } });

    // Audit
    createAuditLog({
      userId: user.userId,
      action: 'CERTIFICATE_REVOKED',
      entity: 'Certificate',
      entityId: id,
      oldValue: { userId: deleted.userId, courseId: deleted.courseId, certificateId: deleted.certificateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete certificate' }, { status: 500 });
  }
}
