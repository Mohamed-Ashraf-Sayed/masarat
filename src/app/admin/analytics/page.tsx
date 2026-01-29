'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Eye,
  Clock,
  ArrowLeft,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Mock analytics data
  const [analytics, setAnalytics] = useState({
    revenue: { current: 12500, previous: 10200, change: 22.5 },
    enrollments: { current: 156, previous: 142, change: 9.9 },
    activeUsers: { current: 1250, previous: 1100, change: 13.6 },
    completionRate: { current: 68, previous: 62, change: 9.7 },
  });

  const [topCourses, setTopCourses] = useState([
    { name: { ar: 'تطوير الويب الشامل', en: 'Complete Web Development' }, enrollments: 45, revenue: 4455 },
    { name: { ar: 'التصميم الجرافيكي', en: 'Graphic Design' }, enrollments: 38, revenue: 3762 },
    { name: { ar: 'تطوير تطبيقات الموبايل', en: 'Mobile App Development' }, enrollments: 32, revenue: 3168 },
    { name: { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' }, enrollments: 28, revenue: 2772 },
    { name: { ar: 'التسويق الرقمي', en: 'Digital Marketing' }, enrollments: 25, revenue: 2475 },
  ]);

  const [monthlyData, setMonthlyData] = useState([
    { month: { ar: 'يناير', en: 'Jan' }, revenue: 8500, enrollments: 85 },
    { month: { ar: 'فبراير', en: 'Feb' }, revenue: 9200, enrollments: 92 },
    { month: { ar: 'مارس', en: 'Mar' }, revenue: 10100, enrollments: 101 },
    { month: { ar: 'أبريل', en: 'Apr' }, revenue: 9800, enrollments: 98 },
    { month: { ar: 'مايو', en: 'May' }, revenue: 11200, enrollments: 112 },
    { month: { ar: 'يونيو', en: 'Jun' }, revenue: 12500, enrollments: 125 },
  ]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, [user, router, authLoading]);

  const statCards = [
    {
      title: { ar: 'الإيرادات', en: 'Revenue' },
      value: `$${analytics.revenue.current.toLocaleString()}`,
      change: analytics.revenue.change,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: { ar: 'التسجيلات', en: 'Enrollments' },
      value: analytics.enrollments.current.toLocaleString(),
      change: analytics.enrollments.change,
      icon: BookOpen,
      color: 'bg-blue-500',
    },
    {
      title: { ar: 'المستخدمين النشطين', en: 'Active Users' },
      value: analytics.activeUsers.current.toLocaleString(),
      change: analytics.activeUsers.change,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: { ar: 'معدل الإكمال', en: 'Completion Rate' },
      value: `${analytics.completionRate.current}%`,
      change: analytics.completionRate.change,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'الإحصائيات والتحليلات' : 'Analytics & Reports'}
            </h1>
            <p className="text-gray-500">
              {language === 'ar' ? 'نظرة شاملة على أداء المنصة' : 'Comprehensive overview of platform performance'}
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {[
            { id: 'week', label: { ar: 'أسبوع', en: 'Week' } },
            { id: 'month', label: { ar: 'شهر', en: 'Month' } },
            { id: 'year', label: { ar: 'سنة', en: 'Year' } },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as typeof period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p.label[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(stat.change)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.title[language]}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">
            {language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
          </h3>
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="w-16 text-sm text-gray-500">{data.month[language]}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-primary-600 h-full rounded-full transition-all"
                    style={{ width: `${(data.revenue / 15000) * 100}%` }}
                  />
                </div>
                <span className="w-20 text-sm font-medium text-gray-900 text-end">
                  ${data.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">
            {language === 'ar' ? 'الدورات الأكثر مبيعاً' : 'Top Selling Courses'}
          </h3>
          <div className="space-y-4">
            {topCourses.map((course, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{course.name[language]}</p>
                    <p className="text-sm text-gray-500">
                      {course.enrollments} {language === 'ar' ? 'تسجيل' : 'enrollments'}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-gray-900">${course.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-6">
          {language === 'ar' ? 'نشاط المنصة' : 'Platform Activity'}
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <Eye className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 mb-1">15,234</div>
            <p className="text-gray-600">
              {language === 'ar' ? 'زيارات الصفحات' : 'Page Views'}
            </p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 mb-1">4.5h</div>
            <p className="text-gray-600">
              {language === 'ar' ? 'متوسط وقت التعلم' : 'Avg. Learning Time'}
            </p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 mb-1">89%</div>
            <p className="text-gray-600">
              {language === 'ar' ? 'معدل العودة' : 'Return Rate'}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
