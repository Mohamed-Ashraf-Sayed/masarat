import prisma from '@/lib/prisma';

/**
 * Revenue Logic — Section 10
 * Default split: 70% Trainer / 20% Platform / 10% Entity
 * - Configurable by admin via RevenueSettings
 * - 14-day refund buffer before funds become AVAILABLE
 * - Monthly payout cycle
 */

export async function getRevenueSettings() {
  let settings = await prisma.revenueSettings.findFirst();
  if (!settings) {
    // Seed defaults on first call
    settings = await prisma.revenueSettings.create({
      data: {},
    });
  }
  return settings;
}

/**
 * Called when a payment transitions to COMPLETED.
 * Creates a RevenueTransaction splitting the amount by configured ratios.
 */
export async function processRevenueFromPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { course: { select: { instructorId: true, id: true } } },
  });

  if (!payment || !payment.course?.instructorId) return null;

  // Avoid double-processing
  const existing = await prisma.revenueTransaction.findUnique({
    where: { paymentId },
  });
  if (existing) return existing;

  const settings = await getRevenueSettings();

  const total = payment.amount;
  const instructorAmount = +(total * settings.instructorShare).toFixed(2);
  const platformAmount   = +(total * settings.platformShare).toFixed(2);
  // entity gets remainder to avoid floating-point drift
  const entityAmount     = +(total - instructorAmount - platformAmount).toFixed(2);

  // Funds available after refund buffer
  const availableAt = new Date();
  availableAt.setDate(availableAt.getDate() + settings.refundBufferDays);

  const revenue = await prisma.revenueTransaction.create({
    data: {
      paymentId,
      instructorId: payment.course.instructorId,
      courseId: payment.course.id,
      totalAmount: total,
      instructorAmount,
      platformAmount,
      entityAmount,
      status: 'HELD',
      availableAt,
    },
  });

  return revenue;
}

/**
 * Called when a payment is REFUNDED.
 * Marks the associated revenue transaction as REFUNDED.
 */
export async function cancelRevenueForPayment(paymentId: string) {
  const existing = await prisma.revenueTransaction.findUnique({
    where: { paymentId },
  });
  if (!existing || existing.status === 'PAID') return null;

  return prisma.revenueTransaction.update({
    where: { paymentId },
    data: { status: 'REFUNDED' },
  });
}

/**
 * Mark all HELD transactions whose refund buffer has expired as AVAILABLE.
 * Run this via a cron job / scheduled task.
 */
export async function releaseHeldRevenue() {
  const now = new Date();
  const result = await prisma.revenueTransaction.updateMany({
    where: { status: 'HELD', availableAt: { lte: now } },
    data: { status: 'AVAILABLE' },
  });
  return result;
}

/**
 * Get revenue summary for an instructor.
 */
export async function getInstructorRevenueSummary(instructorId: string) {
  const [held, available, paid, refunded] = await Promise.all([
    prisma.revenueTransaction.aggregate({
      where: { instructorId, status: 'HELD' },
      _sum: { instructorAmount: true },
    }),
    prisma.revenueTransaction.aggregate({
      where: { instructorId, status: 'AVAILABLE' },
      _sum: { instructorAmount: true },
    }),
    prisma.revenueTransaction.aggregate({
      where: { instructorId, status: 'PAID' },
      _sum: { instructorAmount: true },
    }),
    prisma.revenueTransaction.aggregate({
      where: { instructorId, status: 'REFUNDED' },
      _sum: { instructorAmount: true },
    }),
  ]);

  return {
    held:      held._sum.instructorAmount      ?? 0,
    available: available._sum.instructorAmount ?? 0,
    paid:      paid._sum.instructorAmount      ?? 0,
    refunded:  refunded._sum.instructorAmount  ?? 0,
    total:     (available._sum.instructorAmount ?? 0) + (held._sum.instructorAmount ?? 0),
  };
}
