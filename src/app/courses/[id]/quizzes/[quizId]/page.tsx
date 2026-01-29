'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  FileQuestion,
} from 'lucide-react';

interface Question {
  id: string;
  questionAr: string;
  questionEn: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options: Array<{ ar: string; en: string }>;
  points: number;
  order: number;
}

interface Quiz {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  passingScore: number;
  timeLimit: number | null;
  showResults: boolean;
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
  questions: Question[];
  totalPoints: number;
  canAttempt: boolean;
  attemptsCount: number;
  maxAttempts: number | null;
  bestScore: number | null;
}

interface QuizResult {
  id: string;
  score: number;
  totalPoints: number;
  earnedPoints: number;
  passed: boolean;
  passingScore: number;
  timeSpent: number | null;
  questionsCount?: number;
  correctCount?: number;
  answers?: Array<{
    questionId: string;
    answer: string | number;
    isCorrect: boolean;
    correctAnswer?: string | number;
    explanation?: string;
  }>;
}

export default function TakeQuizPage() {
  const { id: courseId, quizId } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !token) {
        router.push(`/login?redirect=/courses/${courseId}/quizzes/${quizId}`);
        return;
      }
      fetchQuiz();
    }
  }, [authLoading, user, token, courseId, quizId]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timeLeft]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      console.log('Quiz API response:', result);
      if (result.success) {
        console.log('Quiz questions:', result.data.questions);
        console.log('First question options:', result.data.questions[0]?.options);
        setQuiz(result.data);
        if (!result.data.canAttempt) {
          // Quiz can't be attempted
        }
      } else {
        alert(result.error);
        router.push(`/courses/${courseId}/quizzes`);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (!quiz) return;
    setStarted(true);
    setStartTime(Date.now());
    if (quiz.timeLimit) {
      setTimeLeft(quiz.timeLimit * 60); // Convert to seconds
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    try {
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: quiz.questions.map((q) => ({
            questionId: q.id,
            answer: answers[q.id] ?? '',
          })),
          timeSpent,
        }),
      });

      const resultData = await response.json();
      if (resultData.success) {
        setResult(resultData.data);
        setStarted(false);
      } else {
        alert(resultData.error);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  }, [quiz, answers, startTime, quizId, token, submitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setAnswer = (questionId: string, answer: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
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

  if (!quiz) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="pt-32 text-center">
          <p className="text-gray-500">
            {language === 'ar' ? 'الاختبار غير موجود' : 'Quiz not found'}
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  // Result Screen
  if (result) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />

        <div className="pt-28 pb-20">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              {/* Score Circle */}
              <div
                className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 ${
                  result.passed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                <div>
                  <div className="text-4xl font-bold">{result.score}%</div>
                  {result.passed ? (
                    <Trophy className="w-6 h-6 mx-auto mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 mx-auto mt-1" />
                  )}
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {result.passed
                  ? language === 'ar'
                    ? 'مبروك! لقد نجحت'
                    : 'Congratulations! You Passed'
                  : language === 'ar'
                  ? 'للأسف، لم تنجح'
                  : "Sorry, You Didn't Pass"}
              </h1>

              <p className="text-gray-600 mb-6">
                {language === 'ar'
                  ? `لقد حصلت على ${result.earnedPoints} من ${result.totalPoints} نقطة`
                  : `You scored ${result.earnedPoints} out of ${result.totalPoints} points`}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.score}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {language === 'ar' ? 'النتيجة' : 'Score'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.passingScore}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {language === 'ar' ? 'حد النجاح' : 'Pass Mark'}
                  </div>
                </div>
                {result.timeSpent && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatTime(result.timeSpent)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {language === 'ar' ? 'الوقت' : 'Time'}
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Results */}
              {result.answers && result.answers.length > 0 && (
                <div className="text-start mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {language === 'ar' ? 'تفاصيل الإجابات' : 'Answer Details'}
                  </h3>
                  <div className="space-y-3">
                    {quiz.questions.map((question, index) => {
                      const answerDetail = result.answers?.find(
                        (a) => a.questionId === question.id
                      );
                      return (
                        <div
                          key={question.id}
                          className={`p-4 rounded-lg border ${
                            answerDetail?.isCorrect
                              ? 'border-green-200 bg-green-50'
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {answerDetail?.isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {index + 1}.{' '}
                                {language === 'ar'
                                  ? question.questionAr
                                  : question.questionEn}
                              </p>
                              {!answerDetail?.isCorrect &&
                                answerDetail?.correctAnswer !== undefined && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {language === 'ar'
                                      ? 'الإجابة الصحيحة: '
                                      : 'Correct answer: '}
                                    {question.type === 'SHORT_ANSWER'
                                      ? answerDetail.correctAnswer
                                      : question.options[
                                          answerDetail.correctAnswer as number
                                        ]?.[language === 'ar' ? 'ar' : 'en']}
                                  </p>
                                )}
                              {answerDetail?.explanation && (
                                <p className="text-sm text-blue-600 mt-1">
                                  {answerDetail.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/courses/${courseId}/learn`}
                  className="btn-primary"
                >
                  {language === 'ar' ? 'متابعة الدورة' : 'Continue Course'}
                </Link>
                {quiz.canAttempt &&
                  (!quiz.maxAttempts ||
                    quiz.attemptsCount + 1 < quiz.maxAttempts) && (
                    <button
                      onClick={() => {
                        setResult(null);
                        setAnswers({});
                        setCurrentQuestion(0);
                        fetchQuiz();
                      }}
                      className="btn-secondary"
                    >
                      {language === 'ar' ? 'إعادة الاختبار' : 'Retry Quiz'}
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  // Start Screen
  if (!started) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />

        <div className="pt-28 pb-20">
          <div className="max-w-2xl mx-auto px-4">
            <Link
              href={`/courses/${courseId}/quizzes`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              {language === 'ar' ? (
                <ArrowRight className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
              {language === 'ar' ? 'العودة للاختبارات' : 'Back to Quizzes'}
            </Link>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'ar' ? quiz.titleAr : quiz.titleEn}
              </h1>

              {(quiz.descriptionAr || quiz.descriptionEn) && (
                <p className="text-gray-600 mb-6">
                  {language === 'ar' ? quiz.descriptionAr : quiz.descriptionEn}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {quiz.questions.length}
                  </div>
                  <div className="text-sm text-gray-500">
                    {language === 'ar' ? 'سؤال' : 'Questions'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {quiz.passingScore}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {language === 'ar' ? 'للنجاح' : 'To Pass'}
                  </div>
                </div>
                {quiz.timeLimit && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {quiz.timeLimit}
                    </div>
                    <div className="text-sm text-gray-500">
                      {language === 'ar' ? 'دقيقة' : 'Minutes'}
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {quiz.totalPoints}
                  </div>
                  <div className="text-sm text-gray-500">
                    {language === 'ar' ? 'نقطة' : 'Points'}
                  </div>
                </div>
              </div>

              {quiz.timeLimit && (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-xl text-yellow-800 mb-6">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">
                    {language === 'ar'
                      ? `لديك ${quiz.timeLimit} دقيقة لإكمال هذا الاختبار. سيتم تسليم إجاباتك تلقائياً عند انتهاء الوقت.`
                      : `You have ${quiz.timeLimit} minutes to complete this quiz. Your answers will be automatically submitted when time runs out.`}
                  </span>
                </div>
              )}

              {quiz.canAttempt ? (
                <button
                  onClick={startQuiz}
                  className="w-full btn-primary py-3 text-lg"
                >
                  {language === 'ar' ? 'ابدأ الاختبار' : 'Start Quiz'}
                </button>
              ) : (
                <div className="text-center text-red-600">
                  {language === 'ar'
                    ? 'لقد استنفدت جميع المحاولات المتاحة'
                    : 'You have used all available attempts'}
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  // Quiz Taking Screen
  const question = quiz.questions[currentQuestion];

  // Safety check - if no questions or invalid question index
  if (!question || quiz.questions.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="pt-32 pb-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <FileQuestion className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد أسئلة' : 'No Questions'}
            </h2>
            <p className="text-gray-600 mb-4">
              {language === 'ar'
                ? 'هذا الاختبار لا يحتوي على أسئلة بعد'
                : 'This quiz has no questions yet'}
            </p>
            <Link href={`/courses/${courseId}/quizzes`} className="btn-primary">
              {language === 'ar' ? 'العودة للاختبارات' : 'Back to Quizzes'}
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Fixed Header with Timer */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {language === 'ar' ? quiz.titleAr : quiz.titleEn}
              </span>
            </div>
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  timeLeft < 60
                    ? 'bg-red-100 text-red-700'
                    : timeLeft < 300
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-mono font-semibold">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{
                width: `${
                  (Object.keys(answers).length / quiz.questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="pt-24 pb-32">
        <div className="max-w-3xl mx-auto px-4">
          {/* Question Navigation */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {quiz.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                  currentQuestion === index
                    ? 'bg-primary-600 text-white'
                    : answers[q.id] !== undefined
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-gray-500">
                {language === 'ar'
                  ? `السؤال ${currentQuestion + 1} من ${quiz.questions.length}`
                  : `Question ${currentQuestion + 1} of ${quiz.questions.length}`}
              </span>
              <span className="text-sm text-primary-600 font-medium">
                {question.points}{' '}
                {language === 'ar'
                  ? question.points === 1
                    ? 'نقطة'
                    : 'نقاط'
                  : question.points === 1
                  ? 'point'
                  : 'points'}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {language === 'ar' ? question.questionAr : question.questionEn}
            </h2>

            {/* Answer Options */}
            {question.type === 'SHORT_ANSWER' ? (
              <input
                type="text"
                value={(answers[question.id] as string) || ''}
                onChange={(e) => setAnswer(question.id, e.target.value)}
                placeholder={
                  language === 'ar' ? 'اكتب إجابتك هنا...' : 'Type your answer here...'
                }
                className="input-field text-lg"
              />
            ) : Array.isArray(question.options) && question.options.length > 0 ? (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setAnswer(question.id, index)}
                    className={`w-full p-4 rounded-xl border-2 text-start transition-all ${
                      answers[question.id] === index
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          answers[question.id] === index
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {answers[question.id] === index && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </div>
                      <span
                        className={
                          answers[question.id] === index
                            ? 'text-primary-700 font-medium'
                            : 'text-gray-700'
                        }
                      >
                        {language === 'ar' ? option.ar : option.en}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-red-500 p-4 bg-red-50 rounded-xl">
                {language === 'ar' ? 'لا توجد خيارات لهذا السؤال' : 'No options available for this question'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              {language === 'ar' ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
              {language === 'ar' ? 'السابق' : 'Previous'}
            </button>

            <span className="text-sm text-gray-500">
              {Object.keys(answers).length}/{quiz.questions.length}{' '}
              {language === 'ar' ? 'مُجاب' : 'answered'}
            </span>

            {currentQuestion === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {language === 'ar' ? 'تسليم' : 'Submit'}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestion((prev) =>
                    Math.min(quiz.questions.length - 1, prev + 1)
                  )
                }
                className="btn-primary flex items-center gap-2"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
                {language === 'ar' ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
