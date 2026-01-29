'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Play,
  Clock,
  BookOpen,
  Users,
  Star,
  Award,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Share2,
  Heart,
  Globe,
  PlayCircle,
  FileText,
  Loader2,
  FileQuestion,
} from 'lucide-react';

interface CourseData {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  thumbnail: string;
  price: number;
  originalPrice: number | null;
  level: string;
  duration: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  category: {
    id: string;
    name: { ar: string; en: string };
  };
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
    coursesCount: number;
  };
  lessons: Array<{
    id: string;
    title: { ar: string; en: string };
    duration: number | null;
    isFree: boolean;
    order: number;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
    createdAt: string;
  }>;
  stats: {
    studentsCount: number;
    lessonsCount: number;
    reviewsCount: number;
    rating: number;
  };
}

interface PaymentSettings {
  currency: string;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<string[]>(['section-1']);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({ currency: 'USD' });

  // Currency symbol helper
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      SAR: 'ر.س',
      AED: 'د.إ',
      EGP: 'ج.م',
    };
    return symbols[currency] || currency;
  };

  const currencySymbol = getCurrencySymbol(paymentSettings.currency);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch course and payment settings in parallel
        const [courseResponse, settingsResponse] = await Promise.all([
          fetch(`/api/courses/${id}`),
          fetch('/api/payment-settings'),
        ]);

        const [courseResult, settingsResult] = await Promise.all([
          courseResponse.json(),
          settingsResponse.json(),
        ]);

        if (courseResult.success) {
          setCourse(courseResult.data);
        }

        if (settingsResult.success) {
          setPaymentSettings(settingsResult.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Check if user is enrolled
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user || !token) return;

      try {
        const response = await fetch(`/api/enrollments/check?courseId=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (result.success && result.data.isEnrolled) {
          setIsEnrolled(true);
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
      }
    };

    checkEnrollment();
  }, [user, token, id]);

  const handleEnroll = async () => {
    if (!user || !token) {
      router.push(`/login?redirect=/courses/${id}`);
      return;
    }

    // If course is paid, redirect to checkout
    if (course && course.price > 0) {
      router.push(`/checkout/${id}`);
      return;
    }

    // Free course - enroll directly
    setEnrolling(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: id }),
      });
      const result = await response.json();
      if (result.success) {
        router.push(`/courses/${id}/learn`);
      } else {
        alert(result.error || 'Failed to enroll');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'الدورة غير موجودة' : 'Course not found'}
          </h1>
          <Link href="/courses" className="btn-primary mt-4 inline-block">
            {language === 'ar' ? 'العودة للدورات' : 'Back to Courses'}
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const getLevelText = (level: string) => {
    const levels: { [key: string]: { ar: string; en: string } } = {
      BEGINNER: { ar: 'مبتدئ', en: 'Beginner' },
      INTERMEDIATE: { ar: 'متوسط', en: 'Intermediate' },
      ADVANCED: { ar: 'متقدم', en: 'Advanced' },
    };
    return levels[level]?.[language] || level;
  };

  const tabs = [
    { id: 'overview', label: t('overview') },
    { id: 'curriculum', label: t('curriculum') },
    { id: 'instructor', label: t('instructor') },
    { id: 'reviews', label: t('reviews') },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((sid) => sid !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Group lessons into sections
  const lessonsPerSection = Math.ceil(course.lessons.length / 2) || 1;
  const sections = [
    {
      id: 'section-1',
      title: { ar: 'المقدمة والأساسيات', en: 'Introduction & Basics' },
      lessons: course.lessons.slice(0, lessonsPerSection),
    },
    {
      id: 'section-2',
      title: { ar: 'المفاهيم المتقدمة', en: 'Advanced Concepts' },
      lessons: course.lessons.slice(lessonsPerSection),
    },
  ].filter(section => section.lessons.length > 0);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 1) {
      return language === 'ar' ? 'اليوم' : 'Today';
    }
    if (diffInDays < 7) {
      return language === 'ar' ? `منذ ${diffInDays} يوم` : `${diffInDays} days ago`;
    }
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return language === 'ar' ? `منذ ${weeks} أسبوع` : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(diffInDays / 30);
    return language === 'ar' ? `منذ ${months} شهر` : `${months} month${months > 1 ? 's' : ''} ago`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 text-white">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                <Link href="/" className="hover:text-white">
                  {t('home')}
                </Link>
                <span>/</span>
                <Link href="/courses" className="hover:text-white">
                  {t('courses')}
                </Link>
                <span>/</span>
                <span className="text-gray-300">{course.title[language]}</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {course.isFeatured && (
                  <span className="badge bg-yellow-500 text-white">
                    {language === 'ar' ? 'مميز' : 'Featured'}
                  </span>
                )}
                <span className="badge bg-gray-700 text-gray-200">
                  {getLevelText(course.level)}
                </span>
                <span className="badge bg-primary-600 text-white">
                  {course.category.name[language]}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {course.title[language]}
              </h1>

              {/* Description */}
              <p className="text-gray-300 text-lg mb-6">
                {course.description[language]}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold">{course.stats.rating}</span>
                  <span className="text-gray-400">
                    ({course.stats.reviewsCount.toLocaleString()} {t('reviews')})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>
                    {course.stats.studentsCount.toLocaleString()} {t('students')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <span>{language === 'ar' ? 'عربي' : 'Arabic'}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4">
                <img
                  src={course.instructor.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                  alt={course.instructor.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary-400"
                />
                <div>
                  <p className="text-gray-400 text-sm">
                    {language === 'ar' ? 'المدرب' : 'Instructor'}
                  </p>
                  <p className="font-semibold">{course.instructor.name}</p>
                </div>
              </div>
            </div>

            {/* Course Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-24">
                {/* Video Preview */}
                <div className="relative aspect-video bg-gray-900">
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                    alt={course.title[language]}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors group">
                      <Play className="w-8 h-8 text-primary-600 ms-1 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                  <span className="absolute bottom-4 end-4 bg-black/70 text-white text-sm px-3 py-1 rounded-lg">
                    {language === 'ar' ? 'معاينة مجانية' : 'Free Preview'}
                  </span>
                </div>

                {/* Price & CTA */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {currencySymbol}{course.price}
                    </span>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <>
                        <span className="text-xl text-gray-400 line-through">
                          {currencySymbol}{course.originalPrice}
                        </span>
                        <span className="badge badge-success">
                          {Math.round(
                            ((course.originalPrice - course.price) /
                              course.originalPrice) *
                              100
                          )}
                          % {language === 'ar' ? 'خصم' : 'OFF'}
                        </span>
                      </>
                    )}
                  </div>

                  {isEnrolled ? (
                    <>
                      <Link
                        href={`/courses/${id}/learn`}
                        className="w-full btn-primary mb-3 flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        {language === 'ar' ? 'متابعة التعلم' : 'Continue Learning'}
                      </Link>
                      <Link
                        href={`/courses/${id}/quizzes`}
                        className="w-full btn-secondary mb-3 flex items-center justify-center gap-2"
                      >
                        <FileQuestion className="w-5 h-5" />
                        {language === 'ar' ? 'اختبارات الدورة' : 'Course Quizzes'}
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full btn-primary mb-3 flex items-center justify-center gap-2"
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {language === 'ar' ? 'جاري التسجيل...' : 'Enrolling...'}
                        </>
                      ) : course.price > 0 ? (
                        language === 'ar' ? 'اشتري الآن' : 'Buy Now'
                      ) : (
                        language === 'ar' ? 'سجل مجاناً' : 'Enroll Free'
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isWishlisted ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                    {isWishlisted
                      ? language === 'ar'
                        ? 'في قائمة الرغبات'
                        : 'In Wishlist'
                      : language === 'ar'
                      ? 'أضف للمفضلة'
                      : 'Add to Wishlist'}
                  </button>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    {language === 'ar'
                      ? 'ضمان استرداد المال خلال 30 يوم'
                      : '30-Day Money-Back Guarantee'}
                  </p>

                  {/* Course Includes */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-4">
                      {language === 'ar' ? 'تشمل الدورة' : 'This course includes'}
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-gray-600">
                        <PlayCircle className="w-5 h-5 text-primary-600" />
                        <span>
                          {course.duration} {t('hours')}{' '}
                          {language === 'ar' ? 'فيديو' : 'video'}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 text-gray-600">
                        <BookOpen className="w-5 h-5 text-primary-600" />
                        <span>
                          {course.stats.lessonsCount} {t('lessons')}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 text-gray-600">
                        <FileText className="w-5 h-5 text-primary-600" />
                        <span>
                          {language === 'ar' ? 'ملفات قابلة للتحميل' : 'Downloadable resources'}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 text-gray-600">
                        <Award className="w-5 h-5 text-primary-600" />
                        <span>
                          {language === 'ar' ? 'شهادة إتمام' : 'Certificate of completion'}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 text-gray-600">
                        <Clock className="w-5 h-5 text-primary-600" />
                        <span>
                          {language === 'ar' ? 'وصول مدى الحياة' : 'Lifetime access'}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Share */}
                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center gap-4">
                    <button className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:col-span-2 lg:pe-12">
            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* What You'll Learn */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {t('whatYouLearn')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        language === 'ar' ? 'فهم أساسيات الموضوع بشكل شامل' : 'Understand the fundamentals comprehensively',
                        language === 'ar' ? 'تطبيق المفاهيم في مشاريع حقيقية' : 'Apply concepts in real projects',
                        language === 'ar' ? 'اكتساب مهارات عملية متقدمة' : 'Gain advanced practical skills',
                        language === 'ar' ? 'الحصول على شهادة معتمدة' : 'Get a certified certificate',
                      ].map((outcome, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-green-50 rounded-xl"
                        >
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {t('requirements')}
                    </h3>
                    <ul className="space-y-2">
                      {[
                        language === 'ar' ? 'جهاز كمبيوتر مع اتصال بالإنترنت' : 'A computer with internet connection',
                        language === 'ar' ? 'الرغبة في التعلم والتطوير' : 'Willingness to learn and grow',
                        language === 'ar' ? 'لا يتطلب خبرة سابقة' : 'No prior experience required',
                      ].map((req, index) => (
                        <li key={index} className="flex items-center gap-3 text-gray-600">
                          <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Curriculum Tab */}
              {activeTab === 'curriculum' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-gray-600">
                        {course.stats.lessonsCount} {t('lessons')} •{' '}
                        {course.duration} {t('hours')}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedSections(
                          expandedSections.length === sections.length
                            ? []
                            : sections.map((s) => s.id)
                        )
                      }
                      className="text-primary-600 font-medium hover:underline"
                    >
                      {expandedSections.length === sections.length
                        ? language === 'ar'
                          ? 'طي الكل'
                          : 'Collapse All'
                        : language === 'ar'
                        ? 'توسيع الكل'
                        : 'Expand All'}
                    </button>
                  </div>

                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSections.includes(section.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                          <span className="font-semibold text-gray-900">
                            {section.title[language]}
                          </span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {section.lessons.length} {t('lessons')}
                        </span>
                      </button>

                      {expandedSections.includes(section.id) && (
                        <div className="divide-y divide-gray-100">
                          {section.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {lesson.isFree ? (
                                  <PlayCircle className="w-5 h-5 text-primary-600" />
                                ) : (
                                  <Lock className="w-5 h-5 text-gray-400" />
                                )}
                                <span className="text-gray-700">
                                  {lesson.title[language]}
                                </span>
                                {lesson.isFree && (
                                  <span className="badge badge-primary text-xs">
                                    {language === 'ar' ? 'مجاني' : 'Free'}
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-500 text-sm">
                                {lesson.duration || 0}{' '}
                                {language === 'ar' ? 'دقيقة' : 'min'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Instructor Tab */}
              {activeTab === 'instructor' && (
                <div className="flex items-start gap-6">
                  <img
                    src={course.instructor.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                    alt={course.instructor.name}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {course.instructor.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {course.instructor.bio || (language === 'ar' ? 'مدرب محترف في المجال' : 'Professional instructor')}
                    </p>
                    <div className="flex items-center gap-6 text-gray-500">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span>4.9 {language === 'ar' ? 'تقييم' : 'Rating'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>
                          {course.stats.studentsCount}+ {language === 'ar' ? 'طالب' : 'Students'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        <span>{course.instructor.coursesCount} {language === 'ar' ? 'دورة' : 'Courses'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <div className="flex items-center gap-8 mb-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900 mb-2">
                        {course.stats.rating}
                      </div>
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < Math.round(course.stats.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-500">
                        {course.stats.reviewsCount.toLocaleString()} {t('reviews')}
                      </p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = course.reviews.filter(r => Math.round(r.rating) === stars).length;
                        const percentage = course.reviews.length > 0 ? Math.round((count / course.reviews.length) * 100) : 0;
                        return (
                          <div key={stars} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-3">{stars}</span>
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500 w-10">
                              {percentage}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-6">
                    {course.reviews.length > 0 ? (
                      course.reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6">
                          <div className="flex items-start gap-4">
                            <img
                              src={review.user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50'}
                              alt={review.user.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">
                                  {review.user.name}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  {formatTimeAgo(review.createdAt)}
                                </span>
                              </div>
                              <div className="flex gap-1 mb-2">
                                {[...Array(5)].map((_, j) => (
                                  <Star
                                    key={j}
                                    className={`w-4 h-4 ${j < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              {review.comment && (
                                <p className="text-gray-600">{review.comment}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        {language === 'ar' ? 'لا توجد مراجعات بعد' : 'No reviews yet'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
