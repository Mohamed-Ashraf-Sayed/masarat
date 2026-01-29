import prisma from '@/lib/prisma';

// Helper function to create notification
export async function createNotification({
  userId,
  titleAr,
  titleEn,
  messageAr,
  messageEn,
  type,
}: {
  userId: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: string;
}) {
  return prisma.notification.create({
    data: {
      userId,
      titleAr,
      titleEn,
      messageAr,
      messageEn,
      type,
    },
  });
}

// إنشاء إشعار عند التسجيل في كورس
export async function notifyEnrollment(userId: string, courseTitle: string) {
  return createNotification({
    userId,
    titleAr: 'تسجيل جديد',
    titleEn: 'New Enrollment',
    messageAr: `تم تسجيلك بنجاح في كورس "${courseTitle}"`,
    messageEn: `You have been successfully enrolled in "${courseTitle}"`,
    type: 'enrollment',
  });
}

// إنشاء إشعار عند اكتمال الكورس
export async function notifyCourseCompletion(userId: string, courseTitle: string) {
  return createNotification({
    userId,
    titleAr: 'تهانينا! 🎉',
    titleEn: 'Congratulations! 🎉',
    messageAr: `لقد أكملت كورس "${courseTitle}" بنجاح`,
    messageEn: `You have successfully completed "${courseTitle}"`,
    type: 'course_completion',
  });
}

// إنشاء إشعار عند الحصول على شهادة
export async function notifyCertificate(userId: string, courseTitle: string) {
  return createNotification({
    userId,
    titleAr: 'شهادة جديدة 📜',
    titleEn: 'New Certificate 📜',
    messageAr: `تم إصدار شهادتك لكورس "${courseTitle}"`,
    messageEn: `Your certificate for "${courseTitle}" has been issued`,
    type: 'certificate',
  });
}

// إنشاء إشعار عند نتيجة اختبار
export async function notifyQuizResult(userId: string, quizTitle: string, passed: boolean, score: number) {
  return createNotification({
    userId,
    titleAr: passed ? 'نجحت في الاختبار! ✅' : 'نتيجة الاختبار',
    titleEn: passed ? 'Quiz Passed! ✅' : 'Quiz Result',
    messageAr: `حصلت على ${score}% في اختبار "${quizTitle}"`,
    messageEn: `You scored ${score}% in "${quizTitle}" quiz`,
    type: 'quiz_result',
  });
}
