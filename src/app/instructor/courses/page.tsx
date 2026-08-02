'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus, Search, Eye, Edit, Trash2, BarChart3, BookOpen,
  Users, Star, Clock, Loader2, CheckCircle, XCircle,
  Send, AlertCircle, Globe, Ban, Archive, DollarSign,
} from 'lucide-react';

type CourseStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'SUSPENDED';

interface Course {
  id: string;
  title: { ar: string; en: string };
  thumbnail: string;
  price: number;
  level: string;
  status: CourseStatus;
  isPublished: boolean;
  isFeatured: boolean;
  category: { id: string; name: { ar: string; en: string } };
  stats: { studentsCount: number; lessonsCount: number; reviewsCount: number; rating: number; duration: number };
  createdAt: string;
}

const STATUS_CONFIG: Record<CourseStatus, { label: { ar: string; en: string }; color: string }> = {
  DRAFT:     { label: { ar: 'مسودة', en: 'Draft' }, color: 'bg-gray-500' },
  SUBMITTED: { label: { ar: 'قيد المراجعة', en: 'Under Review' }, color: 'bg-yellow-500' },
  APPROVED:  { label: { ar: 'معتمدة', en: 'Approved' }, color: 'bg-blue-500' },
  PUBLISHED: { label: { ar: 'منشورة', en: 'Published' }, color: 'bg-green-500' },
  ARCHIVED:  { label: { ar: 'مؤرشفة', en: 'Archived' }, color: 'bg-orange-500' },
  SUSPENDED: { label: { ar: 'موقوفة', en: 'Suspended' }, color: 'bg-red-500' },
};

export default function InstructorCoursesPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const ar = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | CourseStatus>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/dashboard'); return; }
    fetchCourses();
  }, [user, token, router]);

  const fetchCourses = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/instructor/courses', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setCourses(result.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmitForReview = async (courseId: string) => {
    if (!token) return;
    setSubmitting(courseId);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'SUBMITTED' } : c));
      } else {
        alert(result.error);
      }
    } catch (e) { console.error(e); }
    finally { setSubmitting(null); }
  };

  const handleDelete = async (courseId: string) => {
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) { setCourses(prev => prev.filter(c => c.id !== courseId)); }
      else { alert(result.error || (ar ? 'فشل حذف الدورة' : 'Failed to delete course')); }
    } catch (e) { console.error(e); }
    finally { setDeleting(false); setDeleteConfirm(null); }
  };

  const getLevelText = (level: string) => {
    const levels: Record<string, { ar: string; en: string }> = {
      BEGINNER: { ar: 'مبتدئ', en: 'Beginner' },
      INTERMEDIATE: { ar: 'متوسط', en: 'Intermediate' },
      ADVANCED: { ar: 'متقدم', en: 'Advanced' },
    };
    return levels[level]?.[language] || level;
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.ar.toLowerCase().includes(search.toLowerCase()) || course.title.en.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || course.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{ar ? 'دوراتي' : 'My Courses'}</h1>
          <p className="text-gray-500">{courses.length} {ar ? 'دورة' : 'courses'}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/instructor/revenue" className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            <DollarSign className="w-4 h-4" />
            {ar ? 'إيراداتي' : 'My Revenue'}
          </Link>
          <Link href="/instructor/courses/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {ar ? 'إضافة دورة' : 'Add Course'}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={ar ? 'البحث عن دورة...' : 'Search courses...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field ps-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: { ar: 'الكل', en: 'All' } },
            { id: 'DRAFT', label: { ar: 'مسودة', en: 'Draft' } },
            { id: 'SUBMITTED', label: { ar: 'قيد المراجعة', en: 'Submitted' } },
            { id: 'PUBLISHED', label: { ar: 'منشورة', en: 'Published' } },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${filter === f.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f.label[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const statusCfg = STATUS_CONFIG[course.status] ?? STATUS_CONFIG['DRAFT'];
            return (
              <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                <div className="relative">
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}
                    alt={course.title[language]}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 end-3">
                    <span className={`px-2 py-1 ${statusCfg.color} text-white text-xs font-medium rounded-lg`}>
                      {statusCfg.label[language]}
                    </span>
                  </div>
                  <div className="absolute top-3 start-3">
                    <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-lg">
                      {getLevelText(course.level)}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-2">
                    <span className="text-xs text-primary-600 font-medium">{course.category.name[language]}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 line-clamp-2">{course.title[language]}</h3>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.stats.studentsCount}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.stats.lessonsCount}</span>
                    <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" />{course.stats.rating}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.stats.duration}h</span>
                  </div>

                  {/* Submit for Review — only for DRAFT */}
                  {course.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSubmitForReview(course.id)}
                      disabled={submitting === course.id}
                      className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-sm font-medium hover:bg-yellow-100 transition-colors disabled:opacity-50"
                    >
                      {submitting === course.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {ar ? 'إرسال للمراجعة' : 'Submit for Review'}
                    </button>
                  )}

                  {/* Under Review notice */}
                  {course.status === 'SUBMITTED' && (
                    <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-xl text-yellow-700 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {ar ? 'الدورة قيد المراجعة من الإدارة' : 'Course is under admin review'}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xl font-bold text-primary-600">${course.price}</span>
                    <div className="flex gap-1">
                      <Link href={`/courses/${course.id}`} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors" title={ar ? 'معاينة' : 'Preview'}>
                        <Eye className="w-4 h-4" />
                      </Link>
                      {course.status === 'DRAFT' && (
                        <Link href={`/instructor/courses/${course.id}/edit`} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors" title={ar ? 'تعديل' : 'Edit'}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                      <Link href={`/instructor/courses/${course.id}/lessons`} className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors" title={ar ? 'الدروس' : 'Lessons'}>
                        <BookOpen className="w-4 h-4" />
                      </Link>
                      <Link href={`/instructor/courses/${course.id}/stats`} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition-colors" title={ar ? 'الإحصائيات' : 'Stats'}>
                        <BarChart3 className="w-4 h-4" />
                      </Link>
                      {course.status === 'DRAFT' && (
                        <button onClick={() => setDeleteConfirm(course.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {search || filter !== 'all' ? (ar ? 'لا توجد نتائج' : 'No results found') : (ar ? 'لم تنشئ أي دورة بعد' : "You haven't created any course yet")}
          </h3>
          {!search && filter === 'all' && (
            <Link href="/instructor/courses/new" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus className="w-5 h-5" />
              {ar ? 'إنشاء دورة جديدة' : 'Create New Course'}
            </Link>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{ar ? 'تأكيد الحذف' : 'Confirm Delete'}</h3>
            <p className="text-gray-600 mb-6">{ar ? 'هل أنت متأكد؟ سيتم حذف جميع الدروس والبيانات المرتبطة.' : 'Are you sure? All lessons and related data will be deleted.'}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary" disabled={deleting}>{ar ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {ar ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
