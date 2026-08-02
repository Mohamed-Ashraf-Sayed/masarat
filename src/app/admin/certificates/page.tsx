'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  Award, Plus, Search, Trash2, Eye, Download,
  Loader2, X, CheckCircle, User, BookOpen,
} from 'lucide-react';

interface Certificate {
  id: string;
  certificateId: string;
  issuedAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
  course: { id: string; titleAr: string; titleEn: string };
}

interface UserOption { id: string; name: string; email: string }
interface CourseOption { id: string; titleAr: string; titleEn: string; title?: { ar: string; en: string } }

export default function AdminCertificatesPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const ar = language === 'ar';

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Issue modal
  const [showModal, setShowModal] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [issueError, setIssueError] = useState('');
  const [issueSuccess, setIssueSuccess] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/dashboard'); return; }
    fetchCertificates();
  }, [user, router]);

  const fetchCertificates = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...(search && { search }) });
      const res = await fetch(`/api/admin/certificates?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setCertificates(data.data.certificates); setTotal(data.data.total); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token, search]);

  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  const fetchUsersAndCourses = async () => {
    if (!token) return;
    const [uRes, cRes] = await Promise.all([
      fetch('/api/admin/users?limit=200', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/courses?limit=200', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const [uData, cData] = await Promise.all([uRes.json(), cRes.json()]);
    if (uData.success) setUsers(uData.data.users || uData.data || []);
    if (cData.success) {
      // Normalize courses — admin API may return title:{ar,en} or titleAr/titleEn
      const raw: any[] = cData.data.courses || (Array.isArray(cData.data) ? cData.data : Object.values(cData.data));
      setCourses(raw.map(c => ({
        id: c.id,
        titleAr: c.titleAr || c.title?.ar || '',
        titleEn: c.titleEn || c.title?.en || '',
      })));
    }
  };

  const openModal = () => {
    setSelectedUserId('');
    setSelectedCourseId('');
    setUserSearch('');
    setCourseSearch('');
    setIssueError('');
    setIssueSuccess('');
    setShowModal(true);
    fetchUsersAndCourses();
  };

  const handleIssue = async () => {
    if (!selectedUserId || !selectedCourseId) {
      setIssueError(ar ? 'اختر الطالب والدورة' : 'Select student and course');
      return;
    }
    setIssuing(true);
    setIssueError('');
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: selectedUserId, courseId: selectedCourseId }),
      });
      const data = await res.json();
      if (data.success) {
        setIssueSuccess(ar ? `تم إصدار الشهادة بنجاح: ${data.data.certificateId}` : `Certificate issued: ${data.data.certificateId}`);
        fetchCertificates();
        setTimeout(() => { setShowModal(false); setIssueSuccess(''); }, 2000);
      } else {
        setIssueError(data.error || (ar ? 'فشل إصدار الشهادة' : 'Failed to issue certificate'));
      }
    } catch (e) { setIssueError(ar ? 'خطأ في الاتصال' : 'Connection error'); }
    finally { setIssuing(false); }
  };

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/certificates/${deleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setCertificates(p => p.filter(c => c.id !== deleteId)); setTotal(p => p - 1); }
      else { alert(data.error); }
    } catch (e) { console.error(e); }
    finally { setDeleting(false); setDeleteId(null); }
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCourses = courses.filter(c =>
    (c.titleAr || '').toLowerCase().includes(courseSearch.toLowerCase()) ||
    (c.titleEn || '').toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{ar ? 'إدارة الشهادات' : 'Certificates'}</h1>
          <p className="text-gray-500">{ar ? `${total} شهادة` : `${total} certificates`}</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {ar ? 'إصدار شهادة' : 'Issue Certificate'}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={ar ? 'بحث بالاسم أو البريد أو رقم الشهادة...' : 'Search by name, email or certificate ID...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field ps-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'الطالب' : 'Student'}</th>
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'الدورة' : 'Course'}</th>
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'رقم الشهادة' : 'Certificate ID'}</th>
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'تاريخ الإصدار' : 'Issued At'}</th>
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <Award className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400">{ar ? 'لا توجد شهادات' : 'No certificates found'}</p>
                    </td>
                  </tr>
                ) : certificates.map(cert => (
                  <tr key={cert.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          {cert.user.avatar
                            ? <img src={cert.user.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                            : <User className="w-4 h-4 text-primary-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cert.user.name}</p>
                          <p className="text-xs text-gray-400">{cert.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-sm text-gray-700 max-w-[200px] truncate">
                        {ar ? cert.course.titleAr : cert.course.titleEn}
                      </p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                        {cert.certificateId}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-sm text-gray-500">
                      {new Date(cert.issuedAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/certificates/${cert.id}`}
                          target="_blank"
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title={ar ? 'عرض' : 'View'}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(cert.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={ar ? 'سحب الشهادة' : 'Revoke'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue Certificate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-600" />
                {ar ? 'إصدار شهادة جديدة' : 'Issue New Certificate'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {issueSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <p className="text-green-700 font-medium">{issueSuccess}</p>
              </div>
            ) : (
              <>
                {/* User Select */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline me-1" />
                    {ar ? 'الطالب' : 'Student'}
                  </label>
                  <input
                    type="text"
                    placeholder={ar ? 'بحث عن طالب...' : 'Search student...'}
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="input-field mb-2 text-sm"
                  />
                  <div className="border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="text-center text-gray-400 py-4 text-sm">{ar ? 'لا توجد نتائج' : 'No results'}</p>
                    ) : filteredUsers.slice(0, 20).map(u => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`w-full text-start px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0 ${selectedUserId === u.id ? 'bg-primary-50' : ''}`}
                      >
                        <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        {selectedUserId === u.id && <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Course Select */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline me-1" />
                    {ar ? 'الدورة' : 'Course'}
                  </label>
                  <input
                    type="text"
                    placeholder={ar ? 'بحث عن دورة...' : 'Search course...'}
                    value={courseSearch}
                    onChange={e => setCourseSearch(e.target.value)}
                    className="input-field mb-2 text-sm"
                  />
                  <div className="border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                    {filteredCourses.length === 0 ? (
                      <p className="text-center text-gray-400 py-4 text-sm">{ar ? 'لا توجد نتائج' : 'No results'}</p>
                    ) : filteredCourses.slice(0, 20).map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCourseId(c.id)}
                        className={`w-full text-start px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0 ${selectedCourseId === c.id ? 'bg-primary-50' : ''}`}
                      >
                        <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-700 flex-1 truncate">{ar ? (c.titleAr || c.titleEn) : (c.titleEn || c.titleAr)}</p>
                        {selectedCourseId === c.id && <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {issueError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                    {issueError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                    {ar ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleIssue}
                    disabled={issuing || !selectedUserId || !selectedCourseId}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                    {ar ? 'إصدار الشهادة' : 'Issue Certificate'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Revoke Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{ar ? 'سحب الشهادة' : 'Revoke Certificate'}</h3>
            <p className="text-gray-600 mb-6">{ar ? 'هل تريد سحب هذه الشهادة؟ لن يتمكن الطالب من الوصول إليها.' : 'Are you sure? The student will no longer be able to access this certificate.'}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 btn-secondary" disabled={deleting}>{ar ? 'إلغاء' : 'Cancel'}</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {ar ? 'سحب' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
