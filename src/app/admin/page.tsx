'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Globe,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  GraduationCap,
  UserCheck,
  FolderTree,
  ShoppingCart,
  Image,
  Award,
} from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';
import Avatar from '@/components/Avatar';

interface Stats {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalRevenue: number;
  };
  userRoles: {
    students: number;
    instructors: number;
    admins: number;
  };
  recentUsers: any[];
  recentEnrollments: any[];
  topCourses: any[];
}

export default function AdminDashboard() {
  const { language, setLanguage, t } = useLanguage();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // التحقق من صلاحية الأدمن
  useEffect(() => {
    // انتظر حتى يتم تحميل بيانات المستخدم
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [user, router, authLoading]);

  // جلب الإحصائيات من API
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const [statsRes, coursesRes] = await Promise.all([
          fetch('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/courses'),
        ]);

        const statsData = await statsRes.json();
        const coursesData = await coursesRes.json();

        if (statsData.success) {
          setStats(statsData.data);
        }

        if (coursesData.success) {
          setCourses(coursesData.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const statsCards = [
    {
      icon: Users,
      label: { ar: 'إجمالي المستخدمين', en: 'Total Users' },
      value: stats?.overview.totalUsers?.toLocaleString() || '0',
      change: '+12%',
      changeType: 'positive',
      color: 'bg-blue-500',
    },
    {
      icon: BookOpen,
      label: { ar: 'الدورات النشطة', en: 'Active Courses' },
      value: stats?.overview.totalCourses?.toString() || '0',
      change: '+8',
      changeType: 'positive',
      color: 'bg-green-500',
    },
    {
      icon: DollarSign,
      label: { ar: 'الإيرادات الكلية', en: 'Total Revenue' },
      value: `$${stats?.overview.totalRevenue?.toLocaleString() || '0'}`,
      change: '+23%',
      changeType: 'positive',
      color: 'bg-purple-500',
    },
    {
      icon: TrendingUp,
      label: { ar: 'التسجيلات', en: 'Enrollments' },
      value: stats?.overview.totalEnrollments?.toLocaleString() || '0',
      change: '+15%',
      changeType: 'positive',
      color: 'bg-orange-500',
    },
  ];

  const adminMenuItems = [
    { href: '/admin', icon: LayoutDashboard, label: { ar: 'لوحة التحكم', en: 'Dashboard' } },
    { href: '/admin/courses', icon: BookOpen, label: { ar: 'الدورات', en: 'Courses' } },
    { href: '/admin/categories', icon: FolderTree, label: { ar: 'التصنيفات', en: 'Categories' } },
    { href: '/admin/orders', icon: ShoppingCart, label: { ar: 'الطلبات', en: 'Orders' } },
    { href: '/admin/users', icon: Users, label: { ar: 'المستخدمين', en: 'Users' } },
    { href: '/admin/instructors', icon: GraduationCap, label: { ar: 'المدربين', en: 'Instructors' } },
    { href: '/admin/enrollments', icon: UserCheck, label: { ar: 'التسجيلات', en: 'Enrollments' } },
    { href: '/admin/analytics', icon: BarChart3, label: { ar: 'الإحصائيات', en: 'Analytics' } },
    { href: '/admin/certificates', icon: Award, label: { ar: 'الشهادات', en: 'Certificates' } },
    { href: '/admin/sliders', icon: Image, label: { ar: 'البانرات', en: 'Banners' } },
    { href: '/admin/settings', icon: Settings, label: { ar: 'الإعدادات', en: 'Settings' } },
  ];

  const isActive = (href: string) => pathname === href;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 start-0 z-50 h-full w-72 bg-gray-900 transform transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white block">
                {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-xl text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          {adminMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.href)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label[language]}</span>
            </Link>
          ))}
        </nav>

        {/* Back to Site */}
        <div className="absolute bottom-0 start-0 end-0 p-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <Globe className="w-5 h-5" />
            <span className="font-medium">
              {language === 'ar' ? 'العودة للموقع' : 'Back to Site'}
            </span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-900/20 transition-all mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ms-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 overflow-visible">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16 overflow-visible">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden md:block flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                  className="w-full ps-10 pe-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-visible">
              <button
                type="button"
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Globe className="w-5 h-5 text-gray-600" />
              </button>
              <NotificationDropdown />
              <div className="flex items-center gap-2 ps-2 ms-2 border-s border-gray-200">
                <Avatar src={user?.avatar} name={user?.name} size={32} />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </h1>
              <p className="text-gray-500">
                {language === 'ar'
                  ? 'نظرة عامة على أداء المنصة'
                  : 'Overview of platform performance'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                {language === 'ar' ? 'تصدير' : 'Export'}
              </button>
              <Link
                href="/admin/courses/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'إضافة دورة' : 'Add Course'}
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {stat.changeType === 'positive' ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label[language]}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Users */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">
                  {language === 'ar' ? 'المستخدمين الجدد' : 'Recent Users'}
                </h3>
                <Link
                  href="/admin/users"
                  className="text-primary-600 text-sm font-medium hover:underline"
                >
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {stats?.recentUsers?.length ? (
                  stats.recentUsers.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <span className="text-primary-600 font-semibold">
                              {user.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className="badge badge-success">
                        {user.role === 'ADMIN'
                          ? language === 'ar' ? 'مدير' : 'Admin'
                          : user.role === 'INSTRUCTOR'
                          ? language === 'ar' ? 'مدرب' : 'Instructor'
                          : language === 'ar' ? 'طالب' : 'Student'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {language === 'ar' ? 'لا يوجد مستخدمين' : 'No users yet'}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Enrollments */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">
                  {language === 'ar' ? 'آخر التسجيلات' : 'Recent Enrollments'}
                </h3>
                <Link
                  href="/admin/enrollments"
                  className="text-primary-600 text-sm font-medium hover:underline"
                >
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {stats?.recentEnrollments?.length ? (
                  stats.recentEnrollments.map((enrollment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {enrollment.user.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {enrollment.course.title[language]}
                        </p>
                      </div>
                      <div className="text-end">
                        <div className="text-xs text-gray-500">
                          {new Date(enrollment.enrolledAt).toLocaleDateString(
                            language === 'ar' ? 'ar-EG' : 'en-US'
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {language === 'ar' ? 'لا يوجد تسجيلات' : 'No enrollments yet'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Courses Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {language === 'ar' ? 'الدورات' : 'Courses'}
              </h3>
              <Link
                href="/admin/courses/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'إضافة دورة' : 'Add Course'}
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="text-start p-4 font-semibold">
                      {language === 'ar' ? 'الدورة' : 'Course'}
                    </th>
                    <th className="text-start p-4 font-semibold">
                      {language === 'ar' ? 'المدرب' : 'Instructor'}
                    </th>
                    <th className="text-start p-4 font-semibold">
                      {language === 'ar' ? 'الطلاب' : 'Students'}
                    </th>
                    <th className="text-start p-4 font-semibold">
                      {language === 'ar' ? 'السعر' : 'Price'}
                    </th>
                    <th className="text-start p-4 font-semibold">
                      {language === 'ar' ? 'التقييم' : 'Rating'}
                    </th>
                    <th className="text-center p-4 font-semibold">
                      {language === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courses.length ? (
                    courses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={course.thumbnail || 'https://via.placeholder.com/64x48'}
                              alt={course.title[language]}
                              className="w-16 h-12 object-cover rounded-lg"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900 line-clamp-1">
                                {course.title[language]}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {course.lessonsCount} {language === 'ar' ? 'درس' : 'lessons'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{course.instructor?.name || '-'}</td>
                        <td className="p-4 text-gray-600">
                          {course.studentsCount?.toLocaleString() || 0}
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-gray-900">
                            ${course.price || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-gray-900">{course.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/courses/${course.id}`}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/courses/${course.id}/edit`}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        {language === 'ar' ? 'لا توجد دورات' : 'No courses yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
