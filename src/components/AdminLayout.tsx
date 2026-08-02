'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  BookMarked,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Globe,
  BarChart3,
  GraduationCap,
  UserCheck,
  FolderTree,
  ShoppingCart,
  FileQuestion,
  CreditCard,
  Shield,
  Bell,
  Building2,
  Building,
  Target,
  Calendar,
  Trophy,
  DollarSign,
  FileText,
  Award,
} from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminMenuItems = [
    { href: '/admin', icon: LayoutDashboard, label: { ar: 'لوحة التحكم', en: 'Dashboard' } },
    { href: '/admin/courses', icon: BookOpen, label: { ar: 'الدورات', en: 'Courses' } },
    { href: '/admin/books', icon: BookMarked, label: { ar: 'الكتب', en: 'Books' } },
    { href: '/admin/quizzes', icon: FileQuestion, label: { ar: 'الاختبارات', en: 'Quizzes' } },
    { href: '/admin/quiz-results', icon: BarChart3, label: { ar: 'نتائج الاختبارات', en: 'Quiz Results' } },
    { href: '/admin/categories', icon: FolderTree, label: { ar: 'التصنيفات', en: 'Categories' } },
    { href: '/admin/orders', icon: ShoppingCart, label: { ar: 'طلبات الدورات', en: 'Course Orders' } },
    { href: '/admin/book-orders', icon: BookMarked, label: { ar: 'طلبات الكتب', en: 'Book Orders' } },
    { href: '/admin/payment-settings', icon: CreditCard, label: { ar: 'إعدادات الدفع', en: 'Payment Settings' } },
    { href: '/admin/users', icon: Users, label: { ar: 'المستخدمين', en: 'Users' } },
    { href: '/admin/instructors', icon: GraduationCap, label: { ar: 'المدربين', en: 'Instructors' } },
    { href: '/admin/team', icon: Users, label: { ar: 'فريق العمل', en: 'Team' } },
    { href: '/admin/enrollments', icon: UserCheck, label: { ar: 'التسجيلات', en: 'Enrollments' } },
    { href: '/admin/unions', icon: Building2, label: { ar: 'الاتحادات', en: 'Unions' } },
    { href: '/admin/entities', icon: Building, label: { ar: 'الجهات', en: 'Entities' } },
    { href: '/admin/initiatives', icon: Target, label: { ar: 'المبادرات', en: 'Initiatives' } },
    { href: '/admin/events', icon: Calendar, label: { ar: 'الفعاليات', en: 'Events' } },
    { href: '/admin/competitions', icon: Trophy, label: { ar: 'المسابقات', en: 'Competitions' } },
    { href: '/admin/certificates', icon: Award, label: { ar: 'الشهادات', en: 'Certificates' } },
    { href: '/admin/revenue', icon: DollarSign, label: { ar: 'الإيرادات', en: 'Revenue' } },
    { href: '/admin/audit-logs', icon: FileText, label: { ar: 'سجل العمليات', en: 'Audit Logs' } },
    { href: '/admin/notifications', icon: Bell, label: { ar: 'الإشعارات', en: 'Notifications' } },
    { href: '/admin/security', icon: Shield, label: { ar: 'الأمان', en: 'Security' } },
    { href: '/admin/analytics', icon: BarChart3, label: { ar: 'الإحصائيات', en: 'Analytics' } },
    { href: '/admin/settings', icon: Settings, label: { ar: 'الإعدادات', en: 'Settings' } },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

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
        className={`fixed top-0 start-0 z-50 h-full w-72 bg-gray-900 transform transition-transform duration-300 flex flex-col ${
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
        <nav className="flex-1 overflow-y-auto p-4 space-y-0.5" style={{ maxHeight: 'calc(100vh - 80px - 120px)' }}>
          {adminMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive(item.href)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{item.label[language]}</span>
            </Link>
          ))}
        </nav>

        {/* Back to Site */}
        <div className="absolute bottom-0 start-0 end-0 p-4 border-t border-gray-800 bg-gray-900">
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
            <span className="font-medium">{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
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
                <img
                  src={user?.avatar || 'https://via.placeholder.com/40'}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
