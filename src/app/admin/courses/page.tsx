'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Users,
  Star,
  MoreVertical,
  Loader2,
  CheckCircle,
  XCircle,
  Filter,
  ArrowLeft,
} from 'lucide-react';

interface Course {
  id: string;
  title: { ar: string; en: string };
  thumbnail: string;
  price: number;
  level: string;
  isPublished: boolean;
  isFeatured: boolean;
  category: { id: string; name: { ar: string; en: string } };
  instructor: { id: string; name: string };
  stats: {
    studentsCount: number;
    lessonsCount: number;
    rating: number;
  };
  createdAt: string;
}

export default function AdminCoursesPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchCourses();
  }, [user, token, router]);

  const fetchCourses = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/admin/courses', {
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
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setCourses(courses.filter(c => c.id !== courseId));
        setShowDeleteModal(null);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (courseId: string, isPublished: boolean) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      const result = await response.json();
      if (result.success) {
        setCourses(courses.map(c =>
          c.id === courseId ? { ...c, isPublished: !isPublished } : c
        ));
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title[language].toLowerCase().includes(searchQuery.toLowerCase());
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الدورات' : 'Manage Courses'}
            </h1>
            <p className="text-gray-500">
              {language === 'ar'
                ? `${courses.length} دورة في المنصة`
                : `${courses.length} courses in the platform`}
            </p>
          </div>
        </div>
        <Link
          href="/admin/courses/new"
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إضافة دورة جديدة' : 'Add New Course'}
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'البحث عن دورة...' : 'Search courses...'}
              className="w-full ps-12 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: { ar: 'الكل', en: 'All' } },
              { id: 'published', label: { ar: 'منشور', en: 'Published' } },
              { id: 'draft', label: { ar: 'مسودة', en: 'Draft' } },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id as typeof filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === option.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label[language]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'الدورة' : 'Course'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'المدرب' : 'Instructor'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'السعر' : 'Price'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'الإحصائيات' : 'Stats'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'}
                        alt={course.title[language]}
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {course.title[language]}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="badge bg-gray-100 text-gray-600 text-xs">
                            {getLevelText(course.level)}
                          </span>
                          <span>{course.category.name[language]}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{course.instructor.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">${course.price}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
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
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePublish(course.id, course.isPublished)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        course.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {course.isPublished ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          {language === 'ar' ? 'منشور' : 'Published'}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          {language === 'ar' ? 'مسودة' : 'Draft'}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${course.id}`}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={language === 'ar' ? 'عرض' : 'View'}
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={language === 'ar' ? 'تعديل' : 'Edit'}
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <Link
                        href={`/admin/courses/${course.id}/lessons`}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={language === 'ar' ? 'الدروس' : 'Lessons'}
                      >
                        <BookOpen className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => setShowDeleteModal(course.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={language === 'ar' ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد دورات' : 'No courses found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {language === 'ar'
                ? 'ابدأ بإضافة دورتك الأولى'
                : 'Start by adding your first course'}
            </p>
            <Link href="/admin/courses/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {language === 'ar' ? 'إضافة دورة' : 'Add Course'}
            </Link>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === 'ar'
                ? 'هل أنت متأكد من حذف هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this course? This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
