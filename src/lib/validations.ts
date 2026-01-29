import { z } from 'zod';

// =====================================================
// Auth Validations
// =====================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صالح'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'الاسم مطلوب')
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً'),
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صالح'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صالح'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'التوكن مطلوب'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً'),
  confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمة المرور غير متطابقة',
  path: ['confirmPassword'],
});

// =====================================================
// User Validations
// =====================================================

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
    .max(100, 'الاسم طويل جداً')
    .optional(),
  phone: z
    .string()
    .regex(/^[+]?[\d\s-]{8,20}$/, 'رقم الهاتف غير صالح')
    .optional()
    .nullable(),
  bio: z.string().max(500, 'النبذة طويلة جداً').optional().nullable(),
  avatar: z.string().url('رابط الصورة غير صالح').optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z
    .string()
    .min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
    .max(100, 'كلمة المرور طويلة جداً'),
  confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمة المرور غير متطابقة',
  path: ['confirmPassword'],
});

// =====================================================
// Course Validations
// =====================================================

export const createCourseSchema = z.object({
  titleAr: z.string().min(1, 'العنوان بالعربية مطلوب').max(200),
  titleEn: z.string().min(1, 'العنوان بالإنجليزية مطلوب').max(200),
  descriptionAr: z.string().min(1, 'الوصف بالعربية مطلوب'),
  descriptionEn: z.string().min(1, 'الوصف بالإنجليزية مطلوب'),
  categoryId: z.string().min(1, 'التصنيف مطلوب'),
  price: z.number().min(0, 'السعر يجب أن يكون 0 أو أكثر').optional(),
  originalPrice: z.number().min(0).optional().nullable(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  thumbnail: z.string().url('رابط الصورة غير صالح').optional().nullable(),
});

export const updateCourseSchema = createCourseSchema.partial();

// =====================================================
// Lesson Validations
// =====================================================

export const createLessonSchema = z.object({
  titleAr: z.string().min(1, 'العنوان بالعربية مطلوب').max(200),
  titleEn: z.string().min(1, 'العنوان بالإنجليزية مطلوب').max(200),
  description: z.string().optional().nullable(),
  videoUrl: z.string().url('رابط الفيديو غير صالح').optional().nullable(),
  duration: z.number().min(0).optional(),
  order: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  courseId: z.string().min(1, 'الكورس مطلوب'),
});

export const updateLessonSchema = createLessonSchema.partial().omit({ courseId: true });

// =====================================================
// Review Validations
// =====================================================

export const createReviewSchema = z.object({
  rating: z.number().min(1, 'التقييم مطلوب').max(5, 'التقييم يجب أن يكون بين 1 و 5'),
  comment: z.string().max(1000, 'التعليق طويل جداً').optional().nullable(),
  courseId: z.string().min(1, 'الكورس مطلوب'),
});

// =====================================================
// Comment Validations
// =====================================================

export const createCommentSchema = z.object({
  content: z.string().min(1, 'التعليق مطلوب').max(2000, 'التعليق طويل جداً'),
  lessonId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
}).refine((data) => data.lessonId || data.courseId, {
  message: 'يجب تحديد الدرس أو الكورس',
});

// =====================================================
// Quiz Validations
// =====================================================

export const createQuizSchema = z.object({
  titleAr: z.string().min(1, 'العنوان بالعربية مطلوب').max(200),
  titleEn: z.string().min(1, 'العنوان بالإنجليزية مطلوب').max(200),
  descriptionAr: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  courseId: z.string().min(1, 'الكورس مطلوب'),
  lessonId: z.string().optional().nullable(),
  passingScore: z.number().min(0).max(100).optional(),
  timeLimit: z.number().min(0).optional().nullable(),
  maxAttempts: z.number().min(1).optional().nullable(),
  shuffleQuestions: z.boolean().optional(),
  showResults: z.boolean().optional(),
});

export const submitQuizSchema = z.object({
  quizId: z.string().min(1, 'الاختبار مطلوب'),
  answers: z.record(z.string(), z.string()).refine(
    (answers) => Object.keys(answers).length > 0,
    'يجب الإجابة على سؤال واحد على الأقل'
  ),
});

// =====================================================
// Coupon Validations
// =====================================================

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'كود الكوبون يجب أن يكون 3 أحرف على الأقل')
    .max(50, 'كود الكوبون طويل جداً')
    .regex(/^[A-Z0-9_-]+$/i, 'كود الكوبون يجب أن يحتوي على حروف وأرقام فقط'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().min(0, 'قيمة الخصم يجب أن تكون 0 أو أكثر'),
  maxUses: z.number().min(1).optional().nullable(),
  minPurchase: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional().nullable(),
  courseId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// =====================================================
// Contact Validations
// =====================================================

export const contactSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب').max(100),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  subject: z.string().min(1, 'الموضوع مطلوب').max(200),
  message: z.string().min(10, 'الرسالة قصيرة جداً').max(5000, 'الرسالة طويلة جداً'),
});

// =====================================================
// Pagination & Query Validations
// =====================================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =====================================================
// ID Validation Helper
// =====================================================

export const idSchema = z.object({
  id: z.string().min(1, 'المعرف مطلوب'),
});

// =====================================================
// Helper function to validate and parse
// =====================================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Format Zod errors for API response
export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(', ');
}

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
