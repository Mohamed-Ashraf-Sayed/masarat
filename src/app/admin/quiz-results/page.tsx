'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ikUrl } from '@/lib/imagekit';
import {
  FileQuestion,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Loader2,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface QuizAttempt {
  id: string;
  score: number;
  totalPoints: number;
  earnedPoints: number;
  passed: boolean;
  timeSpent: number | null;
  completedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  quiz: {
    id: string;
    titleAr: string;
    titleEn: string;
    passingScore: number;
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
  };
}

interface QuizStats {
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  averageScore: number;
  passRate: number;
}

interface Quiz {
  id: string;
  titleAr: string;
  titleEn: string;
}

interface Course {
  id: string;
  titleAr?: string;
  titleEn?: string;
  title?: { ar: string; en: string };
}

export default function AdminQuizResultsPage() {
  const { language } = useLanguage();
  const { token, isLoading: authLoading } = useAuth();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && token) {
      fetchAttempts();
      fetchQuizzes();
      fetchCourses();
    }
  }, [authLoading, token, selectedQuiz, selectedCourse, page]);

  const fetchAttempts = async () => {
    try {
      let url = `/api/admin/quiz-attempts?page=${page}`;
      if (selectedQuiz) url += `&quizId=${selectedQuiz}`;
      if (selectedCourse) url += `&courseId=${selectedCourse}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setAttempts(result.data.attempts);
        setStats(result.data.stats);
        setTotalPages(result.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/admin/quizzes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setQuizzes(result.data.quizzes);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchCourses = async () => {
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
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAttempts = attempts.filter((attempt) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      attempt.user.name.toLowerCase().includes(searchLower) ||
      attempt.user.email.toLowerCase().includes(searchLower) ||
      attempt.quiz.titleAr.toLowerCase().includes(searchLower) ||
      attempt.quiz.titleEn.toLowerCase().includes(searchLower)
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'نتائج الاختبارات' : 'Quiz Results'}
          </h1>
          <p className="text-gray-600">
            {language === 'ar'
              ? 'عرض جميع محاولات الاختبارات ونتائج الطلاب'
              : 'View all quiz attempts and student results'}
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileQuestion className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'إجمالي المحاولات' : 'Total Attempts'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'ناجح' : 'Passed'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">{stats.passedAttempts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'راسب' : 'Failed'}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{stats.failedAttempts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'متوسط النتيجة' : 'Avg Score'}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">{stats.averageScore}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'نسبة النجاح' : 'Pass Rate'}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">{stats.passRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث عن طالب...' : 'Search student...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field ps-10"
            />
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedQuiz('');
              setPage(1);
            }}
            className="input-field sm:w-48"
          >
            <option value="">{language === 'ar' ? 'جميع الدورات' : 'All Courses'}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {language === 'ar'
                  ? course.title?.ar || course.titleAr
                  : course.title?.en || course.titleEn}
              </option>
            ))}
          </select>
          <select
            value={selectedQuiz}
            onChange={(e) => {
              setSelectedQuiz(e.target.value);
              setPage(1);
            }}
            className="input-field sm:w-48"
          >
            <option value="">{language === 'ar' ? 'جميع الاختبارات' : 'All Quizzes'}</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {language === 'ar' ? quiz.titleAr : quiz.titleEn}
              </option>
            ))}
          </select>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الطالب' : 'Student'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الاختبار' : 'Quiz'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'النتيجة' : 'Score'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الوقت' : 'Time'}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={ikUrl(attempt.user.avatar || 'https://via.placeholder.com/40', { width: 100 })}
                          alt={attempt.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{attempt.user.name}</div>
                          <div className="text-sm text-gray-500">{attempt.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {language === 'ar' ? attempt.quiz.titleAr : attempt.quiz.titleEn}
                        </div>
                        <div className="text-sm text-gray-500">
                          {language === 'ar'
                            ? attempt.quiz.course.titleAr
                            : attempt.quiz.course.titleEn}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-bold ${
                            attempt.passed ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {attempt.score}%
                        </span>
                        <span className="text-sm text-gray-500">
                          ({attempt.earnedPoints}/{attempt.totalPoints})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {attempt.passed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          {language === 'ar' ? 'ناجح' : 'Passed'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" />
                          {language === 'ar' ? 'راسب' : 'Failed'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {formatTime(attempt.timeSpent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(attempt.completedAt)}
                    </td>
                  </tr>
                ))}
                {filteredAttempts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                {language === 'ar' ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
                {language === 'ar' ? 'السابق' : 'Previous'}
              </button>
              <span className="text-sm text-gray-600">
                {language === 'ar'
                  ? `صفحة ${page} من ${totalPages}`
                  : `Page ${page} of ${totalPages}`}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
                {language === 'ar' ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
