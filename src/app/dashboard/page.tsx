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
  Clock,
  Award,
  TrendingUp,
  Play,
  ChevronLeft,
  ChevronRight,
  Bell,
  Loader2,
  BookMarked,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalEnrollments: number;
    completedCourses: number;
    totalCertificates: number;
    totalLearningHours: number;
    completionRate: number;
  };
  enrolledCourses: Array<{
    id: string;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    thumbnail: string;
    instructor: { id: string; name: string; avatar: string };
    progress: number;
    status: string;
    enrolledAt: string;
    lessonsCount: number;
    totalDuration: number;
  }>;
  certificates: Array<{
    id: string;
    certificateId: string;
    courseId: string;
    course: { title: { ar: string; en: string } };
    issuedAt: string;
  }>;
  notifications: Array<{
    id: string;
    title: { ar: string; en: string };
    message: { ar: string; en: string };
    type: string;
    isRead: boolean;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { language, t, direction } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const Arrow = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchDashboard = async () => {
      if (!token) return;

      try {
        const response = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
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
      label: { ar: 'الدورات المسجلة', en: 'Enrolled Courses' },
      value: data?.stats.totalEnrollments || 0,
      color: 'bg-blue-500',
    },
    {
      icon: Clock,
      label: { ar: 'ساعات التعلم', en: 'Learning Hours' },
      value: data?.stats.totalLearningHours || 0,
      color: 'bg-green-500',
    },
    {
      icon: Award,
      label: { ar: 'الشهادات', en: 'Certificates' },
      value: data?.stats.totalCertificates || 0,
      color: 'bg-purple-500',
    },
    {
      icon: TrendingUp,
      label: { ar: 'نسبة الإنجاز', en: 'Completion Rate' },
      value: `${data?.stats.completionRate || 0}%`,
      color: 'bg-orange-500',
    },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {language === 'ar' ? 'مرحباً،' : 'Welcome,'} {user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-500">
          {language === 'ar'
            ? 'استمر في رحلة التعلم واكتسب مهارات جديدة'
            : 'Continue your learning journey and acquire new skills'}
        </p>
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
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'ar' ? 'أكمل التعلم' : 'Continue Learning'}
            </h2>
            <Link
              href="/dashboard/courses"
              className="text-primary-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              {language === 'ar' ? 'عرض الكل' : 'View All'}
              <Arrow className="w-4 h-4" />
            </Link>
          </div>

          {data?.enrolledCourses && data.enrolledCourses.length > 0 ? (
            <div className="space-y-4">
              {data.enrolledCourses.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4"
                >
                  <img
                    src={ikUrl(course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200', { width: 200 })}
                    alt={course.title[language]}
                    className="w-32 h-24 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {course.title[language]}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {course.instructor?.name || 'Unknown Instructor'}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>{course.lessonsCount} {language === 'ar' ? 'درس' : 'lessons'}</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <Link
                        href={`/courses/${course.id}/learn`}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        {language === 'ar' ? 'متابعة' : 'Continue'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'لم تسجل في أي دورة بعد' : "You haven't enrolled in any course yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {language === 'ar'
                  ? 'استكشف الدورات وابدأ رحلة التعلم'
                  : 'Explore courses and start your learning journey'}
              </p>
              <Link href="/courses" className="btn-primary inline-block">
                {language === 'ar' ? 'استكشف الدورات' : 'Explore Courses'}
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Certificates */}
          {data?.certificates && data.certificates.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-gray-900">
                  {language === 'ar' ? 'شهاداتي' : 'My Certificates'}
                </h3>
              </div>
              <div className="space-y-3">
                {data.certificates.slice(0, 3).map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3 bg-gray-50 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">
                        {cert.course.title[language]}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(cert.issuedAt).toLocaleDateString(
                          language === 'ar' ? 'ar-EG' : 'en-US'
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/certificates/${cert.id}`}
                      className="text-primary-600 text-sm font-medium hover:underline"
                    >
                      {language === 'ar' ? 'عرض' : 'View'}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-gray-900">
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </h3>
            </div>
            {data?.notifications && data.notifications.length > 0 ? (
              <div className="space-y-3">
                {data.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 ${notification.isRead ? 'bg-gray-300' : 'bg-primary-600'} rounded-full mt-2 flex-shrink-0`}></div>
                    <div>
                      <p className="text-sm text-gray-700">
                        {notification.message[language]}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-2">
              {language === 'ar' ? 'استمر في التعلم' : 'Keep Learning'}
            </h3>
            <p className="text-primary-100 text-sm mb-4">
              {language === 'ar'
                ? 'اكتشف المزيد من الدورات واكتسب مهارات جديدة'
                : 'Discover more courses and acquire new skills'}
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors"
            >
              {language === 'ar' ? 'استكشف الدورات' : 'Explore Courses'}
              <Arrow className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
