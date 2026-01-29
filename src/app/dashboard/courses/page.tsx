'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Clock, BookOpen, Award, Search, Loader2 } from 'lucide-react';

interface EnrolledCourse {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  thumbnail: string;
  instructor: { id: string; name: string; avatar: string | null };
  progress: number;
  status: string;
  enrolledAt: string;
  lessonsCount: number;
  totalDuration: number;
}

export default function MyCoursesPage() {
  const { language, t } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchCourses = async () => {
      if (!token) return;

      try {
        const response = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setEnrolledCourses(result.data.enrolledCourses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, token, router]);

  const filteredCourses = enrolledCourses.filter((course) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'completed' && course.status === 'COMPLETED') ||
      (filter === 'in_progress' && course.status !== 'COMPLETED');

    const matchesSearch =
      !searchQuery ||
      course.title[language].toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const stats = [
    {
      label: { ar: 'قيد التقدم', en: 'In Progress' },
      value: enrolledCourses.filter((c) => c.status !== 'COMPLETED').length,
    },
    {
      label: { ar: 'مكتملة', en: 'Completed' },
      value: enrolledCourses.filter((c) => c.status === 'COMPLETED').length,
    },
    {
      label: { ar: 'إجمالي الدورات', en: 'Total Courses' },
      value: enrolledCourses.length,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'ar' ? 'دوراتي' : 'My Courses'}
        </h1>
        <p className="text-gray-500">
          {language === 'ar'
            ? 'تابع تقدمك في الدورات المسجلة'
            : 'Track your progress in enrolled courses'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-4 text-center border border-gray-100"
          >
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label[language]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث في دوراتك...' : 'Search your courses...'}
            className="w-full ps-12 pe-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', label: { ar: 'الكل', en: 'All' } },
            { id: 'in_progress', label: { ar: 'قيد التقدم', en: 'In Progress' } },
            { id: 'completed', label: { ar: 'مكتملة', en: 'Completed' } },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilter(option.id as typeof filter)}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                filter === option.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {option.label[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="flex gap-4 p-4">
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200'}
                  alt={course.title[language]}
                  className="w-32 h-24 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {course.title[language]}
                    </h3>
                    {course.status === 'COMPLETED' && (
                      <span className="badge badge-success flex-shrink-0">
                        <Award className="w-3 h-3 me-1" />
                        {language === 'ar' ? 'مكتمل' : 'Completed'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {course.instructor?.name || 'Unknown Instructor'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.lessonsCount} {language === 'ar' ? 'درس' : 'lessons'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.round(course.totalDuration / 60 * 10) / 10}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">
                    {language === 'ar' ? 'التقدم' : 'Progress'}
                  </span>
                  <span className="font-semibold text-primary-600">
                    {course.progress}%
                  </span>
                </div>
                <div className="progress-bar mb-4">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>

                <Link
                  href={`/courses/${course.id}/learn`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  {course.status === 'COMPLETED'
                    ? language === 'ar'
                      ? 'مراجعة'
                      : 'Review'
                    : language === 'ar'
                    ? 'متابعة'
                    : 'Continue'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد دورات' : 'No Courses Found'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {language === 'ar'
              ? 'ابدأ رحلة التعلم بالتسجيل في دوراتنا المتميزة'
              : 'Start your learning journey by enrolling in our featured courses'}
          </p>
          <Link href="/courses" className="btn-primary inline-flex">
            {language === 'ar' ? 'تصفح الدورات' : 'Browse Courses'}
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
