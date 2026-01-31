'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileQuestion,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart2,
} from 'lucide-react';

interface Quiz {
  id: string;
  titleAr: string;
  titleEn: string;
  passingScore: number;
  timeLimit: number | null;
  isPublished: boolean;
  course: {
    id: string;
    titleAr: string;
    titleEn: string;
  };
  lesson: {
    id: string;
    titleAr: string;
    titleEn: string;
  } | null;
  _count: {
    questions: number;
    attempts: number;
  };
  createdAt: string;
}

interface Course {
  id: string;
  titleAr?: string;
  titleEn?: string;
  title?: {
    ar: string;
    en: string;
  };
}

export default function QuizzesPage() {
  const { language } = useLanguage();
  const { token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    courseId: '',
    lessonId: '',
    passingScore: 60,
    timeLimit: '',
    isPublished: false,
    showResults: true,
    shuffleQuestions: false,
    maxAttempts: '',
  });

  const [courseLessons, setCourseLessons] = useState<Array<{ id: string; titleAr?: string; titleEn?: string; title?: { ar: string; en: string } }>>([]);

  useEffect(() => {
    if (!authLoading && token) {
      fetchQuizzes();
      fetchCourses();
    }
  }, [authLoading, token, selectedCourse]);

  const fetchQuizzes = async () => {
    try {
      let url = '/api/admin/quizzes';
      if (selectedCourse) {
        url += `?courseId=${selectedCourse}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setQuizzes(result.data.quizzes);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setCourses(result.data.courses || result.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchCourseLessons = async (courseId: string) => {
    if (!courseId) {
      setCourseLessons([]);
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/lessons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setCourseLessons(result.data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingQuiz
        ? `/api/admin/quizzes/${editingQuiz.id}`
        : '/api/admin/quizzes';

      const response = await fetch(url, {
        method: editingQuiz ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
          maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : null,
          lessonId: formData.lessonId || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchQuizzes();
        setShowModal(false);
        resetForm();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/quizzes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        fetchQuizzes();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
    setDeleteConfirm(null);
  };

  const openEditModal = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      titleAr: quiz.titleAr,
      titleEn: quiz.titleEn,
      descriptionAr: '',
      descriptionEn: '',
      courseId: quiz.course.id,
      lessonId: quiz.lesson?.id || '',
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit?.toString() || '',
      isPublished: quiz.isPublished,
      showResults: true,
      shuffleQuestions: false,
      maxAttempts: '',
    });
    fetchCourseLessons(quiz.course.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingQuiz(null);
    setFormData({
      titleAr: '',
      titleEn: '',
      descriptionAr: '',
      descriptionEn: '',
      courseId: '',
      lessonId: '',
      passingScore: 60,
      timeLimit: '',
      isPublished: false,
      showResults: true,
      shuffleQuestions: false,
      maxAttempts: '',
    });
    setCourseLessons([]);
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    const searchLower = search.toLowerCase();
    return (
      quiz.titleAr.toLowerCase().includes(searchLower) ||
      quiz.titleEn.toLowerCase().includes(searchLower) ||
      quiz.course.titleAr.toLowerCase().includes(searchLower) ||
      quiz.course.titleEn.toLowerCase().includes(searchLower)
    );
  });

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الاختبارات' : 'Quiz Management'}
            </h1>
            <p className="text-gray-600">
              {language === 'ar'
                ? 'إنشاء وإدارة اختبارات الدورات'
                : 'Create and manage course quizzes'}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {language === 'ar' ? 'إضافة اختبار' : 'Add Quiz'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث...' : 'Search...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field ps-10"
            />
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="input-field sm:w-64"
          >
            <option value="">
              {language === 'ar' ? 'جميع الدورات' : 'All Courses'}
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {language === 'ar'
                  ? (course.title?.ar || course.titleAr)
                  : (course.title?.en || course.titleEn)}
              </option>
            ))}
          </select>
        </div>

        {/* Quizzes Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الاختبار' : 'Quiz'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الدورة' : 'Course'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الأسئلة' : 'Questions'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'المحاولات' : 'Attempts'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {language === 'ar' ? quiz.titleAr : quiz.titleEn}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {quiz.timeLimit
                            ? `${quiz.timeLimit} ${language === 'ar' ? 'دقيقة' : 'min'}`
                            : language === 'ar'
                            ? 'غير محدد'
                            : 'Unlimited'}
                          <span className="mx-1">•</span>
                          {quiz.passingScore}% {language === 'ar' ? 'للنجاح' : 'to pass'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {language === 'ar' ? quiz.course.titleAr : quiz.course.titleEn}
                        </div>
                        {quiz.lesson && (
                          <div className="text-gray-500">
                            {language === 'ar' ? quiz.lesson.titleAr : quiz.lesson.titleEn}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileQuestion className="w-4 h-4 text-gray-400" />
                        <span>{quiz._count.questions}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-gray-400" />
                        <span>{quiz._count.attempts}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {quiz.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          {language === 'ar' ? 'منشور' : 'Published'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="w-3 h-3" />
                          {language === 'ar' ? 'مسودة' : 'Draft'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/quizzes/${quiz.id}`)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                          title={language === 'ar' ? 'عرض الأسئلة' : 'View Questions'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(quiz)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg"
                          title={language === 'ar' ? 'تعديل' : 'Edit'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(quiz.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                          title={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredQuizzes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {language === 'ar' ? 'لا توجد اختبارات' : 'No quizzes found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingQuiz
                    ? language === 'ar'
                      ? 'تعديل الاختبار'
                      : 'Edit Quiz'
                    : language === 'ar'
                    ? 'إضافة اختبار جديد'
                    : 'Add New Quiz'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'} *
                    </label>
                    <input
                      type="text"
                      value={formData.titleAr}
                      onChange={(e) =>
                        setFormData({ ...formData, titleAr: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'} *
                    </label>
                    <input
                      type="text"
                      value={formData.titleEn}
                      onChange={(e) =>
                        setFormData({ ...formData, titleEn: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
                    </label>
                    <textarea
                      value={formData.descriptionAr}
                      onChange={(e) =>
                        setFormData({ ...formData, descriptionAr: e.target.value })
                      }
                      className="input-field"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
                    </label>
                    <textarea
                      value={formData.descriptionEn}
                      onChange={(e) =>
                        setFormData({ ...formData, descriptionEn: e.target.value })
                      }
                      className="input-field"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الدورة' : 'Course'} *
                    </label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          courseId: e.target.value,
                          lessonId: '',
                        });
                        fetchCourseLessons(e.target.value);
                      }}
                      className="input-field"
                      required
                      disabled={!!editingQuiz}
                    >
                      <option value="">
                        {language === 'ar' ? 'اختر الدورة' : 'Select Course'}
                      </option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {language === 'ar'
                            ? (course.title?.ar || course.titleAr)
                            : (course.title?.en || course.titleEn)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الدرس (اختياري)' : 'Lesson (Optional)'}
                    </label>
                    <select
                      value={formData.lessonId}
                      onChange={(e) =>
                        setFormData({ ...formData, lessonId: e.target.value })
                      }
                      className="input-field"
                      disabled={!formData.courseId}
                    >
                      <option value="">
                        {language === 'ar' ? 'اختبار عام للدورة' : 'General Course Quiz'}
                      </option>
                      {courseLessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {language === 'ar'
                            ? (lesson.title?.ar || lesson.titleAr)
                            : (lesson.title?.en || lesson.titleEn)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'نسبة النجاح (%)' : 'Passing Score (%)'}
                    </label>
                    <input
                      type="number"
                      value={formData.passingScore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passingScore: parseInt(e.target.value) || 60,
                        })
                      }
                      className="input-field"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الوقت (دقائق)' : 'Time Limit (min)'}
                    </label>
                    <input
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, timeLimit: e.target.value })
                      }
                      className="input-field"
                      placeholder={language === 'ar' ? 'غير محدد' : 'Unlimited'}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'عدد المحاولات' : 'Max Attempts'}
                    </label>
                    <input
                      type="number"
                      value={formData.maxAttempts}
                      onChange={(e) =>
                        setFormData({ ...formData, maxAttempts: e.target.value })
                      }
                      className="input-field"
                      placeholder={language === 'ar' ? 'غير محدد' : 'Unlimited'}
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) =>
                        setFormData({ ...formData, isPublished: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'ar' ? 'نشر الاختبار' : 'Publish Quiz'}
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.showResults}
                      onChange={(e) =>
                        setFormData({ ...formData, showResults: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'ar'
                        ? 'عرض الإجابات الصحيحة بعد الانتهاء'
                        : 'Show correct answers after completion'}
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.shuffleQuestions}
                      onChange={(e) =>
                        setFormData({ ...formData, shuffleQuestions: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'ar' ? 'ترتيب الأسئلة عشوائياً' : 'Shuffle questions'}
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : editingQuiz ? (
                      language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'
                    ) : (
                      language === 'ar' ? 'إنشاء الاختبار' : 'Create Quiz'
                    )}
                  </button>
                </div>
              </form>
            </div>
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
                  ? 'هل أنت متأكد من حذف هذا الاختبار؟ سيتم حذف جميع الأسئلة والمحاولات المرتبطة به.'
                  : 'Are you sure you want to delete this quiz? All questions and attempts will be deleted.'}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
