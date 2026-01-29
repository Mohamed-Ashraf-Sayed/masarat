'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';

interface NavbarProps {
  variant?: 'default' | 'solid';
}

export default function Navbar({ variant = 'default' }: NavbarProps) {
  const { language, setLanguage, t, direction } = useLanguage();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  // If variant is solid, always show solid background
  const showSolidBg = variant === 'solid' || isScrolled;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/about', label: t('about') },
    { href: '/courses', label: t('courses') },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="Masarat"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors ${
                  showSolidBg
                    ? 'text-gray-600 hover:text-primary-600'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-xl transition-all ${
                showSolidBg
                  ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                showSolidBg
                  ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">
                {language === 'ar' ? 'EN' : 'عربي'}
              </span>
            </button>

            {/* User Section */}
            {user ? (
              <div className="relative flex items-center">
                {/* Notifications */}
                <button className={`p-2 rounded-xl transition-all relative ${
                  showSolidBg
                    ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}>
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Profile Menu */}
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`flex items-center gap-2 p-1 rounded-xl transition-all ms-2 ${
                    showSolidBg
                      ? 'hover:bg-gray-100'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <img
                    src={user.avatar || 'https://via.placeholder.com/40'}
                    alt={user.name}
                    className={`w-9 h-9 rounded-full object-cover border-2 ${
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
                    {user.role === 'ADMIN' && (
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
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/login"
                  className={`px-4 py-2 font-medium rounded-xl transition-all ${
                    showSolidBg
                      ? 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className={`px-4 py-2 font-medium rounded-xl transition-all ${
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
          <div className="py-4 border-t border-gray-100 animate-slide-down">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className="input-field ps-12"
                autoFocus
              />
            </div>
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
