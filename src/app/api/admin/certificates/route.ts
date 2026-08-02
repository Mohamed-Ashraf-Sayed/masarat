import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { createAuditLog } from '@/lib/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; role: string };
  } catch { return null; }
}

// GET /api/admin/certificates — list all certificates
export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const courseId = searchParams.get('courseId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { course: { titleAr: { contains: search } } },
        { course: { titleEn: { contains: search } } },
        { certificateId: { contains: search } },
      ];
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          course: { select: { id: true, titleAr: true, titleEn: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: { certificates, total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

// POST /api/admin/certificates — issue certificate manually
export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json({ success: false, error: 'userId and courseId are required' }, { status: 400 });
    }

    // Check user and course exist
    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
      prisma.course.findUnique({ where: { id: courseId }, select: { id: true, titleAr: true, titleEn: true } }),
    ]);

    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });

    // Check if certificate already exists
    const existing = await prisma.certificate.findFirst({
      where: { userId, courseId },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Certificate already issued for this user and course' }, { status: 409 });
    }

    // Generate unique certificate ID
    const certId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const certificate = await prisma.certificate.create({
      data: {
        certificateId: certId,
        userId,
        courseId,
        issuedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, titleAr: true, titleEn: true } },
      },
    });

    // Audit
    createAuditLog({
      userId: tokenData.userId,
      action: 'CERTIFICATE_ISSUED',
      entity: 'Certificate',
      entityId: certificate.id,
      newValue: { userId, courseId, certificateId: certId },
    });

    // Notify user
    try {
      await prisma.notification.create({
        data: {
          userId,
          titleAr: 'تهانينا! حصلت على شهادة',
          titleEn: 'Congratulations! You earned a certificate',
          messageAr: `تم إصدار شهادة إتمام دورة "${course.titleAr}" لك`,
          messageEn: `A certificate for "${course.titleEn}" has been issued to you`,
          type: 'achievement',
        },
      });
    } catch { /* non-critical */ }

    return NextResponse.json({ success: true, data: certificate }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to issue certificate' }, { status: 500 });
  }
}
