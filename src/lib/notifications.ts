import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendPushToUser } from '@/lib/web-push';

/**
 * Notification Trigger Matrix
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * All system-triggered notifications are defined here (Section 15 Blueprint).
 *
 * Trigger                        → Recipient     → Type               → Channels
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * Course Enrollment              → Student       → enrollment         → in-app, email
 * New Student Enrolled           → Instructor    → new_student        → in-app
 * Payment Successful             → Student       → payment_success    → in-app, email
 * Payment Failed                 → Student       → payment_failed     → in-app, email
 * Refund Processed               → User          → refund             → in-app, email
 * Course Approved / Published    → Instructor    → course_approved    → in-app, email
 * Course Suspended / Unpublished → Instructor    → course_suspended   → in-app, email
 * Course Completed               → Student       → course_completion  → in-app, push
 * Certificate Issued             → Student       → certificate        → in-app, email
 * Quiz Result                    → Student       → quiz_result        → in-app
 * Account Suspended              → User          → account_suspended  → in-app, email
 * Account Reactivated            → User          → account_reactivated→ in-app, email
 * Event Registration             → Student       → enrollment         → in-app, email
 * Competition Joined             → Student       → competition_joined → in-app
 * Order Approved                 → Student       → order_approved     → in-app, email
 * Order Rejected                 → Student       → order_rejected     → in-app, email
 * New Message                    → Recipient     → message            → in-app, push
 * Forum Reply                    → Thread Author → forum_reply        → in-app
 * Badge Earned                   → User          → badge_earned       → in-app, push
 * Level Up                       → User          → level_up           → in-app, push
 * ─────────────────────────────────────────────────────────────────────────────────────────
 */

export type NotificationChannel = 'in-app' | 'email' | 'push';

// ─── Email Template ───────────────────────────────────────────────────────────

