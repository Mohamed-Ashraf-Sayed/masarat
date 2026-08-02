'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  BookMarked,
  LayoutDashboard,
  GraduationCap,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Globe,
  User,
  CreditCard,
  HelpCircle,
  FileQuestion,
  Check,
  MessageSquare,
  Info,
  Plus,
  BarChart3,
  DollarSign,
  Calendar,
  Trophy,
} from 'lucide-react';

interface Notification {
  id: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { language, setLanguage, t, direction } = useLanguage();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Fetch notifications on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if we're in instructor section
  const isInstructorSection = pathname?.startsWith('/instructor');

  // Student menu items
  const studentMenuItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: { ar: 'لوحة التحكم', en: 'Dashboard' },
    },
    {
      href: '/dashboard/courses',
      icon: BookOpen,
      label: { ar: 'دوراتي', en: 'My Courses' },
    },
    {
      href: '/dashboard/books',
      icon: BookMarked,
      label: { ar: 'كتبي', en: 'My Books' },
    },
    {
      href: '/dashboard/messages',
      icon: Bell,
      label: { ar: 'الرسائل', en: 'Messages' },
    },
    {
      href: '/dashboard/rewards',
      icon: Award,
      label: { ar: 'المكافآت', en: 'Rewards' },
    },
    {
      href: '/dashboard/quizzes',
      icon: FileQuestion,
      label: { ar: 'نتائج الاختبارات', en: 'Quiz Results' },
    },
    {
      href: '/dashboard/certificates',
      icon: GraduationCap,
      label: { ar: 'الشهادات', en: 'Certificates' },
    },
    {
      href: '/dashboard/events',
      icon: Calendar,
      label: { ar: 'فعالياتي', en: 'My Events' },
    },
    {
      href: '/dashboard/competitions',
      icon: Trophy,
      label: { ar: 'مسابقاتي', en: 'My Competitions' },
    },
    {
      href: '/dashboard/security',
      icon: User,
      label: { ar: 'الأمان', en: 'Security' },
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: { ar: 'الإعدادات', en: 'Settings' },
    },
  ];

  // Instructor menu items
  const instructorMenuItems = [
    {
      href: '/instructor',
      icon: LayoutDashboard,
      label: { ar: 'لوحة التحكم', en: 'Dashboard' },
    },
    {
      href: '/instructor/courses',
      icon: BookOpen,
      label: { ar: 'دوراتي', en: 'My Courses' },
    },
    {
      href: '/instructor/courses/new',
      icon: Plus,
      label: { ar: 'إضافة دورة', en: 'Add Course' },
    },
    {
      href: '/dashboard/messages',
      icon: MessageSquare,
      label: { ar: 'الرسائل', en: 'Messages' },
    },
    {
      href: '/dashboard/settings',
      icon: Settings,
      label: { ar: 'الإعدادات', en: 'Settings' },
    },
  ];

  // Select menu based on context
  const menuItems = isInstructorSection ? instructorMenuItems : studentMenuItems;

  const isActive = (href: string) => {
    if (href === '/instructor' || href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname?.startsWith(href + '/');
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
        className={`fixed top-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 ${
          direction === 'rtl'
            ? `right-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`
            : `left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              {language === 'ar' ? 'مسارات' : 'Masarat'}
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || 'https://via.placeholder.com/50'}
              alt={user?.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-primary-100"
            />
            <div>
              <h4 className="font-semibold text-gray-900">{user?.name}</h4>
              <p className="text-sm text-gray-500">
                {user?.role === 'ADMIN'
                  ? language === 'ar'
                    ? 'مدير'
                    : 'Admin'
                  : user?.role === 'INSTRUCTOR'
                  ? language === 'ar'
                    ? 'مدرب'
                    : 'Instructor'
                  : language === 'ar'
                  ? 'طالب'
                  : 'Student'}
              </p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.href)
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label[language]}</span>
            </Link>
          ))}

          {/* Role-based navigation links */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
            {/* Show instructor link when in student dashboard */}
            {(user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') && !isInstructorSection && (
              <Link
                href="/instructor"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-600 hover:bg-primary-50 transition-all"
              >
                <GraduationCap className="w-5 h-5" />
                <span className="font-medium">
                  {language === 'ar' ? 'لوحة المدرب' : 'Instructor Panel'}
                </span>
              </Link>
            )}

            {/* Show student dashboard link when in instructor section */}
            {isInstructorSection && (
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">
                  {language === 'ar' ? 'لوحة الطالب' : 'Student Dashboard'}
                </span>
              </Link>
            )}

            {/* Admin panel link */}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-600 hover:bg-primary-50 transition-all"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">
                  {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                </span>
              </Link>
            )}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 start-0 end-0 p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ltr:ml-72 lg:rtl:mr-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search */}
            <div className="hidden md:block flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  className="w-full ps-10 pe-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Globe className="w-5 h-5 text-gray-600" />
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 end-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-xs flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute end-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-[400px] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                        </button>
                      )}
                    </div>

                    {/* Notifications list */}
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p>{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => {
                              if (!notification.isRead) {
                                markAsRead(notification.id);
                              }
                            }}
                            className={`w-full px-4 py-3 text-start hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                              !notification.isRead ? 'bg-primary-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notification.type === 'message'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {notification.type === 'message' ? (
                                  <MessageSquare className="w-4 h-4" />
                                ) : (
                                  <Info className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">
                                  {language === 'ar' ? notification.titleAr : notification.titleEn}
                                </p>
                                <p className="text-gray-500 text-sm truncate">
                                  {language === 'ar' ? notification.messageAr : notification.messageEn}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString(
                                    language === 'ar' ? 'ar-EG' : 'en-US',
                                    { hour: '2-digit', minute: '2-digit' }
                                  )}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <img
                    src={user?.avatar || 'https://via.placeholder.com/40'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <ChevronDown className={`w-4 h-4 text-gray-500 hidden sm:block transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileMenuOpen && (
                  <div className="absolute end-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        {language === 'ar' ? 'الإعدادات' : 'Settings'}
                      </Link>
                      <Link
                        href="/contact"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <HelpCircle className="w-4 h-4" />
                        {language === 'ar' ? 'المساعدة' : 'Help Center'}
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                      </button>
                    </div>
                  </div>
                )}
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
