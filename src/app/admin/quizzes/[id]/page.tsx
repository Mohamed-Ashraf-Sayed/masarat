'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  CheckCircle,
  Circle,
  X,
  FileQuestion,
  Clock,
  BarChart2,
  Users,
} from 'lucide-react';

interface Question {
  id: string;
  questionAr: string;
  questionEn: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options: Array<{ ar: string; en: string; isCorrect?: boolean }>;
  correctAnswer: string;
  points: number;
  order: number;
  explanation: string | null;
}

interface Quiz {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  passingScore: number;
  timeLimit: number | null;
  isPublished: boolean;
  showResults: boolean;
  shuffleQuestions: boolean;
  maxAttempts: number | null;
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
  stats: {
    totalAttempts: number;
    passedAttempts: number;
    averageScore: number;
  };
}

export default function QuizQuestionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { token, isLoading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [questionForm, setQuestionForm] = useState({
    questionAr: '',
    questionEn: '',
    type: 'MULTIPLE_CHOICE' as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER',
    options: [
      { ar: '', en: '', isCorrect: false },
      { ar: '', en: '', isCorrect: false },
      { ar: '', en: '', isCorrect: false },
      { ar: '', en: '', isCorrect: false },
    ],
    correctAnswer: '',
    points: 1,
    explanation: '',
  });

  useEffect(() => {
    if (!authLoading && token && id) {
      fetchQuiz();
    }
  }, [authLoading, token, id]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/admin/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setQuiz(result.data);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingQuestion
        ? `/api/admin/questions/${editingQuestion.id}`
        : `/api/admin/quizzes/${id}/questions`;

      const response = await fetch(url, {
        method: editingQuestion ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...questionForm,
          options:
            questionForm.type === 'SHORT_ANSWER' ? [] : questionForm.options,
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchQuiz();
        setShowQuestionModal(false);
        resetQuestionForm();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        fetchQuiz();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
    setDeleteConfirm(null);
  };

  const openEditQuestionModal = (question: Question) => {
    setEditingQuestion(question);
    // Parse options if it's a string with proper error handling
    let questionOptions: Array<{ ar: string; en: string; isCorrect?: boolean }> = [];
    try {
      if (typeof question.options === 'string') {
        questionOptions = JSON.parse(question.options);
      } else if (Array.isArray(question.options)) {
        questionOptions = question.options;
      }
    } catch {
      console.error('Failed to parse question options:', question.options);
      questionOptions = [];
    }

    const correctAnswerIndex = parseInt(question.correctAnswer, 10);

    setQuestionForm({
      questionAr: question.questionAr,
      questionEn: question.questionEn,
      type: question.type,
      options:
        question.type === 'SHORT_ANSWER'
          ? [
              { ar: '', en: '', isCorrect: false },
              { ar: '', en: '', isCorrect: false },
              { ar: '', en: '', isCorrect: false },
              { ar: '', en: '', isCorrect: false },
            ]
          : Array.isArray(questionOptions) && questionOptions.length > 0
            ? questionOptions.map((opt, index) => ({
                ar: opt?.ar || '',
                en: opt?.en || '',
                isCorrect: opt?.isCorrect === true || index === correctAnswerIndex
              }))
            : [
                { ar: '', en: '', isCorrect: false },
                { ar: '', en: '', isCorrect: false },
                { ar: '', en: '', isCorrect: false },
                { ar: '', en: '', isCorrect: false },
              ],
      correctAnswer: question.correctAnswer,
      points: question.points,
      explanation: question.explanation || '',
    });
    setShowQuestionModal(true);
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionForm({
      questionAr: '',
      questionEn: '',
      type: 'MULTIPLE_CHOICE',
      options: [
        { ar: '', en: '', isCorrect: false },
        { ar: '', en: '', isCorrect: false },
        { ar: '', en: '', isCorrect: false },
        { ar: '', en: '', isCorrect: false },
      ],
      correctAnswer: '',
      points: 1,
      explanation: '',
    });
  };

  const handleTypeChange = (type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER') => {
    if (type === 'TRUE_FALSE') {
      setQuestionForm({
        ...questionForm,
        type,
        options: [
          { ar: 'صح', en: 'True', isCorrect: false },
          { ar: 'خطأ', en: 'False', isCorrect: false },
        ],
      });
    } else if (type === 'MULTIPLE_CHOICE') {
      setQuestionForm({
        ...questionForm,
        type,
        options: [
          { ar: '', en: '', isCorrect: false },
          { ar: '', en: '', isCorrect: false },
          { ar: '', en: '', isCorrect: false },
          { ar: '', en: '', isCorrect: false },
        ],
      });
    } else {
      setQuestionForm({
        ...questionForm,
        type,
        options: [],
      });
    }
  };

  const setCorrectOption = (index: number) => {
    const newOptions = questionForm.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const updateOption = (index: number, field: 'ar' | 'en', value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!quiz) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">
            {language === 'ar' ? 'الاختبار غير موجود' : 'Quiz not found'}
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/quizzes')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {language === 'ar' ? (
              <ArrowRight className="w-5 h-5" />
            ) : (
              <ArrowLeft className="w-5 h-5" />
            )}
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? quiz.titleAr : quiz.titleEn}
            </h1>
            <p className="text-gray-600">
              {language === 'ar' ? quiz.course.titleAr : quiz.course.titleEn}
              {quiz.lesson && (
                <>
                  {' - '}
                  {language === 'ar' ? quiz.lesson.titleAr : quiz.lesson.titleEn}
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              resetQuestionForm();
              setShowQuestionModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {language === 'ar' ? 'إضافة سؤال' : 'Add Question'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileQuestion className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz.questions.length}
                </p>
                <p className="text-sm text-gray-500">
                  {language === 'ar' ? 'سؤال' : 'Questions'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz.stats.totalAttempts}
                </p>
                <p className="text-sm text-gray-500">
                  {language === 'ar' ? 'محاولة' : 'Attempts'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz.stats.averageScore}%
                </p>
                <p className="text-sm text-gray-500">
                  {language === 'ar' ? 'متوسط الدرجات' : 'Avg Score'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz.stats.totalAttempts > 0
                    ? Math.round(
                        (quiz.stats.passedAttempts / quiz.stats.totalAttempts) * 100
                      )
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-500">
                  {language === 'ar' ? 'نسبة النجاح' : 'Pass Rate'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {language === 'ar' ? 'الأسئلة' : 'Questions'}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {quiz.questions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FileQuestion className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {language === 'ar'
                    ? 'لا توجد أسئلة. أضف سؤالك الأول!'
                    : 'No questions yet. Add your first question!'}
                </p>
              </div>
            ) : (
              quiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-4 hover:bg-gray-50 flex items-start gap-4"
                >
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical className="w-5 h-5 cursor-move" />
                    <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 mb-1">
                      {language === 'ar' ? question.questionAr : question.questionEn}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {question.type === 'MULTIPLE_CHOICE'
                          ? language === 'ar'
                            ? 'اختيار من متعدد'
                            : 'Multiple Choice'
                          : question.type === 'TRUE_FALSE'
                          ? language === 'ar'
                            ? 'صح/خطأ'
                            : 'True/False'
                          : language === 'ar'
                          ? 'إجابة قصيرة'
                          : 'Short Answer'}
                      </span>
                      <span>
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
                    {question.type !== 'SHORT_ANSWER' && (() => {
                      // Parse options if it's a string
                      const parsedOptions = typeof question.options === 'string'
                        ? JSON.parse(question.options)
                        : question.options;
                      const correctAnswerIndex = parseInt(question.correctAnswer, 10);

                      return (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {Array.isArray(parsedOptions) && parsedOptions.map(
                            (option: { ar: string; en: string; isCorrect?: boolean }, optIndex: number) => {
                              const isCorrect = option.isCorrect === true || optIndex === correctAnswerIndex;
                              return (
                                <div
                                  key={optIndex}
                                  className={`text-sm px-3 py-1.5 rounded flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'bg-gray-50 text-gray-600'
                                  }`}
                                >
                                  {isCorrect ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-gray-400" />
                                  )}
                                  {language === 'ar' ? option.ar : option.en}
                                </div>
                              );
                            }
                          )}
                        </div>
                      );
                    })()}
                    {question.type === 'SHORT_ANSWER' && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">
                          {language === 'ar' ? 'الإجابة: ' : 'Answer: '}
                        </span>
                        {question.correctAnswer}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditQuestionModal(question)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(question.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Question Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingQuestion
                    ? language === 'ar'
                      ? 'تعديل السؤال'
                      : 'Edit Question'
                    : language === 'ar'
                    ? 'إضافة سؤال جديد'
                    : 'Add New Question'}
                </h2>
                <button
                  onClick={() => {
                    setShowQuestionModal(false);
                    resetQuestionForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'نوع السؤال' : 'Question Type'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: 'MULTIPLE_CHOICE',
                        labelAr: 'اختيار من متعدد',
                        labelEn: 'Multiple Choice',
                      },
                      {
                        value: 'TRUE_FALSE',
                        labelAr: 'صح / خطأ',
                        labelEn: 'True / False',
                      },
                      {
                        value: 'SHORT_ANSWER',
                        labelAr: 'إجابة قصيرة',
                        labelEn: 'Short Answer',
                      },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          handleTypeChange(
                            type.value as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'
                          )
                        }
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          questionForm.type === type.value
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {language === 'ar' ? type.labelAr : type.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'السؤال (عربي)' : 'Question (Arabic)'} *
                    </label>
                    <textarea
                      value={questionForm.questionAr}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          questionAr: e.target.value,
                        })
                      }
                      className="input-field"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'السؤال (إنجليزي)' : 'Question (English)'} *
                    </label>
                    <textarea
                      value={questionForm.questionEn}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          questionEn: e.target.value,
                        })
                      }
                      className="input-field"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                {/* Options for Multiple Choice and True/False */}
                {questionForm.type !== 'SHORT_ANSWER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar'
                        ? 'الخيارات (اضغط على الإجابة الصحيحة)'
                        : 'Options (Click to mark correct answer)'}
                    </label>
                    <div className="space-y-2">
                      {questionForm.options.map((option, index) => (
                        <div
                          key={index}
                          onClick={() => setCorrectOption(index)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            option.isCorrect
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                option.isCorrect
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : 'border-gray-300'
                              }`}
                            >
                              {option.isCorrect && (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={option.ar}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateOption(index, 'ar', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={language === 'ar' ? 'الخيار بالعربي' : 'Option in Arabic'}
                                className="input-field text-sm"
                                disabled={questionForm.type === 'TRUE_FALSE'}
                              />
                              <input
                                type="text"
                                value={option.en}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateOption(index, 'en', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={language === 'ar' ? 'الخيار بالإنجليزي' : 'Option in English'}
                                className="input-field text-sm"
                                disabled={questionForm.type === 'TRUE_FALSE'}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correct Answer for Short Answer */}
                {questionForm.type === 'SHORT_ANSWER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الإجابة الصحيحة' : 'Correct Answer'} *
                    </label>
                    <input
                      type="text"
                      value={questionForm.correctAnswer}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          correctAnswer: e.target.value,
                        })
                      }
                      className="input-field"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'ar'
                        ? 'المقارنة ستكون بدون حساسية لحالة الأحرف'
                        : 'Comparison will be case-insensitive'}
                    </p>
                  </div>
                )}

                {/* Points and Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'النقاط' : 'Points'}
                    </label>
                    <input
                      type="number"
                      value={questionForm.points}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          points: parseInt(e.target.value) || 1,
                        })
                      }
                      className="input-field"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar'
                        ? 'شرح الإجابة (اختياري)'
                        : 'Answer Explanation (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={questionForm.explanation}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          explanation: e.target.value,
                        })
                      }
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionModal(false);
                      resetQuestionForm();
                    }}
                    className="btn-secondary"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5 me-2" />
                        {language === 'ar' ? 'حفظ السؤال' : 'Save Question'}
                      </>
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
                  ? 'هل أنت متأكد من حذف هذا السؤال؟'
                  : 'Are you sure you want to delete this question?'}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleDeleteQuestion(deleteConfirm)}
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