function buildNotificationEmail(
  titleAr: string,
  titleEn: string,
  messageAr: string,
  messageEn: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">مسارات</h1>
    </div>
    <div style="padding:32px;direction:rtl;text-align:right;border-bottom:1px solid #eee;">
      <h2 style="color:#111;margin:0 0 12px;">${titleAr}</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0;">${messageAr}</p>
    </div>
    <div style="padding:32px;direction:ltr;text-align:left;">
      <h2 style="color:#111;margin:0 0 12px;">${titleEn}</h2>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0;">${messageEn}</p>
    </div>
    <div style="background:#f8f9fa;padding:16px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#aaa;font-size:12px;margin:0;">© ${new Date().getFullYear()} مسارات — هذا بريد آلي، يرجى عدم الرد.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Core Function ─────────────────────────────────────────────────────────────

export async function createNotification({
  userId,
  titleAr,
  titleEn,
  messageAr,
  messageEn,
  type,
  channels = ['in-app'],
}: {
  userId: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: string;
  channels?: NotificationChannel[];
}) {
  try {
    let notification = null;

    // ── Channel: In-App (stored in DB) ────────────────────────────────────────
    if (channels.includes('in-app')) {
      notification = await prisma.notification.create({
        data: { userId, titleAr, titleEn, messageAr, messageEn, type },
      });
    }

    // ── Channel: Email ────────────────────────────────────────────────────────
    if (channels.includes('email')) {
      prisma.user
        .findUnique({ where: { id: userId }, select: { email: true } })
        .then((user) => {
          if (user?.email) {
            sendEmail({
              to: user.email,
              subject: `${titleAr} / ${titleEn}`,
              html: buildNotificationEmail(titleAr, titleEn, messageAr, messageEn),
            });
          }
        })
        .catch((err) => console.error('[Notification] Email fetch error:', err));
    }

    // ── Channel: Push ─────────────────────────────────────────────────────────
    if (channels.includes('push')) {
      sendPushToUser(userId, { title: titleEn, body: messageEn, tag: type }).catch((err) =>
        console.error('[Notification] Push error:', err)
      );
    }

    return notification;
  } catch (error) {
    // Non-blocking: notification failure should not break the main flow
    console.error('[Notification] Failed:', error);
    return null;
  }
}

// ─── Student / User Triggers ───────────────────────────────────────────────────

/** Course Enrollment → Student | in-app + email */
export async function notifyEnrollment(userId: string, courseTitle: string) {
  return createNotification({
    userId,
    titleAr: 'تم التسجيل في الدورة',
    titleEn: 'Course Enrollment Confirmed',
    messageAr: `تم تسجيلك بنجاح في دورة "${courseTitle}"`,
    messageEn: `You have been successfully enrolled in "${courseTitle}"`,
    type: 'enrollment',
    channels: ['in-app', 'email'],
  });
}

/** Course Completed → Student | in-app + push */
export async function notifyCourseCompletion(userId: string, courseTitle: string) {
  return createNotification({
    userId,
    titleAr: 'أكملت الدورة بنجاح 🎉',
    titleEn: 'Course Completed 🎉',
    messageAr: `تهانينا! لقد أتممت دورة "${courseTitle}" بنجاح`,
    messageEn: `Congratulations! You have successfully completed "${courseTitle}"`,
    type: 'course_completion',
    channels: ['in-app', 'push'],
  });
}

/** Certificate Issued → Student | in-app + email */
export async function notifyCertificate(userId: string, courseTitle: string) {
  return createNotification({
    userId,
    titleAr: 'شهادتك جاهزة 📜',
    titleEn: 'Certificate Issued 📜',
    messageAr: `تم إصدار شهادة إتمام دورة "${courseTitle}" — يمكنك تنزيلها الآن`,
    messageEn: `Your certificate for "${courseTitle}" has been issued — download it now`,
    type: 'certificate',
    channels: ['in-app', 'email'],
  });
}

/** Quiz Result → Student | in-app only */
export async function notifyQuizResult(
  userId: string,
  quizTitle: string,
  passed: boolean,
  score: number
) {
  return createNotification({
    userId,
    titleAr: passed ? 'اجتزت الاختبار بنجاح ✅' : 'نتيجة الاختبار',
    titleEn: passed ? 'Quiz Passed ✅' : 'Quiz Result',
    messageAr: `حصلت على ${score}% في اختبار "${quizTitle}"${passed ? ' — مبروك!' : ''}`,
    messageEn: `You scored ${score}% in "${quizTitle}"${passed ? ' — Congratulations!' : ''}`,
    type: 'quiz_result',
    channels: ['in-app'],
  });
}

/** Payment Successful → Student | in-app + email */
export async function notifyPaymentSuccess(userId: string, itemTitle: string, amount: number) {
  return createNotification({
    userId,
    titleAr: 'تم الدفع بنجاح ✅',
    titleEn: 'Payment Successful ✅',
    messageAr: `تمت عملية الدفع بنجاح لـ "${itemTitle}" بمبلغ $${amount.toFixed(2)}`,
    messageEn: `Payment of $${amount.toFixed(2)} for "${itemTitle}" was successful`,
    type: 'payment_success',
    channels: ['in-app', 'email'],
  });
}

/** Payment Failed → Student | in-app + email */
export async function notifyPaymentFailed(userId: string, itemTitle: string) {
  return createNotification({
    userId,
    titleAr: 'فشلت عملية الدفع ❌',
    titleEn: 'Payment Failed ❌',
    messageAr: `فشلت عملية الدفع لـ "${itemTitle}". يرجى التحقق من بياناتك والمحاولة مرة أخرى`,
    messageEn: `Payment for "${itemTitle}" failed. Please check your details and try again`,
    type: 'payment_failed',
    channels: ['in-app', 'email'],
  });
}

/** Refund Processed → User | in-app + email */
export async function notifyRefundProcessed(userId: string, itemTitle: string, amount: number) {
  return createNotification({
    userId,
    titleAr: 'تم معالجة الاسترداد',
    titleEn: 'Refund Processed',
    messageAr: `تمت معالجة استرداد مبلغ $${amount.toFixed(2)} لـ "${itemTitle}"`,
    messageEn: `A refund of $${amount.toFixed(2)} for "${itemTitle}" has been processed`,
    type: 'refund',
    channels: ['in-app', 'email'],
  });
}

/** Account Suspended → User | in-app + email */
export async function notifyAccountSuspended(userId: string) {
  return createNotification({
    userId,
    titleAr: 'تم تعليق حسابك',
    titleEn: 'Account Suspended',
    messageAr: 'تم تعليق حسابك مؤقتاً. يرجى التواصل مع الدعم للاستفسار',
    messageEn: 'Your account has been suspended. Please contact support for more information',
    type: 'account_suspended',
    channels: ['in-app', 'email'],
  });
}

/** Account Reactivated → User | in-app + email */
export async function notifyAccountReactivated(userId: string) {
  return createNotification({
    userId,
    titleAr: 'تم تفعيل حسابك',
    titleEn: 'Account Reactivated',
    messageAr: 'تم تفعيل حسابك بنجاح — أهلاً بك مجدداً!',
    messageEn: 'Your account has been reactivated — Welcome back!',
    type: 'account_reactivated',
    channels: ['in-app', 'email'],
  });
}

/** Competition Joined → Student | in-app only */
export async function notifyCompetitionJoined(userId: string, competitionTitle: string) {
  return createNotification({
    userId,
    titleAr: 'انضممت للمسابقة',
    titleEn: 'Competition Joined',
    messageAr: `تم تسجيلك بنجاح في مسابقة "${competitionTitle}"`,
    messageEn: `You have successfully joined the competition "${competitionTitle}"`,
    type: 'competition_joined',
    channels: ['in-app'],
  });
}

/** Order Approved → Student | in-app + email */
export async function notifyOrderApproved(userId: string, orderTitle: string) {
  return createNotification({
    userId,
    titleAr: 'تمت الموافقة على طلبك ✅',
    titleEn: 'Order Approved ✅',
    messageAr: `تمت الموافقة على طلبك "${orderTitle}" — يمكنك الوصول إليه الآن`,
    messageEn: `Your order "${orderTitle}" has been approved — you can now access it`,
    type: 'order_approved',
    channels: ['in-app', 'email'],
  });
}

/** Order Rejected → Student | in-app + email */
export async function notifyOrderRejected(userId: string, orderTitle: string, reason?: string) {
  return createNotification({
    userId,
    titleAr: 'تم رفض طلبك',
    titleEn: 'Order Rejected',
    messageAr: `تم رفض طلبك "${orderTitle}"${reason ? ` — السبب: ${reason}` : ''}`,
    messageEn: `Your order "${orderTitle}" has been rejected${reason ? ` — Reason: ${reason}` : ''}`,
    type: 'order_rejected',
    channels: ['in-app', 'email'],
  });
}

/** New Message → Recipient | in-app + push */
export async function notifyNewMessage(userId: string, senderName: string) {
  return createNotification({
    userId,
    titleAr: 'رسالة جديدة',
    titleEn: 'New Message',
    messageAr: `لديك رسالة جديدة من "${senderName}"`,
    messageEn: `You have a new message from "${senderName}"`,
    type: 'message',
    channels: ['in-app', 'push'],
  });
}

/** Forum Reply → Thread Author | in-app only */
export async function notifyForumReply(userId: string, threadTitle: string, replierName: string) {
  return createNotification({
    userId,
    titleAr: 'رد جديد على موضوعك',
    titleEn: 'New Reply on Your Thread',
    messageAr: `قام "${replierName}" بالرد على موضوعك "${threadTitle}"`,
    messageEn: `"${replierName}" replied to your thread "${threadTitle}"`,
    type: 'forum_reply',
    channels: ['in-app'],
  });
}

/** Badge Earned → User | in-app + push */
export async function notifyBadgeEarned(userId: string, badgeName: string) {
  return createNotification({
    userId,
    titleAr: 'حصلت على شارة جديدة 🏅',
    titleEn: 'Badge Earned 🏅',
    messageAr: `تهانينا! حصلت على شارة "${badgeName}"`,
    messageEn: `Congratulations! You earned the "${badgeName}" badge`,
    type: 'badge_earned',
    channels: ['in-app', 'push'],
  });
}

/** Level Up → User | in-app + push */
export async function notifyLevelUp(userId: string, newLevel: number) {
  return createNotification({
    userId,
    titleAr: 'ارتقيت مستوى جديد 🚀',
    titleEn: 'Level Up 🚀',
    messageAr: `مبروك! لقد وصلت إلى المستوى ${newLevel}`,
    messageEn: `Congratulations! You reached Level ${newLevel}`,
    type: 'level_up',
    channels: ['in-app', 'push'],
  });
}

// ─── Instructor Triggers ────────────────────────────────────────────────────────

/** New Student Enrolled in Instructor's Course → Instructor | in-app only */
export async function notifyInstructorNewStudent(
  instructorId: string,
  studentName: string,
  courseTitle: string
) {
  return createNotification({
    userId: instructorId,
    titleAr: 'طالب جديد في دورتك',
    titleEn: 'New Student Enrolled',
    messageAr: `قام "${studentName}" بالتسجيل في دورتك "${courseTitle}"`,
    messageEn: `"${studentName}" has enrolled in your course "${courseTitle}"`,
    type: 'new_student',
    channels: ['in-app'],
  });
}

/** Course Approved / Published → Instructor | in-app + email */
export async function notifyCourseApproved(instructorId: string, courseTitle: string) {
  return createNotification({
    userId: instructorId,
    titleAr: 'تمت الموافقة على دورتك ✅',
    titleEn: 'Course Approved ✅',
    messageAr: `تمت الموافقة على دورتك "${courseTitle}" ونشرها للطلاب`,
    messageEn: `Your course "${courseTitle}" has been approved and published`,
    type: 'course_approved',
    channels: ['in-app', 'email'],
  });
}

/** Course Suspended / Unpublished → Instructor | in-app + email */
export async function notifyCourseSuspended(instructorId: string, courseTitle: string) {
  return createNotification({
    userId: instructorId,
    titleAr: 'تم تعليق دورتك',
    titleEn: 'Course Suspended',
    messageAr: `تم تعليق دورتك "${courseTitle}" مؤقتاً من قِبل الإدارة`,
    messageEn: `Your course "${courseTitle}" has been suspended by the administration`,
    type: 'course_suspended',
    channels: ['in-app', 'email'],
  });
}

/** Course Submitted for Review → Admin (notification goes to userId of an admin)
 *  Trigger: Instructor submits course | in-app only
 *  Note: Call with an admin's userId to notify them */
export async function notifyCourseSubmittedToAdmin(adminId: string, courseTitle: string, instructorName: string) {
  return createNotification({
    userId: adminId,
    titleAr: 'دورة جديدة بانتظار المراجعة',
    titleEn: 'New Course Awaiting Review',
    messageAr: `قام "${instructorName}" بتقديم دورة "${courseTitle}" للمراجعة والنشر`,
    messageEn: `"${instructorName}" submitted "${courseTitle}" for your review`,
    type: 'course_submitted',
    channels: ['in-app'],
  });
}

/** Course Rejected (sent back to DRAFT) → Instructor | in-app + email */
export async function notifyCourseRejected(instructorId: string, courseTitle: string, reason?: string) {
  return createNotification({
    userId: instructorId,
    titleAr: 'تم إعادة دورتك للمراجعة',
    titleEn: 'Course Returned for Revision',
    messageAr: `تم إعادة دورتك "${courseTitle}" للتعديل${reason ? ` — الملاحظة: ${reason}` : ''}`,
    messageEn: `Your course "${courseTitle}" has been returned for revision${reason ? ` — Note: ${reason}` : ''}`,
    type: 'course_rejected',
    channels: ['in-app', 'email'],
  });
}
