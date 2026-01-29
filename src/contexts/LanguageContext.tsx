'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface Translations {
  [key: string]: {
    ar: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { ar: 'الرئيسية', en: 'Home' },
  courses: { ar: 'الدورات', en: 'Courses' },
  instructors: { ar: 'المدربين', en: 'Instructors' },
  pricing: { ar: 'الأسعار', en: 'Pricing' },
  about: { ar: 'عن المنصة', en: 'About' },
  store: { ar: 'المتجر', en: 'Store' },
  contact: { ar: 'تواصل معنا', en: 'Contact' },
  login: { ar: 'تسجيل الدخول', en: 'Login' },
  register: { ar: 'إنشاء حساب', en: 'Sign Up' },
  logout: { ar: 'تسجيل الخروج', en: 'Logout' },

  // Hero Section
  heroTitle: { ar: 'تعلم مهارات المستقبل', en: 'Learn Future Skills' },
  heroSubtitle: {
    ar: 'منصة تعليمية متكاملة تقدم لك أفضل الدورات من خبراء متخصصين في مختلف المجالات',
    en: 'A comprehensive educational platform offering the best courses from expert instructors in various fields'
  },
  startLearning: { ar: 'ابدأ التعلم الآن', en: 'Start Learning Now' },
  exploreCourses: { ar: 'استكشف الدورات', en: 'Explore Courses' },

  // Stats
  students: { ar: 'طالب', en: 'Students' },
  coursesCount: { ar: 'دورة', en: 'Courses' },
  instructorsCount: { ar: 'مدرب', en: 'Instructors' },
  certificates: { ar: 'شهادة', en: 'Certificates' },

  // Features
  featuresTitle: { ar: 'لماذا تختار منصتنا؟', en: 'Why Choose Our Platform?' },
  feature1Title: { ar: 'محتوى عالي الجودة', en: 'High Quality Content' },
  feature1Desc: {
    ar: 'دورات احترافية مُعدة من قبل خبراء في مجالاتهم',
    en: 'Professional courses prepared by experts in their fields'
  },
  feature2Title: { ar: 'شهادات معتمدة', en: 'Certified Credentials' },
  feature2Desc: {
    ar: 'احصل على شهادات معتمدة بعد إتمام كل دورة',
    en: 'Get certified credentials after completing each course'
  },
  feature3Title: { ar: 'تعلم في أي وقت', en: 'Learn Anytime' },
  feature3Desc: {
    ar: 'وصول غير محدود للمحتوى على مدار الساعة',
    en: 'Unlimited access to content 24/7'
  },
  feature4Title: { ar: 'دعم مستمر', en: 'Continuous Support' },
  feature4Desc: {
    ar: 'فريق دعم متخصص للإجابة على استفساراتك',
    en: 'Specialized support team to answer your questions'
  },

  // Categories
  categoriesTitle: { ar: 'تصفح حسب التخصص', en: 'Browse by Category' },
  programming: { ar: 'البرمجة', en: 'Programming' },
  design: { ar: 'التصميم', en: 'Design' },
  marketing: { ar: 'التسويق', en: 'Marketing' },
  business: { ar: 'إدارة الأعمال', en: 'Business' },
  languages: { ar: 'اللغات', en: 'Languages' },
  dataScience: { ar: 'علوم البيانات', en: 'Data Science' },

  // Courses
  popularCourses: { ar: 'الدورات الأكثر شعبية', en: 'Most Popular Courses' },
  allCourses: { ar: 'جميع الدورات', en: 'All Courses' },
  enrollNow: { ar: 'سجل الآن', en: 'Enroll Now' },
  enrolled: { ar: 'مسجل', en: 'Enrolled' },
  lessons: { ar: 'درس', en: 'Lessons' },
  hours: { ar: 'ساعة', en: 'Hours' },
  level: { ar: 'المستوى', en: 'Level' },
  beginner: { ar: 'مبتدئ', en: 'Beginner' },
  intermediate: { ar: 'متوسط', en: 'Intermediate' },
  advanced: { ar: 'متقدم', en: 'Advanced' },
  free: { ar: 'مجاني', en: 'Free' },

  // Testimonials
  testimonialsTitle: { ar: 'آراء طلابنا', en: 'Student Testimonials' },

  // CTA
  ctaTitle: { ar: 'ابدأ رحلة التعلم اليوم', en: 'Start Your Learning Journey Today' },
  ctaSubtitle: {
    ar: 'انضم إلى آلاف الطلاب واكتسب مهارات جديدة',
    en: 'Join thousands of students and acquire new skills'
  },

  // Footer
  quickLinks: { ar: 'روابط سريعة', en: 'Quick Links' },
  support: { ar: 'الدعم', en: 'Support' },
  helpCenter: { ar: 'مركز المساعدة', en: 'Help Center' },
  faq: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
  privacyPolicy: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
  terms: { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  allRightsReserved: { ar: 'جميع الحقوق محفوظة', en: 'All Rights Reserved' },

  // Auth
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  confirmPassword: { ar: 'تأكيد كلمة المرور', en: 'Confirm Password' },
  fullName: { ar: 'الاسم الكامل', en: 'Full Name' },
  rememberMe: { ar: 'تذكرني', en: 'Remember me' },
  forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
  noAccount: { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
  hasAccount: { ar: 'لديك حساب؟', en: 'Already have an account?' },
  orContinueWith: { ar: 'أو تابع مع', en: 'Or continue with' },

  // Dashboard
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
  myCourses: { ar: 'دوراتي', en: 'My Courses' },
  progress: { ar: 'التقدم', en: 'Progress' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  profile: { ar: 'الملف الشخصي', en: 'Profile' },
  notifications: { ar: 'الإشعارات', en: 'Notifications' },

  // Course Detail
  courseContent: { ar: 'محتوى الدورة', en: 'Course Content' },
  overview: { ar: 'نظرة عامة', en: 'Overview' },
  curriculum: { ar: 'المنهج', en: 'Curriculum' },
  instructor: { ar: 'المدرب', en: 'Instructor' },
  reviews: { ar: 'التقييمات', en: 'Reviews' },
  whatYouLearn: { ar: 'ماذا ستتعلم', en: 'What You Will Learn' },
  requirements: { ar: 'المتطلبات', en: 'Requirements' },

  // Pricing
  pricingTitle: { ar: 'خطط الاشتراك', en: 'Subscription Plans' },
  monthly: { ar: 'شهري', en: 'Monthly' },
  yearly: { ar: 'سنوي', en: 'Yearly' },
  basicPlan: { ar: 'الخطة الأساسية', en: 'Basic Plan' },
  proPlan: { ar: 'الخطة الاحترافية', en: 'Pro Plan' },
  enterprisePlan: { ar: 'خطة المؤسسات', en: 'Enterprise Plan' },
  subscribe: { ar: 'اشترك الآن', en: 'Subscribe Now' },

  // Admin
  adminDashboard: { ar: 'لوحة الإدارة', en: 'Admin Dashboard' },
  users: { ar: 'المستخدمين', en: 'Users' },
  analytics: { ar: 'الإحصائيات', en: 'Analytics' },
  revenue: { ar: 'الإيرادات', en: 'Revenue' },
  addCourse: { ar: 'إضافة دورة', en: 'Add Course' },
  editCourse: { ar: 'تعديل الدورة', en: 'Edit Course' },
  deleteCourse: { ar: 'حذف الدورة', en: 'Delete Course' },

  // Quiz
  quiz: { ar: 'اختبار', en: 'Quiz' },
  startQuiz: { ar: 'ابدأ الاختبار', en: 'Start Quiz' },
  submitQuiz: { ar: 'إرسال الإجابات', en: 'Submit Answers' },
  yourScore: { ar: 'نتيجتك', en: 'Your Score' },
  passed: { ar: 'ناجح', en: 'Passed' },
  failed: { ar: 'راسب', en: 'Failed' },
  tryAgain: { ar: 'حاول مرة أخرى', en: 'Try Again' },

  // Certificate
  certificate: { ar: 'شهادة', en: 'Certificate' },
  downloadCertificate: { ar: 'تحميل الشهادة', en: 'Download Certificate' },
  shareCertificate: { ar: 'مشاركة الشهادة', en: 'Share Certificate' },

  // Live
  liveSession: { ar: 'جلسة مباشرة', en: 'Live Session' },
  joinLive: { ar: 'انضم للبث', en: 'Join Live' },
  upcoming: { ar: 'قادم', en: 'Upcoming' },

  // Search
  search: { ar: 'بحث', en: 'Search' },
  searchPlaceholder: { ar: 'ابحث عن دورة...', en: 'Search for a course...' },
  noResults: { ar: 'لا توجد نتائج', en: 'No results found' },

  // Common
  loading: { ar: 'جاري التحميل...', en: 'Loading...' },
  save: { ar: 'حفظ', en: 'Save' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  delete: { ar: 'حذف', en: 'Delete' },
  edit: { ar: 'تعديل', en: 'Edit' },
  view: { ar: 'عرض', en: 'View' },
  back: { ar: 'رجوع', en: 'Back' },
  next: { ar: 'التالي', en: 'Next' },
  previous: { ar: 'السابق', en: 'Previous' },
  complete: { ar: 'مكتمل', en: 'Complete' },
  inProgress: { ar: 'قيد التقدم', en: 'In Progress' },
  notStarted: { ar: 'لم يبدأ', en: 'Not Started' },
};

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');
  const [direction, setDirection] = useState<Direction>('rtl');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguageState(savedLang);
      setDirection(savedLang === 'ar' ? 'rtl' : 'ltr');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setDirection(lang === 'ar' ? 'rtl' : 'ltr');
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
