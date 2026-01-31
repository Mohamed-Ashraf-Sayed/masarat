'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Star,
  Clock,
  TrendingUp,
  DollarSign,
  Eye,
  Play,
  Award,
  Loader2,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react';

interface CourseStats {
  course: {
    id: string;
    titleAr: string;
    titleEn: string;
    thumbnail: string;
    price: number;
    isPublished: boolean;
  };
  stats: {
    totalStudents: number;
    activeStudents: number;
    completedStudents: number;
    totalLessons: number;
    totalDuration: number;
    averageRating: number;
    totalReviews: number;
    totalRevenue: number;
    completionRate: number;
    viewsThisMonth: number;
    enrollmentsThisMonth: number;
  };
  recentEnrollments: Array<{
    id: string;
    userName: string;
    userEmail: string;
    enrolledAt: string;
    progress: number;
  }>;
  recentReviews: Array<{
    id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

export default function CourseStatsPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [stats, setStats] = useState<CourseStats | null>(null);
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

    fetchStats();
  }, [user, router, courseId]);

  const fetchStats = async () => {
    if (!token) return;

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        router.push('/instructor/courses');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">
            {language === 'ar' ? 'لم يتم العثور على البيانات' : 'No data found'}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      label: language === 'ar' ? 'إجمالي الطلاب' : 'Total Students',
      value: stats.stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      label: language === 'ar' ? 'الطلاب النشطين' : 'Active Students',
      value: stats.stats.activeStudents,
      icon: TrendingUp,
      color: 'bg-green-500',
      bgColor: 'bg-green-100',
    },
    {
      label: language === 'ar' ? 'أكملوا الدورة' : 'Completed',
      value: stats.stats.completedStudents,
      icon: Award,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100',
    },
    {
      label: language === 'ar' ? 'نسبة الإكمال' : 'Completion Rate',
      value: `${stats.stats.completionRate}%`,
      icon: PieChart,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-100',
    },
    {
      label: language === 'ar' ? 'عدد الدروس' : 'Total Lessons',
      value: stats.stats.totalLessons,
      icon: BookOpen,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-100',
    },
    {
      label: language === 'ar' ? 'مدة الدورة' : 'Total Duration',
      value: formatDuration(stats.stats.totalDuration),
      icon: Clock,
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-100',
    },
    {
      label: language === 'ar' ? 'متوسط التقييم' : 'Average Rating',
      value: stats.stats.averageRating.toFixed(1),
      icon: Star,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-100',
    },
    {
      label: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
      value: `$${stats.stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-100',
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/instructor/courses"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {language === 'ar' ? 'إحصائيات الدورة' : 'Course Statistics'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? stats.course.titleAr : stats.course.titleEn}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/instructor/courses/${courseId}/edit`}
            className="btn-secondary"
          >
            {language === 'ar' ? 'تعديل الدورة' : 'Edit Course'}
          </Link>
          <Link
            href={`/courses/${courseId}`}
            className="btn-primary flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {language === 'ar' ? 'معاينة' : 'Preview'}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100"
          >
            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color.replace('bg-', '')}`} />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Overview */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {language === 'ar' ? 'المشاهدات هذا الشهر' : 'Views This Month'}
              </h3>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {stats.stats.viewsThisMonth.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {language === 'ar' ? 'التسجيلات هذا الشهر' : 'Enrollments This Month'}
              </h3>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {stats.stats.enrollmentsThisMonth}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              {language === 'ar' ? 'أحدث التسجيلات' : 'Recent Enrollments'}
            </h3>
          </div>
          {stats.recentEnrollments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {stats.recentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {enrollment.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {enrollment.userName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(enrollment.enrolledAt)}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium text-primary-600">
                      {enrollment.progress}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === 'ar' ? 'تقدم' : 'Progress'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {language === 'ar' ? 'لا توجد تسجيلات بعد' : 'No enrollments yet'}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {language === 'ar' ? 'أحدث التقييمات' : 'Recent Reviews'}
            </h3>
          </div>
          {stats.recentReviews.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {stats.recentReviews.map((review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">
                        {review.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {review.userName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {review.comment}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {language === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
