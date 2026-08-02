import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/certificates/validate?id=CERT-xxx
 *
 * Section 14.5 — Certificate Public Validation (QR code target)
 * No authentication required — this is the public endpoint that QR codes point to.
 *
 * Returns certificate details if valid, or 404 if not found.
 */
export async function GET(request: NextRequest) {
  try {
    const certId = request.nextUrl.searchParams.get('id');
    if (!certId) {
      return NextResponse.json(
        { success: false, error: 'Certificate ID is required' },
        { status: 400 }
      );
    }

    const certificate = await prisma.certificate.findUnique({
      where: { certificateId: certId },
      include: {
        user: {
          select: { id: true, name: true },
        },
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            instructorId: true,
            instructor: { select: { name: true } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'Certificate not found or has been revoked',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        certificateId: certificate.certificateId,
        issuedAt: certificate.issuedAt,
        holder: { name: certificate.user.name },
        course: {
          titleAr: certificate.course.titleAr,
          titleEn: certificate.course.titleEn,
          instructor: certificate.course.instructor.name,
        },
      },
    });
  } catch (error) {
    console.error('Error validating certificate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate certificate' },
      { status: 500 }
    );
  }
}
