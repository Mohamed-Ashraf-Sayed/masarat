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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = getUserFromToken(request);
    if (!tokenData || !['ADMIN', 'SUPER_ADMIN'].includes(tokenData.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });

    await prisma.certificate.delete({ where: { id } });

    createAuditLog({
      userId: tokenData.userId,
      action: 'CERTIFICATE_REVOKED',
      entity: 'Certificate',
      entityId: id,
      oldValue: { certificateId: cert.certificateId },
    });

    return NextResponse.json({ success: true, message: 'Certificate revoked' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to revoke certificate' }, { status: 500 });
  }
}
