'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ikUrl } from '@/lib/imagekit';
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Settings,
  BookOpen,
  LayoutDashboard,
  Globe,
  Search,
  Bell,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import Avatar from './Avatar';

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

interface SearchCourse {
  id: string;
  title: { ar: string; en: string };
  thumbnail: string;
  price: number;
  instructor: {
    name: string;
  };
}

interface NavbarProps {
  variant?: 'default' | 'solid';
}

export default function Navbar({ variant = 'default' }: NavbarProps) {
  const { language, setLanguage, t, direction } = useLanguage();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  // If variant is solid, always show solid background
  const showSolidBg = variant === 'solid' || isScrolled;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCourse[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success) {
          const filtered = data.data.filter((course: SearchCourse) =>
            course.title[language].toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 5);
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Error searching courses:', error);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, language]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return language === 'ar' ? 'الآن' : 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return language === 'ar' ? `منذ ${mins} دقيقة` : `${mins}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return language === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/about', label: t('about') },
    { href: '/courses', label: t('courses') },
    { href: '/events', label: language === 'ar' ? 'الفعاليات' : 'Events' },
    { href: '/union', label: language === 'ar' ? 'الاتحاد' : 'Union' },
    { href: '/competitions', label: language === 'ar' ? 'المسابقات' : 'Competitions' },
    { href: '/store', label: t('store') },
    { href: '/institutions', label: language === 'ar' ? 'للمؤسسات' : 'Institutions' },
    { href: '/contact', label: language === 'ar' ? 'تواصل معنا' : 'Contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showSolidBg
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src={ikUrl('/images/logo.png', { width: 100 })}
              alt="Masarat"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  showSolidBg
                    ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-1.5 rounded-lg transition-all ${
                showSolidBg
                  ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${
                showSolidBg
                  ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-medium">
                {language === 'ar' ? 'EN' : 'عربي'}
              </span>
            </button>

            {/* User Section */}
            {user ? (
              <div className="relative flex items-center">
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`p-2 rounded-xl transition-all relative ${
                      showSolidBg
                        ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div className="absolute end-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-slide-down">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            <CheckCheck className="w-4 h-4" />
                            {language === 'ar' ? 'قراءة الكل' : 'Mark all read'}
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="py-8 text-center text-gray-500">
                            <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
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
                              className={`w-full px-4 py-3 text-start hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                                !notification.isRead ? 'bg-primary-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                    notification.isRead ? 'bg-transparent' : 'bg-primary-600'
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {language === 'ar' ? notification.titleAr : notification.titleEn}
                                  </p>
                                  <p className="text-gray-500 text-sm line-clamp-2">
                                    {language === 'ar' ? notification.messageAr : notification.messageEn}
                                  </p>
                                  <p className="text-gray-400 text-xs mt-1">
                                    {formatTimeAgo(notification.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block px-4 py-3 text-center text-sm text-primary-600 hover:bg-gray-50 border-t border-gray-100"
                      >
                        {language === 'ar' ? 'عرض كل الإشعارات' : 'View all notifications'}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Profile Menu */}
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`flex items-center gap-2 p-1 rounded-xl transition-all ms-2 ${
                    showSolidBg
                      ? 'hover:bg-gray-100'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size={36}
                    className={`border-2 ${
                      showSolidBg ? 'border-primary-200' : 'border-white/50'
                    }`}
                  />
                  <ChevronDown className={`w-4 h-4 ${showSolidBg ? 'text-gray-500' : 'text-white/80'}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="dropdown-menu animate-slide-down">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="dropdown-item"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    <Link
                      href="/dashboard/courses"
                      className="dropdown-item"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <BookOpen className="w-4 h-4" />
                      {t('myCourses')}
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="dropdown-item"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      {t('settings')}
                    </Link>
                    {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                      <Link
                        href="/admin"
                        className="dropdown-item text-primary-600"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                      </Link>
                    )}
                    {user.role === 'INSTRUCTOR' && (
                      <Link
                        href="/instructor"
                        className="dropdown-item text-green-600"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {language === 'ar' ? 'لوحة المدرب' : 'Instructor Panel'}
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="dropdown-item text-red-600 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    showSolidBg
                      ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    showSolidBg
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-white text-primary-600 hover:bg-gray-100'
                  }`}
                >
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition-all ${
                showSolidBg
                  ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="py-4 border-t border-gray-100 animate-slide-down" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="input-field ps-12 pe-24"
                autoFocus
              />
              <button
                type="submit"
                className="absolute end-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                {language === 'ar' ? 'بحث' : 'Search'}
              </button>
            </form>

            {/* Search Results Dropdown */}
            {searchQuery.trim() && (
              <div className="mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {loadingSearch ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((course) => (
                      <Link
                        key={course.id}
                        href={`/courses/${course.id}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                      >
                        <img
                          src={ikUrl(course.thumbnail || '/images/course-placeholder.jpg', { width: 200 })}
                          alt={course.title[language]}
                          className="w-16 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {course.title[language]}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {course.instructor.name}
                          </p>
                        </div>
                        <div className="text-primary-600 font-semibold text-sm">
                          {course.price === 0
                            ? (language === 'ar' ? 'مجاني' : 'Free')
                            : `$${course.price}`}
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/courses?search=${encodeURIComponent(searchQuery)}`}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="block px-4 py-3 text-center text-sm text-primary-600 hover:bg-gray-50 border-t border-gray-100"
                    >
                      {language === 'ar' ? 'عرض كل النتائج' : 'View all results'}
                    </Link>
                  </>
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>{language === 'ar' ? 'لا توجد نتائج' : 'No results found'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 animate-slide-down">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-100 mt-2">
                  <Link
                    href="/login"
                    className="btn-secondary text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
