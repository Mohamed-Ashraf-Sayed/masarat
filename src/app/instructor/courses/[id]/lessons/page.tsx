'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Play,
  FileText,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Save,
  X,
  Upload,
  Video,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
  FileVideo,
  File,
  Download,
  Lock,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface Lesson {
  id: string;
  titleAr: string;
  titleEn: string;
  description: string | null;
  videoUrl: string | null;
  duration: number;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  requireQuizPass?: boolean;
  resources?: Resource[];
}

interface Course {
  id: string;
  titleAr: string;
  titleEn: string;
}

export default function InstructorLessonsPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    description: '',
    videoUrl: '',
    duration: 0,
    isFree: false,
    isPublished: true,
    requireQuizPass: false,
  });

  // Video upload state
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchCourseAndLessons();
  }, [user, router, courseId]);

  const fetchCourseAndLessons = async () => {
    if (!token) return;

    try {
      // Fetch course details
      const courseResponse = await fetch(`/api/instructor/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const courseResult = await courseResponse.json();

      if (courseResult.success) {
        setCourse(courseResult.data);
      } else {
        router.push('/instructor/courses');
        return;
      }

      // Fetch lessons
      const lessonsResponse = await fetch(`/api/instructor/courses/${courseId}/lessons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lessonsResult = await lessonsResponse.json();

      if (lessonsResult.success) {
        setLessons(lessonsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({
        titleAr: lesson.titleAr,
        titleEn: lesson.titleEn,
        description: lesson.description || '',
        videoUrl: lesson.videoUrl || '',
        duration: lesson.duration || 0,
        isFree: lesson.isFree,
        isPublished: lesson.isPublished,
        requireQuizPass: lesson.requireQuizPass || false,
      });
      setVideoMode(lesson.videoUrl ? 'url' : 'url');

      // Fetch resources for this lesson
      if (token) {
        try {
          const res = await fetch(`/api/instructor/courses/${courseId}/lessons/${lesson.id}/resources`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const result = await res.json();
          if (result.success) {
            setResources(result.data);
          }
        } catch (error) {
          console.error('Error fetching resources:', error);
          setResources([]);
        }
      }
    } else {
      setEditingLesson(null);
      setFormData({
        titleAr: '',
        titleEn: '',
        description: '',
        videoUrl: '',
        duration: 0,
        isFree: false,
        isPublished: true,
        requireQuizPass: false,
      });
      setVideoMode('url');
      setResources([]);
    }
    setVideoFile(null);
    setPdfFile(null);
    setPdfTitle('');
    setUploadProgress(0);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLesson(null);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        alert(language === 'ar' ? 'نوع الملف غير مدعوم. يُسمح فقط بـ MP4, WebM, OGG, MOV' : 'Invalid file type. Allowed: MP4, WebM, OGG, MOV');
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        alert(language === 'ar' ? 'حجم الملف كبير جداً. الحد الأقصى 500 ميجابايت' : 'File too large. Max 500MB allowed');
        return;
      }
      setVideoFile(file);
    }
  };

  const uploadVideo = async (): Promise<string | null> => {
    if (!videoFile || !token) return null;

    setUploadingVideo(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('video', videoFile);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (result.success) {
        return result.data.url;
      } else {
        alert(result.error || (language === 'ar' ? 'فشل رفع الفيديو' : 'Failed to upload video'));
        return null;
      }
    } catch (error) {
      console.error('Video upload error:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء رفع الفيديو' : 'An error occurred while uploading video');
      return null;
    } finally {
      setUploadingVideo(false);
    }
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert(language === 'ar' ? 'يُسمح فقط بملفات PDF' : 'Only PDF files are allowed');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert(language === 'ar' ? 'حجم الملف كبير جداً. الحد الأقصى 50 ميجابايت' : 'File too large. Max 50MB allowed');
        return;
      }
      setPdfFile(file);
      if (!pdfTitle) {
        setPdfTitle(file.name.replace('.pdf', ''));
      }
    }
  };

  const uploadPdf = async () => {
    if (!pdfFile || !pdfTitle || !token || !editingLesson) return;

    setUploadingPdf(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', pdfFile);

      const uploadRes = await fetch('/api/upload/pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      const uploadResult = await uploadRes.json();

      if (!uploadResult.success) {
        alert(uploadResult.error || (language === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file'));
        return;
      }

      // Create the resource record
      const resourceRes = await fetch(`/api/instructor/courses/${courseId}/lessons/${editingLesson.id}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: pdfTitle,
          url: uploadResult.data.url,
          type: 'PDF',
        }),
      });

      const resourceResult = await resourceRes.json();

      if (resourceResult.success) {
        setResources([...resources, resourceResult.data]);
        setPdfFile(null);
        setPdfTitle('');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء رفع الملف' : 'An error occurred while uploading');
    } finally {
      setUploadingPdf(false);
    }
  };

  const deleteResource = async (resourceId: string) => {
    if (!token || !editingLesson) return;

    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/lessons/${editingLesson.id}/resources?resourceId=${resourceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (result.success) {
        setResources(resources.filter(r => r.id !== resourceId));
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titleAr || !formData.titleEn) {
      alert(
        language === 'ar'
          ? 'يرجى ملء العنوان بالعربية والإنجليزية'
          : 'Please fill in the title in both Arabic and English'
      );
      return;
    }

    setSaving(true);

    try {
      // Upload video first if there's a file
      let videoUrl = formData.videoUrl;
      if (videoMode === 'upload' && videoFile) {
        const uploadedUrl = await uploadVideo();
        if (uploadedUrl) {
          videoUrl = uploadedUrl;
        } else {
          setSaving(false);
          return;
        }
      }

      const url = editingLesson
        ? `/api/instructor/courses/${courseId}/lessons/${editingLesson.id}`
        : `/api/instructor/courses/${courseId}/lessons`;

      const response = await fetch(url, {
        method: editingLesson ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          videoUrl: videoUrl || null,
          order: editingLesson ? editingLesson.order : lessons.length + 1,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (editingLesson) {
          setLessons(lessons.map(l => l.id === editingLesson.id ? result.data : l));
        } else {
          setLessons([...lessons, result.data]);
        }
        handleCloseModal();
      } else {
        alert(result.error || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'));
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!token) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success) {
        setLessons(lessons.filter(l => l.id !== lessonId));
      } else {
        alert(result.error || (language === 'ar' ? 'فشل حذف الدرس' : 'Failed to delete lesson'));
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const index = lessons.findIndex(l => l.id === lessonId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === lessons.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newLessons = [...lessons];
    const [removed] = newLessons.splice(index, 1);
    newLessons.splice(newIndex, 0, removed);

    const updatedLessons = newLessons.map((lesson, idx) => ({
      ...lesson,
      order: idx + 1,
    }));

    setLessons(updatedLessons);

    try {
      await fetch(`/api/instructor/courses/${courseId}/lessons/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonIds: updatedLessons.map(l => l.id),
        }),
      });
    } catch (error) {
      console.error('Error reordering lessons:', error);
    }
  };

  const toggleLessonPublish = async (lesson: Lesson) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...lesson,
          isPublished: !lesson.isPublished,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setLessons(lessons.map(l => l.id === lesson.id ? { ...l, isPublished: !l.isPublished } : l));
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/instructor/courses/${courseId}/edit`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الدروس' : 'Manage Lessons'}
            </h1>
            <p className="text-gray-500">
              {course ? (language === 'ar' ? course.titleAr : course.titleEn) : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إضافة درس' : 'Add Lesson'}
        </button>
      </div>

      {/* Lessons List */}
      {lessons.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {lessons
              .sort((a, b) => a.order - b.order)
              .map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="p-4 md:p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveLesson(lesson.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveLesson(lesson.id, 'down')}
                      disabled={index === lessons.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lesson Number */}
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">{lesson.order}</span>
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {language === 'ar' ? lesson.titleAr : lesson.titleEn}
                      </h3>
                      {lesson.isFree && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          {language === 'ar' ? 'مجاني' : 'Free'}
                        </span>
                      )}
                      {!lesson.isPublished && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          {language === 'ar' ? 'مخفي' : 'Hidden'}
                        </span>
                      )}
                      {lesson.requireQuizPass && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {language === 'ar' ? 'مقفل' : 'Locked'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {lesson.videoUrl ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Video className="w-4 h-4" />
                          {language === 'ar' ? 'فيديو' : 'Video'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Video className="w-4 h-4" />
                          {language === 'ar' ? 'بدون فيديو' : 'No video'}
                        </span>
                      )}
                      {lesson.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(lesson.duration)}
                        </span>
                      )}
                      {lesson.description && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {language === 'ar' ? 'محتوى نصي' : 'Text content'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleLessonPublish(lesson)}
                      className={`p-2 rounded-lg transition-colors ${
                        lesson.isPublished
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={lesson.isPublished
                        ? (language === 'ar' ? 'إخفاء' : 'Hide')
                        : (language === 'ar' ? 'نشر' : 'Publish')
                      }
                    >
                      {lesson.isPublished ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenModal(lesson)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={language === 'ar' ? 'تعديل' : 'Edit'}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(lesson.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={language === 'ar' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد دروس بعد' : 'No lessons yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {language === 'ar'
              ? 'ابدأ بإضافة الدرس الأول لهذه الدورة'
              : 'Start by adding the first lesson to this course'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {language === 'ar' ? 'إضافة أول درس' : 'Add First Lesson'}
          </button>
        </div>
      )}

      {/* Add/Edit Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLesson
                  ? language === 'ar'
                    ? 'تعديل الدرس'
                    : 'Edit Lesson'
                  : language === 'ar'
                  ? 'إضافة درس جديد'
                  : 'Add New Lesson'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Titles */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'محتوى/شرح الدرس' : 'Lesson Content/Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field resize-y min-h-[150px]"
                  rows={6}
                  placeholder={
                    language === 'ar'
                      ? 'اكتب شرح الدرس هنا... يمكنك كتابة محتوى تعليمي مفصل'
                      : 'Write lesson content here...'
                  }
                />
              </div>

              {/* Video Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الفيديو' : 'Video'}
                </label>

                {/* Video Mode Toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoMode('url');
                      setVideoFile(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      videoMode === 'url'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    {language === 'ar' ? 'رابط' : 'URL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoMode('upload');
                      setFormData({ ...formData, videoUrl: '' });
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      videoMode === 'upload'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    {language === 'ar' ? 'رفع' : 'Upload'}
                  </button>
                </div>

                {videoMode === 'url' ? (
                  <div>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="input-field"
                      placeholder="https://youtube.com/watch?v=... أو https://vimeo.com/..."
                    />
                    {formData.videoUrl && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {language === 'ar' ? 'فيديو محفوظ' : 'Video saved'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!videoFile ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileVideo className="w-10 h-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            {language === 'ar' ? 'اضغط لرفع الفيديو' : 'Click to upload video'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            MP4, WebM, OGG, MOV (max 500MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          onChange={handleVideoFileChange}
                        />
                      </label>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FileVideo className="w-6 h-6 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {videoFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVideoFile(null)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        {uploadingVideo && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>{language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'المدة (بالدقائق)' : 'Duration (minutes)'}
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min="0"
                />
              </div>

              {/* PDF Resources Section */}
              {editingLesson && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {language === 'ar' ? 'ملفات PDF المرفقة' : 'Attached PDF Files'}
                  </h4>

                  {/* Existing Resources */}
                  {resources.length > 0 && (
                    <div className="space-y-2">
                      {resources.map((resource) => (
                        <div key={resource.id} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <File className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{resource.title}</p>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              {language === 'ar' ? 'تحميل' : 'Download'}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteResource(resource.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New PDF */}
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'إضافة ملف PDF جديد:' : 'Add new PDF file:'}
                    </p>
                    <div className="grid gap-3">
                      <input
                        type="text"
                        value={pdfTitle}
                        onChange={(e) => setPdfTitle(e.target.value)}
                        placeholder={language === 'ar' ? 'عنوان الملف' : 'File title'}
                        className="input-field text-sm"
                      />
                      {!pdfFile ? (
                        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                          <Upload className="w-5 h-5 text-blue-500" />
                          <span className="text-sm text-blue-600">
                            {language === 'ar' ? 'اختر ملف PDF' : 'Choose PDF file'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="application/pdf"
                            onChange={handlePdfFileChange}
                          />
                        </label>
                      ) : (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-200">
                          <File className="w-5 h-5 text-red-600" />
                          <span className="flex-1 text-sm text-gray-700 truncate">{pdfFile.name}</span>
                          <button
                            type="button"
                            onClick={() => setPdfFile(null)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {pdfFile && pdfTitle && (
                        <button
                          type="button"
                          onClick={uploadPdf}
                          disabled={uploadingPdf}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {uploadingPdf ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {language === 'ar' ? 'رفع الملف' : 'Upload File'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!editingLesson && (
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <p className="text-sm text-yellow-700 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {language === 'ar'
                      ? 'يمكنك إضافة ملفات PDF بعد حفظ الدرس'
                      : 'You can add PDF files after saving the lesson'}
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <h4 className="font-medium text-gray-900">
                  {language === 'ar' ? 'إعدادات الوصول' : 'Access Settings'}
                </h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm text-gray-700 font-medium">
                      {language === 'ar' ? 'درس مجاني (معاينة)' : 'Free lesson (preview)'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {language === 'ar' ? 'يمكن للجميع مشاهدة هذا الدرس' : 'Anyone can watch this lesson'}
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    {language === 'ar' ? 'نشر الدرس (مرئي للطلاب)' : 'Publish lesson (visible to students)'}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requireQuizPass}
                    onChange={(e) => setFormData({ ...formData, requireQuizPass: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-500" />
                      {language === 'ar' ? 'يتطلب اجتياز اختبار الدرس السابق' : 'Requires passing previous quiz'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {language === 'ar'
                        ? 'لن يتمكن الطالب من الوصول إلا بعد اجتياز الاختبار'
                        : 'Student must pass the previous quiz'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingVideo}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving || uploadingVideo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingLesson
                        ? language === 'ar'
                          ? 'حفظ التغييرات'
                          : 'Save Changes'
                        : language === 'ar'
                        ? 'إضافة الدرس'
                        : 'Add Lesson'}
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
                ? 'هل أنت متأكد من حذف هذا الدرس؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this lesson? This action cannot be undone.'}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
                disabled={deleting}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  language === 'ar' ? 'حذف' : 'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
