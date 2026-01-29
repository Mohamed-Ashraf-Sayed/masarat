'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  FileQuestion,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  Trophy,
  RotateCcw,
} from 'lucide-react';

interface Quiz {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  passingScore: number;
  timeLimit: number | null;
  maxAttempts: number | null;
  lesson: {
    id: string;
    titleAr: string;
    titleEn: string;
  } | null;
  questionsCount: number;
  attemptsCount: number;
  bestScore: number | null;
  hasPassed: boolean;
  canAttempt: boolean;
  lastAttempt: {
    id: string;
    score: number;
    passed: boolean;
    completedAt: string;
  } | null;
}

export default function CourseQuizzesPage() {
  const { id: courseId } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState({ ar: '', en: '' });

  useEffect(() => {
    if (!authLoading) {
      if (!user || !token) {
        router.push(`/login?redirect=/courses/${courseId}/quizzes`);
        return;
      }
      fetchQuizzes();
      fetchCourseInfo();
    }
  }, [authLoading, user, token, courseId]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setQuizzes(result.data);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseInfo = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const result = await response.json();
      if (result.success) {
        setCourseName({
          ar: result.data.title.ar,
          en: result.data.title.en,
        });
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar variant="solid" />

      <div className="pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href={`/courses/${courseId}/learn`}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {language === 'ar' ? (
                <ArrowRight className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'ar' ? 'اختبارات الدورة' : 'Course Quizzes'}
              </h1>
              <p className="text-gray-600">
                {language === 'ar' ? courseName.ar : courseName.en}
              </p>
            </div>
          </div>

          {/* Quizzes List */}
          {quizzes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <FileQuestion className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'ar'
                  ? 'لا توجد اختبارات متاحة'
                  : 'No Quizzes Available'}
              </h2>
              <p className="text-gray-600">
                {language === 'ar'
                  ? 'سيتم إضافة اختبارات قريباً'
                  : 'Quizzes will be added soon'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {language === 'ar' ? quiz.titleAr : quiz.titleEn}
                        </h3>
                        {quiz.hasPassed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Trophy className="w-3 h-3" />
                            {language === 'ar' ? 'ناجح' : 'Passed'}
                          </span>
                        )}
                      </div>

                      {(quiz.descriptionAr || quiz.descriptionEn) && (
                        <p className="text-gray-600 text-sm mb-3">
                          {language === 'ar'
                            ? quiz.descriptionAr
                            : quiz.descriptionEn}
                        </p>
                      )}

                      {quiz.lesson && (
                        <p className="text-sm text-gray-500 mb-3">
                          {language === 'ar' ? 'الدرس: ' : 'Lesson: '}
                          {language === 'ar'
                            ? quiz.lesson.titleAr
                            : quiz.lesson.titleEn}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FileQuestion className="w-4 h-4" />
                          <span>
                            {quiz.questionsCount}{' '}
                            {language === 'ar' ? 'سؤال' : 'questions'}
                          </span>
                        </div>
                        {quiz.timeLimit && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {quiz.timeLimit}{' '}
                              {language === 'ar' ? 'دقيقة' : 'min'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>
                            {quiz.passingScore}%{' '}
                            {language === 'ar' ? 'للنجاح' : 'to pass'}
                          </span>
                        </div>
                        {quiz.maxAttempts && (
                          <div className="flex items-center gap-1">
                            <RotateCcw className="w-4 h-4" />
                            <span>
                              {quiz.attemptsCount}/{quiz.maxAttempts}{' '}
                              {language === 'ar' ? 'محاولات' : 'attempts'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Last Attempt Info */}
                      {quiz.lastAttempt && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {language === 'ar'
                                ? 'آخر محاولة'
                                : 'Last Attempt'}
                            </span>
                            <span
                              className={`font-semibold ${
                                quiz.lastAttempt.passed
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {quiz.lastAttempt.score}%
                              {quiz.lastAttempt.passed ? (
                                <CheckCircle className="w-4 h-4 inline ms-1" />
                              ) : (
                                <XCircle className="w-4 h-4 inline ms-1" />
                              )}
                            </span>
                          </div>
                          {quiz.bestScore !== null &&
                            quiz.bestScore !== quiz.lastAttempt.score && (
                              <div className="flex items-center justify-between text-sm mt-1">
                                <span className="text-gray-600">
                                  {language === 'ar'
                                    ? 'أفضل نتيجة'
                                    : 'Best Score'}
                                </span>
                                <span className="font-semibold text-primary-600">
                                  {quiz.bestScore}%
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {quiz.canAttempt ? (
                        <Link
                          href={`/courses/${courseId}/quizzes/${quiz.id}`}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          {quiz.attemptsCount > 0
                            ? language === 'ar'
                              ? 'إعادة'
                              : 'Retry'
                            : language === 'ar'
                            ? 'ابدأ'
                            : 'Start'}
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="btn-secondary opacity-50 cursor-not-allowed"
                        >
                          {language === 'ar'
                            ? 'انتهت المحاولات'
                            : 'No Attempts Left'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
