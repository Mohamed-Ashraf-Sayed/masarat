'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Play,
  CheckCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  Clock,
  Award,
  ArrowLeft,
  Loader2,
  PlayCircle,
  FileQuestion,
  FileText,
  Download,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: { ar: string; en: string };
  duration: number | null;
  videoUrl: string | null;
  isFree: boolean;
  order: number;
  isCompleted?: boolean;
  requireQuizPass?: boolean;
}

interface LessonQuiz {
  id: string;
  titleAr: string;
  titleEn: string;
  questionsCount: number;
  passingScore: number;
  timeLimit: number | null;
  hasPassed: boolean;
  bestScore: number | null;
  canAttempt: boolean;
}

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface CourseData {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  thumbnail: string;
  lessons: Lesson[];
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
  };
  enrollment?: {
    progress: number;
    status: string;
  };
}

export default function LearnPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language, direction } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [lessonQuizzes, setLessonQuizzes] = useState<Record<string, LessonQuiz>>({});
  const [lessonResources, setLessonResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    // انتظر حتى يتم تحميل بيانات المستخدم
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const fetchCourseData = async () => {
      try {
        // جلب بيانات الكورس
        const courseRes = await fetch(`/api/courses/${id}`);
        const courseResult = await courseRes.json();

        if (!courseResult.success) {
          router.push('/courses');
          return;
        }

        // جلب بيانات التسجيل والتقدم
        if (token) {
          const enrollmentRes = await fetch(`/api/enrollments/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const enrollmentResult = await enrollmentRes.json();

          if (enrollmentResult.success) {
            courseResult.data.enrollment = enrollmentResult.data;
            setCompletedLessons(enrollmentResult.data.completedLessons || []);
          }
        }

        setCourse(courseResult.data);

        // تحديد الدرس الحالي
        if (courseResult.data.lessons.length > 0) {
          setCurrentLesson(courseResult.data.lessons[0]);
        }

        // جلب اختبارات الدروس
        if (token) {
          const quizzesRes = await fetch(`/api/courses/${id}/quizzes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const quizzesResult = await quizzesRes.json();
          if (quizzesResult.success) {
            const quizMap: Record<string, LessonQuiz> = {};
            quizzesResult.data.forEach((quiz: { lesson?: { id: string }; id: string; titleAr: string; titleEn: string; questionsCount: number; passingScore: number; timeLimit: number | null; hasPassed: boolean; bestScore: number | null; canAttempt: boolean }) => {
              if (quiz.lesson) {
                quizMap[quiz.lesson.id] = {
                  id: quiz.id,
                  titleAr: quiz.titleAr,
                  titleEn: quiz.titleEn,
                  questionsCount: quiz.questionsCount,
                  passingScore: quiz.passingScore,
                  timeLimit: quiz.timeLimit,
                  hasPassed: quiz.hasPassed,
                  bestScore: quiz.bestScore,
                  canAttempt: quiz.canAttempt,
                };
              }
            });
            setLessonQuizzes(quizMap);
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id, user, token, router, authLoading]);

  // Fetch resources when lesson changes
  useEffect(() => {
    if (!currentLesson || !token) {
      setLessonResources([]);
      return;
    }

    const fetchResources = async () => {
      setLoadingResources(true);
      try {
        const res = await fetch(`/api/courses/${id}/lessons/${currentLesson.id}/resources`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) {
          setLessonResources(result.data);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, [currentLesson, id, token]);

  const handleLessonComplete = async (lessonId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/enrollments/${id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonId }),
      });

      const result = await response.json();
      if (result.success) {
        setCompletedLessons(prev => [...prev, lessonId]);
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const navigateLesson = (direction: 'prev' | 'next') => {
    if (!course || !currentLesson) return;

    const currentIndex = course.lessons.findIndex(l => l.id === currentLesson.id);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < course.lessons.length) {
      setCurrentLesson(course.lessons[newIndex]);
    }
  };

  const calculateProgress = () => {
    if (!course || course.lessons.length === 0) return 0;
    return Math.round((completedLessons.length / course.lessons.length) * 100);
  };

  // Helper function to extract YouTube video ID
  const getYouTubeId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
  };

  // Helper function to extract Vimeo video ID
  const getVimeoId = (url: string): string => {
    const regExp = /vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : '';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'ar' ? 'الدورة غير موجودة' : 'Course not found'}
          </h1>
          <Link href="/courses" className="btn-primary">
            {language === 'ar' ? 'العودة للدورات' : 'Back to Courses'}
          </Link>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const currentIndex = currentLesson ? course.lessons.findIndex(l => l.id === currentLesson.id) : 0;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 start-0 z-40 w-80 bg-gray-800 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : direction === 'rtl' ? 'translate-x-full' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/courses/${id}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">{language === 'ar' ? 'العودة للدورة' : 'Back to Course'}</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="font-bold text-white text-lg line-clamp-2 mb-3">
            {course.title[language]}
          </h2>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {language === 'ar' ? 'التقدم' : 'Progress'}
              </span>
              <span className="text-primary-400 font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {completedLessons.length} / {course.lessons.length} {language === 'ar' ? 'درس مكتمل' : 'lessons completed'}
            </p>
          </div>

          {/* Quizzes Link */}
          <Link
            href={`/courses/${id}/quizzes`}
            className="mt-4 flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl text-white hover:bg-gray-700 transition-colors"
          >
            <FileQuestion className="w-5 h-5 text-primary-400" />
            <span className="text-sm font-medium">
              {language === 'ar' ? 'اختبارات الدورة' : 'Course Quizzes'}
            </span>
          </Link>
        </div>

        {/* Lessons List */}
        <div className="overflow-y-auto h-[calc(100vh-200px)]">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">
              {language === 'ar' ? 'محتوى الدورة' : 'Course Content'}
            </h3>
            <div className="space-y-1">
              {course.lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const isCurrent = currentLesson?.id === lesson.id;
                const isNotEnrolled = !lesson.isFree && !course.enrollment;

                // Check if previous lesson quiz must be passed
                let isQuizLocked = false;
                let previousLessonName = '';
                if (index > 0 && lesson.requireQuizPass && course.enrollment) {
                  const previousLesson = course.lessons[index - 1];
                  const previousQuiz = lessonQuizzes[previousLesson.id];
                  if (previousQuiz && !previousQuiz.hasPassed) {
                    isQuizLocked = true;
                    previousLessonName = previousLesson.title[language];
                  }
                }

                const isLocked = isNotEnrolled || isQuizLocked;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => !isLocked && setCurrentLesson(lesson)}
                    disabled={isLocked}
                    title={isQuizLocked
                      ? (language === 'ar'
                          ? `يجب اجتياز اختبار: ${previousLessonName}`
                          : `Must pass quiz: ${previousLessonName}`)
                      : undefined
                    }
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-start ${
                      isCurrent
                        ? 'bg-primary-600/20 border border-primary-500/50'
                        : isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-500'
                          : isCurrent
                          ? 'bg-primary-500'
                          : isQuizLocked
                          ? 'bg-orange-600'
                          : 'bg-gray-700'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : isLocked ? (
                        <Lock className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-sm text-white">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isCurrent ? 'text-primary-400' : isQuizLocked ? 'text-orange-400' : 'text-white'
                        }`}
                      >
                        {lesson.title[language]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lesson.duration || 0} {language === 'ar' ? 'دقيقة' : 'min'}
                        {isQuizLocked && (
                          <span className="text-orange-400 ms-2">
                            {language === 'ar' ? '• يتطلب اجتياز الاختبار' : '• Quiz required'}
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateLesson('prev')}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            >
              {direction === 'rtl' ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {language === 'ar' ? 'السابق' : 'Previous'}
              </span>
            </button>

            <button
              onClick={() => navigateLesson('next')}
              disabled={currentIndex === course.lessons.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
            >
              <span className="hidden sm:inline">
                {language === 'ar' ? 'التالي' : 'Next'}
              </span>
              {direction === 'rtl' ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 bg-black flex items-center justify-center">
          {currentLesson ? (
            currentLesson.videoUrl ? (
              // Check if it's a YouTube video
              currentLesson.videoUrl.includes('youtube.com') || currentLesson.videoUrl.includes('youtu.be') ? (
                <iframe
                  key={currentLesson.id}
                  src={`https://www.youtube.com/embed/${getYouTubeId(currentLesson.videoUrl)}?rel=0`}
                  className="w-full h-full max-h-[70vh] aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : currentLesson.videoUrl.includes('vimeo.com') ? (
                // Vimeo video
                <iframe
                  key={currentLesson.id}
                  src={`https://player.vimeo.com/video/${getVimeoId(currentLesson.videoUrl)}`}
                  className="w-full h-full max-h-[70vh] aspect-video"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                // Direct video file
                <video
                  key={currentLesson.id}
                  src={currentLesson.videoUrl}
                  controls
                  className="w-full h-full max-h-[70vh] object-contain"
                  onEnded={() => handleLessonComplete(currentLesson.id)}
                />
              )
            ) : (
              <div className="text-center text-white p-8">
                <PlayCircle className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {currentLesson.title[language]}
                </h3>
                <p className="text-gray-400 mb-6">
                  {language === 'ar'
                    ? 'الفيديو غير متاح حالياً'
                    : 'Video not available yet'}
                </p>
                <button
                  onClick={() => handleLessonComplete(currentLesson.id)}
                  className="btn-primary"
                >
                  {language === 'ar' ? 'تحديد كمكتمل' : 'Mark as Complete'}
                </button>
              </div>
            )
          ) : (
            <div className="text-center text-gray-400">
              <BookOpen className="w-16 h-16 mx-auto mb-4" />
              <p>{language === 'ar' ? 'اختر درساً للبدء' : 'Select a lesson to start'}</p>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        {currentLesson && (
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {currentLesson.title[language]}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {currentLesson.duration || 0} {language === 'ar' ? 'دقيقة' : 'min'}
                    </span>
                    <span>
                      {language === 'ar' ? 'الدرس' : 'Lesson'} {currentIndex + 1} / {course.lessons.length}
                    </span>
                  </div>
                </div>

                {!completedLessons.includes(currentLesson.id) && (
                  <button
                    onClick={() => handleLessonComplete(currentLesson.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{language === 'ar' ? 'تحديد كمكتمل' : 'Mark Complete'}</span>
                  </button>
                )}

                {completedLessons.includes(currentLesson.id) && (
                  <span className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    {language === 'ar' ? 'مكتمل' : 'Completed'}
                  </span>
                )}
              </div>

              {/* Lesson Quiz */}
              {lessonQuizzes[currentLesson.id] && (
                <div className="mt-4 p-4 bg-gradient-to-r from-primary-600/20 to-primary-500/20 border border-primary-500/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileQuestion className="w-8 h-8 text-primary-400" />
                      <div>
                        <h3 className="font-bold text-primary-400">
                          {language === 'ar'
                            ? lessonQuizzes[currentLesson.id].titleAr
                            : lessonQuizzes[currentLesson.id].titleEn}
                        </h3>
                        <p className="text-sm text-primary-200/70">
                          {lessonQuizzes[currentLesson.id].questionsCount}{' '}
                          {language === 'ar' ? 'سؤال' : 'questions'}
                          {' • '}
                          {lessonQuizzes[currentLesson.id].passingScore}%{' '}
                          {language === 'ar' ? 'للنجاح' : 'to pass'}
                          {lessonQuizzes[currentLesson.id].timeLimit && (
                            <>
                              {' • '}
                              {lessonQuizzes[currentLesson.id].timeLimit}{' '}
                              {language === 'ar' ? 'دقيقة' : 'min'}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {lessonQuizzes[currentLesson.id].hasPassed && (
                        <span className="text-green-400 text-sm font-medium">
                          {language === 'ar' ? 'ناجح' : 'Passed'}{' '}
                          ({lessonQuizzes[currentLesson.id].bestScore}%)
                        </span>
                      )}
                      {lessonQuizzes[currentLesson.id].canAttempt ? (
                        <Link
                          href={`/courses/${id}/quizzes/${lessonQuizzes[currentLesson.id].id}`}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                        >
                          {lessonQuizzes[currentLesson.id].bestScore !== null
                            ? language === 'ar'
                              ? 'إعادة الاختبار'
                              : 'Retake Quiz'
                            : language === 'ar'
                            ? 'ابدأ الاختبار'
                            : 'Start Quiz'}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {language === 'ar' ? 'انتهت المحاولات' : 'No attempts left'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson Resources */}
              {lessonResources.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-6 h-6 text-blue-400" />
                    <h3 className="font-bold text-blue-400">
                      {language === 'ar' ? 'المرفقات' : 'Attachments'}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {lessonResources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
                      >
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span className="flex-1 text-white text-sm">{resource.title}</span>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate */}
              {progress === 100 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h3 className="font-bold text-yellow-400">
                        {language === 'ar' ? 'تهانينا! أكملت الدورة' : 'Congratulations! Course Completed'}
                      </h3>
                      <p className="text-sm text-yellow-200/70">
                        {language === 'ar'
                          ? 'يمكنك الآن تحميل شهادتك'
                          : 'You can now download your certificate'}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/certificates`}
                      className="ms-auto px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
                    >
                      {language === 'ar' ? 'عرض الشهادة' : 'View Certificate'}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
