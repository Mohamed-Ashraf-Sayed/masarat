'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Play,
  Clock,
  Save,
  X,
  Loader2,
  BookOpen,
  Video,
  Eye,
  EyeOff,
  Lock,
  Upload,
  Link as LinkIcon,
  FileVideo,
  FileText,
  Download,
  File,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface Lesson {
  id: string;
  title: { ar: string; en: string };
  description: string | null;
  videoUrl: string | null;
  duration: number | null;
  order: number;
  isFree: boolean;
  requireQuizPass: boolean;
  resources?: Resource[];
}

interface Course {
  id: string;
  title: { ar: string; en: string };
}

export default function LessonsPage() {
  const { id: courseId } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, token } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    description: '',
    videoUrl: '',
    duration: '',
    isFree: false,
    requireQuizPass: false,
  });

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
    if (!user || !['ADMIN','SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [user, token, router, courseId]);

  const fetchData = async () => {
    if (!token) return;

    try {
      // جلب بيانات الكورس
      const courseRes = await fetch(`/api/courses/${courseId}`);
      const courseResult = await courseRes.json();
      if (courseResult.success) {
        setCourse(courseResult.data);
      }

      // جلب الدروس
      const lessonsRes = await fetch(`/api/admin/courses/${courseId}/lessons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lessonsResult = await lessonsRes.json();
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
        titleAr: lesson.title.ar,
        titleEn: lesson.title.en,
        description: lesson.description || '',
        videoUrl: lesson.videoUrl || '',
        duration: lesson.duration?.toString() || '',
        isFree: lesson.isFree,
        requireQuizPass: lesson.requireQuizPass || false,
      });
      setVideoMode(lesson.videoUrl ? 'url' : 'url');
      // Fetch resources for this lesson
      if (token) {
        try {
          const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lesson.id}/resources`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const result = await res.json();
          if (result.success) {
            setResources(result.data);
          }
        } catch (error) {
          console.error('Error fetching resources:', error);
        }
      }
    } else {
      setEditingLesson(null);
      setFormData({
        titleAr: '',
        titleEn: '',
        description: '',
        videoUrl: '',
        duration: '',
        isFree: false,
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

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        alert(language === 'ar' ? 'نوع الملف غير مدعوم. يُسمح فقط بـ MP4, WebM, OGG, MOV' : 'Invalid file type. Allowed: MP4, WebM, OGG, MOV');
        return;
      }
      // Validate file size (max 500MB)
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
      const formData = new FormData();
      formData.append('video', videoFile);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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
      // Upload the PDF file
      const formData = new FormData();
      formData.append('file', pdfFile);

      const uploadRes = await fetch('/api/upload/pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadResult = await uploadRes.json();

      if (!uploadResult.success) {
        alert(uploadResult.error || (language === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file'));
        return;
      }

      // Create the resource record
      const resourceRes = await fetch(`/api/admin/courses/${courseId}/lessons/${editingLesson.id}/resources`, {
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
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${editingLesson.id}/resources?resourceId=${resourceId}`, {
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

  const handleSave = async () => {
    if (!token || !formData.titleAr || !formData.titleEn) return;

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
          return; // Upload failed
        }
      }

      const url = editingLesson
        ? `/api/admin/courses/${courseId}/lessons/${editingLesson.id}`
        : `/api/admin/courses/${courseId}/lessons`;

      const response = await fetch(url, {
        method: editingLesson ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titleAr: formData.titleAr,
          titleEn: formData.titleEn,
          description: formData.description || null,
          videoUrl: videoUrl || null,
          duration: formData.duration ? parseInt(formData.duration) : null,
          isFree: formData.isFree,
          requireQuizPass: formData.requireQuizPass,
          order: editingLesson ? editingLesson.order : lessons.length + 1,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (editingLesson) {
          setLessons(lessons.map(l =>
            l.id === editingLesson.id ? result.data : l
          ));
        } else {
          setLessons([...lessons, result.data]);
        }
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!token) return;

    setDeleting(lessonId);

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setLessons(lessons.filter(l => l.id !== lessonId));
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleFree = async (lessonId: string, isFree: boolean) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isFree: !isFree }),
      });

      const result = await response.json();

      if (result.success) {
        setLessons(lessons.map(l =>
          l.id === lessonId ? { ...l, isFree: !isFree } : l
        ));
      }
    } catch (error) {
      console.error('Error toggling free:', error);
    }
  };

  if (loading) {
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
          href="/admin/courses"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'إدارة الدروس' : 'Manage Lessons'}
          </h1>
          <p className="text-gray-500">
            {course?.title[language]}
          </p>
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {lessons.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {lessons.sort((a, b) => a.order - b.order).map((lesson, index) => (
              <div
                key={lesson.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-gray-400">
                    <GripVertical className="w-5 h-5 cursor-grab" />
                    <span className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {lesson.title[language]}
                      </h3>
                      {lesson.isFree && (
                        <span className="badge badge-success text-xs">
                          {language === 'ar' ? 'مجاني' : 'Free'}
                        </span>
                      )}
                      {lesson.requireQuizPass && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                          <Lock className="w-3 h-3" />
                          {language === 'ar' ? 'مقفل' : 'Locked'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {lesson.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lesson.duration} {language === 'ar' ? 'دقيقة' : 'min'}
                        </span>
                      )}
                      {lesson.videoUrl ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Video className="w-4 h-4" />
                          {language === 'ar' ? 'فيديو متوفر' : 'Video available'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Video className="w-4 h-4" />
                          {language === 'ar' ? 'بدون فيديو' : 'No video'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFree(lesson.id, lesson.isFree)}
                      className={`p-2 rounded-lg transition-colors ${
                        lesson.isFree
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={lesson.isFree
                        ? (language === 'ar' ? 'إلغاء المجانية' : 'Remove free')
                        : (language === 'ar' ? 'جعله مجاني' : 'Make free')}
                    >
                      {lesson.isFree ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleOpenModal(lesson)}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id)}
                      disabled={deleting === lesson.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      {deleting === lesson.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد دروس' : 'No lessons yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {language === 'ar'
                ? 'ابدأ بإضافة أول درس للدورة'
                : 'Start by adding the first lesson'}
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {language === 'ar' ? 'إضافة درس' : 'Add Lesson'}
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingLesson
                  ? (language === 'ar' ? 'تعديل الدرس' : 'Edit Lesson')
                  : (language === 'ar' ? 'إضافة درس جديد' : 'Add New Lesson')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'العنوان بالعربية' : 'Arabic Title'} *
                  </label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="input-field"
                    placeholder={language === 'ar' ? 'مثال: مقدمة في البرمجة' : 'Ex: Introduction to Programming'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'العنوان بالإنجليزية' : 'English Title'} *
                  </label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Introduction to Programming"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'محتوى/شرح الدرس' : 'Lesson Content/Description'}
                  <span className="text-xs text-gray-500 block mt-1">
                    {language === 'ar'
                      ? 'يظهر هذا المحتوى للطالب إذا لم يكن هناك فيديو'
                      : 'This content will be shown to students if there is no video'}
                  </span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={8}
                  className="input-field resize-y min-h-[150px]"
                  placeholder={language === 'ar'
                    ? 'اكتب شرح الدرس هنا... يمكنك كتابة محتوى تعليمي مفصل يظهر بدلاً من الفيديو'
                    : 'Write lesson content here... You can write detailed educational content that appears instead of video'}
                />
              </div>

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
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="input-field"
                    placeholder="https://youtube.com/watch?v=... أو https://vimeo.com/..."
                  />
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

                {/* Show current video URL if exists */}
                {formData.videoUrl && videoMode === 'url' && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    {language === 'ar' ? 'فيديو محفوظ' : 'Video saved'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'المدة (بالدقائق)' : 'Duration (minutes)'}
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="input-field"
                  placeholder="15"
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
                        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
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

              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900">
                  {language === 'ar' ? 'إعدادات الوصول' : 'Access Settings'}
                </h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">
                      {language === 'ar' ? 'درس مجاني (معاينة)' : 'Free lesson (preview)'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {language === 'ar'
                        ? 'يمكن للجميع مشاهدة هذا الدرس بدون تسجيل'
                        : 'Anyone can watch this lesson without enrollment'}
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requireQuizPass}
                    onChange={(e) => setFormData({ ...formData, requireQuizPass: e.target.checked })}
                    className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-gray-700 font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-500" />
                      {language === 'ar' ? 'يتطلب اجتياز اختبار الدرس السابق' : 'Requires passing previous lesson quiz'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {language === 'ar'
                        ? 'لن يتمكن الطالب من الوصول لهذا الدرس إلا بعد اجتياز اختبار الدرس السابق'
                        : 'Student must pass the previous lesson quiz to access this lesson'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.titleAr || !formData.titleEn}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
