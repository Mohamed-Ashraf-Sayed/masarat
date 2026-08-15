'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { ikUrl } from '@/lib/imagekit';
import {
  Users,
  Search,
  Loader2,
  BookOpen,
  Calendar,
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Award,
} from 'lucide-react';

interface Enrollment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  course: {
    id: string;
    title: { ar: string; en: string };
    thumbnail: string | null;
  };
  progress: number;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
}

export default function AdminEnrollmentsPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // تحديد متعدد + إصدار شهادات جماعي (للمكتملين فقط)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTemplate, setBulkTemplate] = useState('');
  const [bulkHours, setBulkHours] = useState('');
  const [bulkCeuCount, setBulkCeuCount] = useState('');
  const [bulkGeneralCeus, setBulkGeneralCeus] = useState('');
  const [bulkSupervisionCeus, setBulkSupervisionCeus] = useState('');
  const [bulkEthicsCeus, setBulkEthicsCeus] = useState('');
  const [bulkModality, setBulkModality] = useState('');
  const [bulkProviderNumber, setBulkProviderNumber] = useState('');
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkCompletionDate, setBulkCompletionDate] = useState('');
  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [bulkDone, setBulkDone] = useState(0);
  const [bulkResult, setBulkResult] = useState<{ issued: number; skipped: number; failed: number } | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !['ADMIN','SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }

    fetchEnrollments();
  }, [user, token, router, authLoading]);

  const fetchEnrollments = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch('/api/enrollments', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setEnrollments(result.data);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, progress: number) => {
    if (status === 'COMPLETED' || progress === 100) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          {language === 'ar' ? 'مكتمل' : 'Completed'}
        </span>
      );
    } else if (status === 'CANCELLED') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          <XCircle className="w-3 h-3" />
          {language === 'ar' ? 'ملغي' : 'Cancelled'}
        </span>
      );
    } else if (progress > 0) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          <TrendingUp className="w-3 h-3" />
          {language === 'ar' ? 'قيد التقدم' : 'In Progress'}
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
          <Clock className="w-3 h-3" />
          {language === 'ar' ? 'لم يبدأ' : 'Not Started'}
        </span>
      );
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch =
      enrollment.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.course.title.ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.course.title.en.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'completed' && (enrollment.status === 'COMPLETED' || enrollment.progress === 100)) ||
      (statusFilter === 'in_progress' && enrollment.progress > 0 && enrollment.progress < 100) ||
      (statusFilter === 'not_started' && enrollment.progress === 0);

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: enrollments.length,
    completed: enrollments.filter(e => e.status === 'COMPLETED' || e.progress === 100).length,
    inProgress: enrollments.filter(e => e.progress > 0 && e.progress < 100).length,
    notStarted: enrollments.filter(e => e.progress === 0).length,
  };

  // ── التحديد المتعدد ──────────────────────────────────────────────────────
  const isCompletedEnrollment = (e: Enrollment) => e.status === 'COMPLETED' || e.progress === 100;
  const completedFiltered = filteredEnrollments.filter(isCompletedEnrollment);
  const allSelected = completedFiltered.length > 0 && completedFiltered.every(e => selectedIds.has(e.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(completedFiltered.map(e => e.id)));
  };

  const openBulkModal = () => {
    setBulkResult(null);
    setBulkDone(0);
    setShowBulkModal(true);
  };

  const handleBulkIssue = async () => {
    const targets = enrollments.filter(e => selectedIds.has(e.id));
    if (targets.length === 0) return;
    setBulkIssuing(true);
    setBulkResult(null);
    setBulkDone(0);
    let issued = 0, skipped = 0, failed = 0;
    for (const e of targets) {
      try {
        const res = await fetch('/api/admin/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            userId: e.user.id,
            courseId: e.course.id,
            certificateTemplate: bulkTemplate || undefined,
            trainingHours: bulkHours || undefined,
            ceuCount: bulkCeuCount || undefined,
            generalCeus: bulkGeneralCeus || undefined,
            supervisionCeus: bulkSupervisionCeus || undefined,
            ethicsCeus: bulkEthicsCeus || undefined,
            eventModality: bulkModality || undefined,
            providerNumber: bulkProviderNumber || undefined,
            startDate: bulkStartDate || undefined,
            completionDate: bulkCompletionDate || undefined,
          }),
        });
        if (res.status === 409) {
          skipped++; // الشهادة صادرة قبل كده
        } else {
          const r = await res.json();
          if (r.success) issued++;
          else failed++;
        }
      } catch {
        failed++;
      }
      setBulkDone(d => d + 1);
    }
    setBulkResult({ issued, skipped, failed });
    setBulkIssuing(false);
    if (issued > 0) setSelectedIds(new Set());
  };

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
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'التسجيلات' : 'Enrollments'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? `${enrollments.length} تسجيل` : `${enrollments.length} enrollments`}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي' : 'Total'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'مكتمل' : 'Completed'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'قيد التقدم' : 'In Progress'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.notStarted}</p>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'لم يبدأ' : 'Not Started'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'البحث بالاسم أو البريد أو الدورة...' : 'Search by name, email or course...'}
              className="input-field ps-12"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full sm:w-48"
          >
            <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
            <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
            <option value="in_progress">{language === 'ar' ? 'قيد التقدم' : 'In Progress'}</option>
            <option value="not_started">{language === 'ar' ? 'لم يبدأ' : 'Not Started'}</option>
          </select>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <span className="text-sm font-medium text-amber-800">
            {language === 'ar'
              ? `${selectedIds.size} طالب محدد`
              : `${selectedIds.size} selected`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {language === 'ar' ? 'إلغاء التحديد' : 'Clear'}
            </button>
            <button
              onClick={openBulkModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              <Award className="w-4 h-4" />
              {language === 'ar' ? `إصدار شهادات (${selectedIds.size})` : `Issue Certificates (${selectedIds.size})`}
            </button>
          </div>
        </div>
      )}

      {/* Enrollments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredEnrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      disabled={completedFiltered.length === 0}
                      title={language === 'ar' ? 'تحديد كل المكتملين المعروضين' : 'Select all completed shown'}
                      className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'الطالب' : 'Student'}
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'الدورة' : 'Course'}
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'التقدم' : 'Progress'}
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'تاريخ التسجيل' : 'Enrolled'}
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(enrollment.id) ? 'bg-amber-50/60' : ''}`}>
                    <td className="p-4">
                      {isCompletedEnrollment(enrollment) && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(enrollment.id)}
                          onChange={() => toggleSelect(enrollment.id)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          {enrollment.user.avatar ? (
                            <img src={ikUrl(enrollment.user.avatar, { width: 100 })} alt={enrollment.user.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-primary-600 font-semibold">
                              {enrollment.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{enrollment.user.name}</p>
                          <p className="text-sm text-gray-500">{enrollment.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {enrollment.course.thumbnail ? (
                          <img
                            src={ikUrl(enrollment.course.thumbnail, { width: 100 })}
                            alt={enrollment.course.title[language]}
                            className="w-12 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <Link
                          href={`/admin/courses/${enrollment.course.id}/lessons`}
                          className="font-medium text-gray-900 hover:text-primary-600"
                        >
                          {enrollment.course.title[language]}
                        </Link>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-500">{Math.round(enrollment.progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              enrollment.progress === 100
                                ? 'bg-green-500'
                                : enrollment.progress > 0
                                ? 'bg-primary-500'
                                : 'bg-gray-300'
                            }`}
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(enrollment.status, enrollment.progress)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(enrollment.enrolledAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>
                    </td>
                    <td className="p-4">
                      {(enrollment.status === 'COMPLETED' || enrollment.progress === 100) && (
                        <Link
                          href={`/admin/certificates?userId=${enrollment.user.id}&courseId=${enrollment.course.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                        >
                          <Award className="w-4 h-4" />
                          {language === 'ar' ? 'إصدار شهادة' : 'Issue Certificate'}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد تسجيلات' : 'No enrollments found'}
            </h3>
            <p className="text-gray-500">
              {language === 'ar' ? 'جرب تغيير معايير البحث' : 'Try changing your search criteria'}
            </p>
          </div>
        )}
      </div>

      {/* Bulk issue modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                {language === 'ar'
                  ? `إصدار شهادات لـ ${selectedIds.size} طالب`
                  : `Issue certificates for ${selectedIds.size} students`}
              </h3>
              <button onClick={() => !bulkIssuing && setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {bulkResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-2xl font-bold text-green-700">{bulkResult.issued}</p>
                    <p className="text-sm text-green-700">{language === 'ar' ? 'اتصدرت' : 'Issued'}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-2xl font-bold text-amber-700">{bulkResult.skipped}</p>
                    <p className="text-sm text-amber-700">{language === 'ar' ? 'صادرة من قبل' : 'Already issued'}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-2xl font-bold text-red-700">{bulkResult.failed}</p>
                    <p className="text-sm text-red-700">{language === 'ar' ? 'فشلت' : 'Failed'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
                >
                  {language === 'ar' ? 'تم' : 'Done'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  {language === 'ar'
                    ? 'البيانات دي هتتطبق على كل الشهادات المحددة — سيب أي خانة فاضية لو مش محتاجها'
                    : 'These details apply to all selected certificates — leave blank what you don\'t need'}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'قالب الشهادة' : 'Certificate template'}
                    </label>
                    <select
                      value={bulkTemplate}
                      onChange={(e) => setBulkTemplate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900"
                    >
                      <option value="">{language === 'ar' ? 'حسب إعدادات الدورة' : 'Use course default'}</option>
                      <option value="QABA">QABA</option>
                      <option value="IBAO">IBAO</option>
                      <option value="CEU">CEU - QABA</option>
                      <option value="IBAO_CEU">CEU - IBAO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'ساعات التدريب' : 'Training hours'}
                    </label>
                    <input type="number" value={bulkHours} onChange={(e) => setBulkHours(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900" placeholder="40" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'إجمالي CEUs' : 'Total CEUs'}
                    </label>
                    <input type="number" step="0.5" value={bulkCeuCount} onChange={(e) => setBulkCeuCount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">General CEUs</label>
                    <input type="number" step="0.5" value={bulkGeneralCeus} onChange={(e) => setBulkGeneralCeus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervision CEUs</label>
                    <input type="number" step="0.5" value={bulkSupervisionCeus} onChange={(e) => setBulkSupervisionCeus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ethics CEUs</label>
                    <input type="number" step="0.5" value={bulkEthicsCeus} onChange={(e) => setBulkEthicsCeus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'وسيلة الحدث' : 'Event modality'}
                    </label>
                    <input type="text" value={bulkModality} onChange={(e) => setBulkModality(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900" placeholder="Online Zoom" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'رقم المزود' : 'Provider number'}
                    </label>
                    <input type="text" value={bulkProviderNumber} onChange={(e) => setBulkProviderNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'تاريخ البداية' : 'Start date'}
                    </label>
                    <input type="date" value={bulkStartDate} onChange={(e) => setBulkStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'تاريخ الإتمام' : 'Completion date'}
                    </label>
                    <input type="date" value={bulkCompletionDate} onChange={(e) => setBulkCompletionDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900" />
                  </div>
                </div>
                <button
                  onClick={handleBulkIssue}
                  disabled={bulkIssuing}
                  className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {bulkIssuing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {language === 'ar'
                        ? `جاري الإصدار... ${bulkDone}/${selectedIds.size}`
                        : `Issuing... ${bulkDone}/${selectedIds.size}`}
                    </>
                  ) : (
                    <>
                      <Award className="w-5 h-5" />
                      {language === 'ar' ? `إصدار ${selectedIds.size} شهادة` : `Issue ${selectedIds.size} certificates`}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
