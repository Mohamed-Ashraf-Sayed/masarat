'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  ArrowLeft,
  Loader2,
  Award,
  Plus,
  Trash2,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Download,
} from 'lucide-react';

interface Certificate {
  id: string;
  certificateId: string;
  issuedAt: string;
  certificateTemplate?: string;
  user: { id: string; name: string; email: string };
  course: { id: string; titleAr: string; titleEn: string; certificateTemplate?: string };
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface CourseOption {
  id: string;
  titleAr: string;
  titleEn: string;
}

export default function AdminCertificatesPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Issue modal
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: '', name: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchCertificates();
  }, [user, router, authLoading]);

  const fetchCertificates = async () => {
    try {
      const res = await fetch('/api/admin/certificates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCertificates(data.data);
    } catch {
      setError(language === 'ar' ? 'فشل في تحميل الشهادات' : 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndCourses = async () => {
    try {
      const [usersRes, coursesRes] = await Promise.all([
        fetch('/api/admin/users?limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/courses?limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const usersData = await usersRes.json();
      const coursesData = await coursesRes.json();

      if (usersData.success) {
        const list = usersData.data?.users || usersData.data || [];
        setUsers(list.map((u: { id: string; name: string; email: string }) => ({
          id: u.id, name: u.name, email: u.email,
        })));
      }
      if (coursesData.success) {
        const list = coursesData.data?.courses || coursesData.data || [];
        setCourses(list.map((c: any) => ({
          id: c.id,
          titleAr: c.titleAr || c.title?.ar || '',
          titleEn: c.titleEn || c.title?.en || '',
        })));
      }
    } catch {
      setError(language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data');
    }
  };

  const openIssueModal = () => {
    setShowModal(true);
    setSelectedUserId('');
    setSelectedCourseId('');
    setSelectedTemplate('');
    setUserSearch('');
    setCourseSearch('');
    fetchUsersAndCourses();
  };

  const handleIssue = async () => {
    if (!selectedUserId || !selectedCourseId) {
      setError(language === 'ar' ? 'اختر المستخدم والدورة' : 'Select user and course');
      return;
    }

    setIssuing(true);
    setError('');

    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUserId, courseId: selectedCourseId, certificateTemplate: selectedTemplate || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchCertificates();
        setSuccess(language === 'ar' ? 'تم إصدار الشهادة بنجاح' : 'Certificate issued successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch {
      setError(language === 'ar' ? 'فشل في إصدار الشهادة' : 'Failed to issue certificate');
    } finally {
      setIssuing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({ open: false, id: '', name: '' });
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/certificates?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCertificates((prev) => prev.filter((c) => c.id !== id));
        setSuccess(language === 'ar' ? 'تم حذف الشهادة' : 'Certificate deleted');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch {
      setError(language === 'ar' ? 'فشل في حذف الشهادة' : 'Failed to delete certificate');
    } finally {
      setDeleting(null);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.user.name.toLowerCase().includes(term) ||
      c.user.email.toLowerCase().includes(term) ||
      c.course.titleAr.toLowerCase().includes(term) ||
      c.course.titleEn.toLowerCase().includes(term) ||
      c.certificateId.toLowerCase().includes(term)
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  const filteredCourses = courses.filter((c) => {
    if (!courseSearch) return true;
    const term = courseSearch.toLowerCase();
    return c.titleAr.toLowerCase().includes(term) || c.titleEn.toLowerCase().includes(term);
  });

  if (authLoading || loading) {
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الشهادات' : 'Manage Certificates'}
            </h1>
            <p className="text-gray-500">
              {language === 'ar' ? `${certificates.length} شهادة` : `${certificates.length} certificates`}
            </p>
          </div>
        </div>
        <button onClick={openIssueModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إصدار شهادة' : 'Issue Certificate'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'بحث بالاسم أو البريد أو الدورة...' : 'Search by name, email or course...'}
            className="w-full ps-10 pe-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'المتدرب' : 'Student'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'الدورة' : 'Course'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'رقم الشهادة' : 'Certificate #'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'النوع' : 'Template'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'تاريخ الإصدار' : 'Issued Date'}
                </th>
                <th className="text-start px-6 py-4 text-sm font-semibold text-gray-600">
                  {language === 'ar' ? 'إجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {language === 'ar' ? 'لا توجد شهادات' : 'No certificates found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => (
                  <tr key={cert.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{cert.user.name}</p>
                      <p className="text-sm text-gray-500">{cert.user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{language === 'ar' ? cert.course.titleAr : cert.course.titleEn}</p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{cert.certificateId}</code>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const tmpl = cert.certificateTemplate || cert.course.certificateTemplate || 'QABA';
                        const colors: Record<string, string> = {
                          QABA: 'bg-blue-100 text-blue-700',
                          IBAO: 'bg-amber-100 text-amber-700',
                          CEU: 'bg-purple-100 text-purple-700',
                          IBAO_CEU: 'bg-emerald-100 text-emerald-700',
                        };
                        return (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${colors[tmpl] || 'bg-gray-100 text-gray-700'}`}>
                            {tmpl === 'IBAO_CEU' ? 'CEU IBAO' : tmpl}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(cert.issuedAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/certificates/${cert.id}/download`}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title={language === 'ar' ? 'تحميل' : 'Download'}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setConfirmModal({ open: true, id: cert.id, name: cert.user.name })}
                          disabled={deleting === cert.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          {deleting === cert.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Certificate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600" />
                {language === 'ar' ? 'إصدار شهادة جديدة' : 'Issue New Certificate'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'المتدرب' : 'Student'} *
                </label>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'ابحث عن المتدرب...' : 'Search student...'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-2"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl">
                  {filteredUsers.slice(0, 50).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUserId(u.id); setUserSearch(u.name); }}
                      className={`w-full text-start px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                        selectedUserId === u.id ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                    >
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-500 text-center">
                      {language === 'ar' ? 'لا توجد نتائج' : 'No results'}
                    </p>
                  )}
                </div>
              </div>

              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الدورة' : 'Course'} *
                </label>
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'ابحث عن الدورة...' : 'Search course...'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-2"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl">
                  {filteredCourses.slice(0, 50).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCourseId(c.id); setCourseSearch(language === 'ar' ? c.titleAr : c.titleEn); }}
                      className={`w-full text-start px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                        selectedCourseId === c.id ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                    >
                      <p className="font-medium text-sm">{language === 'ar' ? c.titleAr : c.titleEn}</p>
                    </button>
                  ))}
                  {filteredCourses.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-500 text-center">
                      {language === 'ar' ? 'لا توجد نتائج' : 'No results'}
                    </p>
                  )}
                </div>
              </div>

              {/* Certificate Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'نوع الشهادة' : 'Certificate Template'}
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-gray-900"
                >
                  <option value="">{language === 'ar' ? 'حسب إعدادات الدورة' : 'Use course default'}</option>
                  <option value="QABA">QABA</option>
                  <option value="IBAO">IBAO</option>
                  <option value="CEU">CEU - QABA</option>
                  <option value="IBAO_CEU">CEU - IBAO</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleIssue}
                disabled={issuing || !selectedUserId || !selectedCourseId}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {issuing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Award className="w-5 h-5" />
                )}
                {language === 'ar' ? 'إصدار الشهادة' : 'Issue Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal({ open: false, id: '', name: '' })} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              {language === 'ar' ? 'حذف الشهادة' : 'Delete Certificate'}
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {language === 'ar'
                ? `هل أنت متأكد من حذف شهادة ${confirmModal.name}؟`
                : `Are you sure you want to delete ${confirmModal.name}'s certificate?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ open: false, id: '', name: '' })}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(confirmModal.id)}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                {language === 'ar' ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
