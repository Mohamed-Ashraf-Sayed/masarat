import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tokenData = getUserFromToken(request);

    if (!tokenData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: {
          select: {
            titleAr: true, titleEn: true, duration: true, certificateTemplate: true,
            ceuCount: true, generalCeus: true, supervisionCeus: true, ethicsCeus: true,
            eventModality: true, providerNumber: true,
            instructor: { select: { name: true } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    if (certificate.userId !== tokenData.userId && tokenData.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Get enrollment for start date
    let startDate = '';
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: certificate.userId,
            courseId: certificate.courseId,
          },
        },
      });
      if (enrollment) {
        startDate = new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
          day: '2-digit', month: 'long', year: 'numeric',
        });
      }
    } catch {
      // No enrollment found, skip start date
    }

    const completedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    const certNumber = certificate.certificateId.replace('CERT-', '').split('-')[0];
    const trainingHours = certificate.course.duration || 0;

    // Use child process to generate PDF
    const certPayload = JSON.stringify({
      studentName: certificate.user.name,
      certNumber,
      courseEn: certificate.course.titleEn,
      completedDate,
      startDate,
      trainingHours,
      template: certificate.certificateTemplate || certificate.course.certificateTemplate || 'QABA',
      ceuCount: certificate.course.ceuCount || 0,
      generalCeus: certificate.course.generalCeus || 0,
      supervisionCeus: certificate.course.supervisionCeus || 0,
      ethicsCeus: certificate.course.ethicsCeus || 0,
      eventModality: certificate.course.eventModality || 'Online Zoom',
      providerNumber: certificate.course.providerNumber || 'QCB-6529',
    });

    const pdfBuffer = execSync(
      `node scripts/generate-certificate.js`,
      { input: certPayload, maxBuffer: 10 * 1024 * 1024, cwd: process.cwd() }
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificateId}.pdf"`,
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error generating certificate:', errMsg);
    return NextResponse.json({ success: false, error: 'Failed to generate certificate' }, { status: 500 });
  }
}
