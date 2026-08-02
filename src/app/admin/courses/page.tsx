'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  Plus, Search, Edit, Trash2, Eye, BookOpen, Users, Star,
  Loader2, CheckCircle, XCircle, Clock, AlertCircle, Ban,
  Archive, Send, Globe, ChevronDown,
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
  instructor: { id: string; name: string };
  stats: { studentsCount: number; lessonsCount: number; rating: number };
  createdAt: string;
}

const STATUS_CONFIG: Record<CourseStatus, { label: { ar: string; en: string }; color: string; icon: React.ReactNode }> = {
  DRAFT:     { label: { ar: 'مسودة', en: 'Draft' }, color: 'bg-gray-100 text-gray-600', icon: <Clock className="w-3 h-3" /> },
  SUBMITTED: { label: { ar: 'بانتظار المراجعة', en: 'Submitted' }, color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle className="w-3 h-3" /> },
  APPROVED:  { label: { ar: 'معتمدة', en: 'Approved' }, color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-3 h-3" /> },
  PUBLISHED: { label: { ar: 'منشورة', en: 'Published' }, color: 'bg-green-100 text-green-700', icon: <Globe className="w-3 h-3" /> },
  ARCHIVED:  { label: { ar: 'مؤرشفة', en: 'Archived' }, color: 'bg-orange-100 text-orange-700', icon: <Archive className="w-3 h-3" /> },
  SUSPENDED: { label: { ar: 'موقوفة', en: 'Suspended' }, color: 'bg-red-100 text-red-700', icon: <Ban className="w-3 h-3" /> },
};

export default function AdminCoursesPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const ar = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | CourseStatus>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const ALLOWED_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
    DRAFT:     ['SUBMITTED', 'APPROVED', 'PUBLISHED'],
    SUBMITTED: ['APPROVED', 'PUBLISHED', 'DRAFT'],
    APPROVED:  ['PUBLISHED', 'DRAFT'],
    PUBLISHED: ['SUSPENDED', 'ARCHIVED', 'DRAFT'],
    SUSPENDED: ['PUBLISHED', 'DRAFT'],
    ARCHIVED:  ['PUBLISHED', 'DRAFT'],
  };

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/login'); return; }
    fetchCourses();
  }, [user, token, router]);

  const fetchCourses = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setCourses(result.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (courseId: string, newStatus: CourseStatus, reason?: string) => {
    if (!token) return;
    setActionLoading(courseId);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const result = await res.json();
      if (result.success) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: newStatus, isPublished: newStatus === 'PUBLISHED' } : c));
        setRejectModal(null);
        setRejectReason('');
      } else {
        alert(result.error);
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (courseId: string) => {
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) { setCourses(prev => prev.filter(c => c.id !== courseId)); setShowDeleteModal(null); }
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
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
    const matchesSearch = course.title[language].toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || course.status === filter;
    return matchesSearch && matchesFilter;
  });

  const submittedCount = courses.filter(c => c.status === 'SUBMITTED').length;

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ar ? 'إدارة الدورات' : 'Manage Courses'}</h1>
          <p className="text-gray-500">
            {ar ? `${courses.length} دورة في المنصة` : `${courses.length} courses in the platform`}
            {submittedCount > 0 && (
              <span className="ms-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                {submittedCount} {ar ? 'تنتظر المراجعة' : 'pending review'}
              </span>
            )}
          </p>
        </div>
        <Link href="/admin/courses/new" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-5 h-5" />
          {ar ? 'إضافة دورة' : 'Add Course'}
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
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={ar ? 'البحث عن دورة...' : 'Search courses...'}
              className="w-full ps-12 pe-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: { ar: 'الكل', en: 'All' } },
              { id: 'SUBMITTED', label: { ar: 'قيد المراجعة', en: 'Submitted' } },
              { id: 'APPROVED', label: { ar: 'معتمدة', en: 'Approved' } },
              { id: 'PUBLISHED', label: { ar: 'منشورة', en: 'Published' } },
              { id: 'DRAFT', label: { ar: 'مسودة', en: 'Draft' } },
              { id: 'SUSPENDED', label: { ar: 'موقوفة', en: 'Suspended' } },
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id as typeof filter)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === option.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">{ar ? 'الدورة' : 'Course'}</th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">{ar ? 'المدرب' : 'Instructor'}</th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">{ar ? 'السعر' : 'Price'}</th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">{ar ? 'الإحصائيات' : 'Stats'}</th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">{ar ? 'الحالة' : 'Status'}</th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">{ar ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCourses.map(course => {
                const statusCfg = STATUS_CONFIG[course.status] ?? STATUS_CONFIG['DRAFT'];
                return (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'}
                          alt={course.title[language]}
                          className="w-16 h-12 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{course.title[language]}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="badge bg-gray-100 text-gray-600 text-xs">{getLevelText(course.level)}</span>
                            <span>{course.category.name[language]}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-gray-600">{course.instructor.name}</span></td>
                    <td className="px-6 py-4"><span className="font-semibold text-gray-900">${course.price}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.stats.studentsCount}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{course.stats.lessonsCount}</span>
                        <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" />{course.stats.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setStatusDropdown(statusDropdown === course.id ? null : course.id)}
                          disabled={actionLoading === course.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusCfg.color}`}
                        >
                          {actionLoading === course.id ? <Loader2 className="w-3 h-3 animate-spin" /> : statusCfg.icon}
                          {statusCfg.label[language]}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {statusDropdown === course.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setStatusDropdown(null)} />
                            <div className="absolute start-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                              {(ALLOWED_TRANSITIONS[course.status] || []).map(s => {
                                const cfg = STATUS_CONFIG[s];
                                return (
                                  <button
                                    key={s}
                                    onClick={() => {
                                      setStatusDropdown(null);
                                      handleStatusChange(course.id, s);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-start"
                                  >
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                                      {cfg.icon}
                                      {cfg.label[language]}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Workflow actions */}
                        {course.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(course.id, 'APPROVED')}
                              disabled={actionLoading === course.id}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
                            >
                              {ar ? 'موافقة' : 'Approve'}
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: course.id, title: course.title[language] })}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                            >
                              {ar ? 'رفض' : 'Reject'}
                            </button>
                          </>
                        )}
                        {course.status === 'APPROVED' && (
                          <button
                            onClick={() => handleStatusChange(course.id, 'PUBLISHED')}
                            disabled={actionLoading === course.id}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            {ar ? 'نشر' : 'Publish'}
                          </button>
                        )}
                        {course.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleStatusChange(course.id, 'SUSPENDED')}
                            disabled={actionLoading === course.id}
                            className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors disabled:opacity-50"
                          >
                            {ar ? 'إيقاف' : 'Suspend'}
                          </button>
                        )}
                        {course.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleStatusChange(course.id, 'PUBLISHED')}
                            disabled={actionLoading === course.id}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            {ar ? 'إعادة نشر' : 'Reinstate'}
                          </button>
                        )}

                        {/* Standard actions */}
                        <Link href={`/courses/${course.id}`} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors" title={ar ? 'عرض' : 'View'}>
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/courses/${course.id}/edit`} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors" title={ar ? 'تعديل' : 'Edit'}>
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/courses/${course.id}/lessons`} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors" title={ar ? 'الدروس' : 'Lessons'}>
                          <BookOpen className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(course.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={ar ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{ar ? 'لا توجد دورات' : 'No courses found'}</h3>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{ar ? 'رفض الدورة' : 'Reject Course'}</h3>
            <p className="text-gray-500 mb-4 text-sm">{rejectModal.title}</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={ar ? 'سبب الرفض (اختياري)...' : 'Rejection reason (optional)...'}
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl mb-4 text-sm focus:border-primary-500 outline-none resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                {ar ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleStatusChange(rejectModal.id, 'DRAFT', rejectReason)}
                disabled={actionLoading === rejectModal.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2"
              >
                {actionLoading === rejectModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {ar ? 'تأكيد الرفض' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{ar ? 'تأكيد الحذف' : 'Confirm Delete'}</h3>
            <p className="text-gray-600 mb-6">
              {ar ? 'هل أنت متأكد من حذف هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this course? This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                {ar ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {ar ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
