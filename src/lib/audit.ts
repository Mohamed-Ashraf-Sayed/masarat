import prisma from '@/lib/prisma';

/**
 * Audit Log Utility — Section 9
 * Records privileged admin actions (user suspend/delete, course approve/reject, etc.)
 * Fire-and-forget — never blocks the main request.
 */

export interface AuditOptions {
  userId?: string;        // actor (admin performing the action)
  action: string;         // e.g. 'COURSE_APPROVED', 'USER_SUSPENDED'
  entity: string;         // model name: 'Course', 'User', 'Payment', ...
  entityId?: string;      // record ID being acted upon
  oldValue?: unknown;     // state before change
  newValue?: unknown;     // state after change
  ipAddress?: string;
  userAgent?: string;
}

export function createAuditLog(options: AuditOptions): void {
  const { userId, action, entity, entityId, oldValue, newValue, ipAddress, userAgent } = options;

  prisma.auditLog
    .create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : undefined,
        newValue: newValue !== undefined ? JSON.stringify(newValue) : undefined,
        ipAddress,
        userAgent,
      },
    })
    .catch((err) => console.error('[AuditLog] Failed to write:', err));
}

// ── Convenience helpers for common audit events ──────────────────────────────

export function auditCourseApproved(adminId: string, courseId: string, oldStatus: string) {
  createAuditLog({ userId: adminId, action: 'COURSE_APPROVED', entity: 'Course', entityId: courseId, oldValue: { status: oldStatus }, newValue: { status: 'APPROVED' } });
}

export function auditCourseRejected(adminId: string, courseId: string, reason?: string) {
  createAuditLog({ userId: adminId, action: 'COURSE_REJECTED', entity: 'Course', entityId: courseId, newValue: { status: 'DRAFT', reason } });
}

export function auditCoursePublished(adminId: string, courseId: string) {
  createAuditLog({ userId: adminId, action: 'COURSE_PUBLISHED', entity: 'Course', entityId: courseId, newValue: { status: 'PUBLISHED' } });
}

export function auditCourseSuspended(adminId: string, courseId: string) {
  createAuditLog({ userId: adminId, action: 'COURSE_SUSPENDED', entity: 'Course', entityId: courseId, newValue: { status: 'SUSPENDED' } });
}

export function auditUserSuspended(adminId: string, targetUserId: string) {
  createAuditLog({ userId: adminId, action: 'USER_SUSPENDED', entity: 'User', entityId: targetUserId, newValue: { isActive: false, status: 'SUSPENDED' } });
}

export function auditUserDeleted(adminId: string, targetUserId: string, hard: boolean) {
  createAuditLog({ userId: adminId, action: hard ? 'USER_HARD_DELETED' : 'USER_SOFT_DELETED', entity: 'User', entityId: targetUserId, newValue: { isDeleted: true } });
}

export function auditPaymentApproved(adminId: string, paymentId: string, amount: number) {
  createAuditLog({ userId: adminId, action: 'PAYMENT_APPROVED', entity: 'Payment', entityId: paymentId, newValue: { status: 'COMPLETED', amount } });
}

export function auditPaymentRefunded(adminId: string, paymentId: string, amount: number) {
  createAuditLog({ userId: adminId, action: 'PAYMENT_REFUNDED', entity: 'Payment', entityId: paymentId, newValue: { status: 'REFUNDED', amount } });
}

export function auditRevenueSettingsUpdated(adminId: string, oldSettings: unknown, newSettings: unknown) {
  createAuditLog({ userId: adminId, action: 'REVENUE_SETTINGS_UPDATED', entity: 'RevenueSettings', oldValue: oldSettings, newValue: newSettings });
}
