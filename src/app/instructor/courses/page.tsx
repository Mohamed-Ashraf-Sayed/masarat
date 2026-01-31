'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  BookOpen,
  Users,
  Star,
  Clock,
  Loader2,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Course {
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
}

export default function InstructorCoursesPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchCourses();
  }, [user, token, router]);

  const fetchCourses = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/instructor/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setCourses(result.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!token) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setCourses(courses.filter(c => c.id !== courseId));
      } else {
        alert(result.error || (language === 'ar' ? 'فشل حذف الدورة' : 'Failed to delete course'));
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.ar.toLowerCase().includes(search.toLowerCase()) ||
      course.title.en.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'published' && course.isPublished) ||
      (filter === 'draft' && !course.isPublished);

    return matchesSearch && matchesFilter;
  });

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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'دوراتي' : 'My Courses'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar'
              ? `${courses.length} دورة`
              : `${courses.length} courses`}
          </p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إضافة دورة جديدة' : 'Add New Course'}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'البحث عن دورة...' : 'Search courses...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field ps-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all'
                ? language === 'ar'
                  ? 'الكل'
                  : 'All'
                : f === 'published'
                ? language === 'ar'
                  ? 'منشور'
                  : 'Published'
                : language === 'ar'
                ? 'مسودة'
                : 'Draft'}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
            >
              <div className="relative">
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                  alt={course.title[language]}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 end-3 flex gap-2">
                  {course.isPublished ? (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-lg flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {language === 'ar' ? 'منشور' : 'Published'}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded-lg flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {language === 'ar' ? 'مسودة' : 'Draft'}
                    </span>
                  )}
                </div>
                <div className="absolute top-3 start-3">
                  <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-lg">
                    {getLevelText(course.level)}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3">
                  <span className="text-xs text-primary-600 font-medium">
                    {course.category.name[language]}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-3 line-clamp-2">
                  {course.title[language]}
                </h3>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.stats.studentsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.stats.lessonsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {course.stats.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.stats.duration}h
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xl font-bold text-primary-600">
                    ${course.price}
                  </span>
                  <div className="flex gap-1">
                    <Link
                      href={`/courses/${course.id}`}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={language === 'ar' ? 'معاينة' : 'Preview'}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/instructor/courses/${course.id}/edit`}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={language === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/instructor/courses/${course.id}/lessons`}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={language === 'ar' ? 'الدروس' : 'Lessons'}
                    >
                      <BookOpen className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/instructor/courses/${course.id}/stats`}
                      className="p-2 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={language === 'ar' ? 'الإحصائيات' : 'Stats'}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm(course.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={language === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {search || filter !== 'all'
              ? language === 'ar'
                ? 'لا توجد نتائج'
                : 'No results found'
              : language === 'ar'
              ? 'لم تنشئ أي دورة بعد'
              : "You haven't created any course yet"}
          </h3>
          <p className="text-gray-500 mb-6">
            {search || filter !== 'all'
              ? language === 'ar'
                ? 'جرب البحث بكلمات أخرى'
                : 'Try different search terms'
              : language === 'ar'
              ? 'ابدأ بإنشاء دورتك الأولى وشارك معرفتك مع الآخرين'
              : 'Start creating your first course and share your knowledge'}
          </p>
          {!search && filter === 'all' && (
            <Link
              href="/instructor/courses/new"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {language === 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course'}
            </Link>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'ar'
                ? 'هل أنت متأكد من حذف هذه الدورة؟ سيتم حذف جميع الدروس والبيانات المرتبطة بها.'
                : 'Are you sure you want to delete this course? All lessons and related data will be deleted.'}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
                disabled={deleting}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : language === 'ar' ? (
                  'حذف'
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
