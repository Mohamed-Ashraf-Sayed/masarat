'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileQuestion,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface QuizAttempt {
  id: string;
  score: number;
  totalPoints: number;
  earnedPoints: number;
  passed: boolean;
  timeSpent: number | null;
  completedAt: string;
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

export default function QuizResultsPage() {
  const { language, direction } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const Arrow = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchResults = async () => {
      if (!token) return;

      try {
        const response = await fetch('/api/dashboard/quizzes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setAttempts(result.data.attempts);
          setStats(result.data.stats);
        }
      } catch (error) {
        console.error('Error fetching quiz results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user, token, router]);

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'نتائج الاختبارات' : 'Quiz Results'}
          </h1>
          <p className="text-gray-600">
            {language === 'ar'
              ? 'تتبع أدائك في جميع الاختبارات'
              : 'Track your performance in all quizzes'}
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    {language === 'ar' ? 'اختبارات ناجحة' : 'Passed'}
                  </p>
                  <p className="text-2xl font-bold text-green-600">{stats.passedAttempts}</p>
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
                    {language === 'ar' ? 'متوسط النتيجة' : 'Average Score'}
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

        {/* Results List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {language === 'ar' ? 'سجل المحاولات' : 'Attempt History'}
            </h2>
          </div>

          {attempts.length === 0 ? (
            <div className="p-12 text-center">
              <FileQuestion className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'لا توجد نتائج بعد' : 'No Results Yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'ar'
                  ? 'لم تقم بإجراء أي اختبارات حتى الآن'
                  : "You haven't taken any quizzes yet"}
              </p>
              <Link href="/dashboard/courses" className="btn-primary">
                {language === 'ar' ? 'استعرض دوراتك' : 'Browse Your Courses'}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {language === 'ar' ? attempt.quiz.titleAr : attempt.quiz.titleEn}
                        </h3>
                        {attempt.passed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            {language === 'ar' ? 'ناجح' : 'Passed'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3" />
                            {language === 'ar' ? 'راسب' : 'Failed'}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mb-2">
                        {language === 'ar'
                          ? attempt.quiz.course.titleAr
                          : attempt.quiz.course.titleEn}
                        {attempt.quiz.lesson && (
                          <>
                            {' • '}
                            {language === 'ar'
                              ? attempt.quiz.lesson.titleAr
                              : attempt.quiz.lesson.titleEn}
                          </>
                        )}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {attempt.earnedPoints}/{attempt.totalPoints}{' '}
                          {language === 'ar' ? 'نقطة' : 'points'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(attempt.timeSpent)}
                        </span>
                        <span>{formatDate(attempt.completedAt!)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div
                        className={`text-3xl font-bold ${
                          attempt.passed ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {attempt.score}%
                      </div>
                      <Link
                        href={`/courses/${attempt.quiz.course.id}/quizzes/${attempt.quiz.id}`}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Arrow className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
