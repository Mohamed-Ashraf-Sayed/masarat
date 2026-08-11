'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ikUrl } from '@/lib/imagekit';
import {
  BookOpen,
  Users,
  Star,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BarChart3,
  MessageSquare,
} from 'lucide-react';

interface InstructorData {
  stats: {
    totalCourses: number;
    totalStudents: number;
    totalLessons: number;
    totalReviews: number;
    averageRating: number;
    totalRevenue: number;
  };
  courses: Array<{
    id: string;
    title: { ar: string; en: string };
    thumbnail: string;
    price: number;
    level: string;
    isPublished: boolean;
    isFeatured: boolean;
    category: {
      id: string;
      name: { ar: string; en: string };
    };
    stats: {
      studentsCount: number;
      lessonsCount: number;
      reviewsCount: number;
      rating: number;
      duration: number;
    };
    createdAt: string;
  }>;
  recentEnrollments: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
    course: {
      id: string;
      title: { ar: string; en: string };
    };
    enrolledAt: string;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
    course: {
      id: string;
      title: { ar: string; en: string };
    };
    createdAt: string;
  }>;
}

export default function InstructorDashboardPage() {
  const { language, direction } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const Arrow = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const [data, setData] = useState<InstructorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    const fetchDashboard = async () => {
      if (!token) return;

      try {
        const response = await fetch('/api/instructor/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching instructor dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, token, router]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return language === 'ar' ? `منذ ${diffInMinutes} دقيقة` : `${diffInMinutes} minutes ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return language === 'ar' ? `منذ ${diffInHours} ساعة` : `${diffInHours} hours ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return language === 'ar' ? `منذ ${diffInDays} يوم` : `${diffInDays} days ago`;
  };

  const getLevelText = (level: string) => {
    const levels: { [key: string]: { ar: string; en: string } } = {
      BEGINNER: { ar: 'مبتدئ', en: 'Beginner' },
      INTERMEDIATE: { ar: 'متوسط', en: 'Intermediate' },
      ADVANCED: { ar: 'متقدم', en: 'Advanced' },
    };
    return levels[level]?.[language] || level;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      icon: BookOpen,
      label: { ar: 'الدورات', en: 'Courses' },
      value: data?.stats.totalCourses || 0,
      color: 'bg-blue-500',
    },
    {
      icon: Users,
      label: { ar: 'الطلاب', en: 'Students' },
      value: data?.stats.totalStudents || 0,
      color: 'bg-green-500',
    },
    {
      icon: Star,
      label: { ar: 'التقييم', en: 'Rating' },
      value: data?.stats.averageRating || 0,
      color: 'bg-yellow-500',
    },
    {
      icon: DollarSign,
      label: { ar: 'الإيرادات', en: 'Revenue' },
      value: `$${data?.stats.totalRevenue || 0}`,
      color: 'bg-purple-500',
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'لوحة تحكم المدرب' : 'Instructor Dashboard'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar'
              ? 'إدارة دوراتك ومتابعة الإحصائيات'
              : 'Manage your courses and track statistics'}
          </p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إضافة دورة' : 'Add Course'}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div
              className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}
            >
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-500">{stat.label[language]}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Courses List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'ar' ? 'دوراتي' : 'My Courses'}
            </h2>
            <Link
              href="/instructor/courses"
              className="text-primary-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              {language === 'ar' ? 'عرض الكل' : 'View All'}
              <Arrow className="w-4 h-4" />
            </Link>
          </div>

          {data?.courses && data.courses.length > 0 ? (
            <div className="space-y-4">
              {data.courses.slice(0, 5).map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex gap-4">
                    <img
                      src={ikUrl(course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200', { width: 200 })}
                      alt={course.title[language]}
                      className="w-32 h-24 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {course.title[language]}
                        </h3>
                        <div className="flex gap-2 flex-shrink-0">
                          {course.isPublished ? (
                            <span className="badge badge-success text-xs">
                              {language === 'ar' ? 'منشور' : 'Published'}
                            </span>
                          ) : (
                            <span className="badge bg-gray-200 text-gray-600 text-xs">
                              {language === 'ar' ? 'مسودة' : 'Draft'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.stats.studentsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          {course.stats.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {course.stats.lessonsCount} {language === 'ar' ? 'درس' : 'lessons'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-primary-600 font-bold">${course.price}</span>
                        <div className="flex gap-2">
                          <Link
                            href={`/courses/${course.id}`}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/instructor/courses/${course.id}/edit`}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/instructor/courses/${course.id}/stats`}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'لم تنشئ أي دورة بعد' : "You haven't created any course yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {language === 'ar'
                  ? 'ابدأ بإنشاء دورتك الأولى وشارك معرفتك'
                  : 'Start creating your first course and share your knowledge'}
              </p>
              <Link href="/instructor/courses/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {language === 'ar' ? 'إنشاء دورة' : 'Create Course'}
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Enrollments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-gray-900">
                {language === 'ar' ? 'أحدث التسجيلات' : 'Recent Enrollments'}
              </h3>
            </div>
            {data?.recentEnrollments && data.recentEnrollments.length > 0 ? (
              <div className="space-y-3">
                {data.recentEnrollments.slice(0, 5).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <img
                      src={ikUrl(enrollment.user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40', { width: 100 })}
                      alt={enrollment.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {enrollment.user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {enrollment.course.title[language]}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTimeAgo(enrollment.enrolledAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {language === 'ar' ? 'لا توجد تسجيلات بعد' : 'No enrollments yet'}
              </p>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-gray-900">
                {language === 'ar' ? 'أحدث المراجعات' : 'Recent Reviews'}
              </h3>
            </div>
            {data?.recentReviews && data.recentReviews.length > 0 ? (
              <div className="space-y-3">
                {data.recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={ikUrl(review.user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40', { width: 100 })}
                        alt={review.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {review.user.name}
                        </p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {review.course.title[language]}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {language === 'ar' ? 'لا توجد مراجعات بعد' : 'No reviews yet'}
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-4">
              {language === 'ar' ? 'إحصائيات سريعة' : 'Quick Stats'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-primary-100">
                  {language === 'ar' ? 'إجمالي الدروس' : 'Total Lessons'}
                </span>
                <span className="font-bold">{data?.stats.totalLessons || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary-100">
                  {language === 'ar' ? 'إجمالي المراجعات' : 'Total Reviews'}
                </span>
                <span className="font-bold">{data?.stats.totalReviews || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary-100">
                  {language === 'ar' ? 'متوسط التقييم' : 'Avg Rating'}
                </span>
                <span className="font-bold flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {data?.stats.averageRating || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
