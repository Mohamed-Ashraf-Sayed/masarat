'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ikUrl } from '@/lib/imagekit';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  ArrowLeft,
  Save,
  Loader2,
  Image as ImageIcon,
  DollarSign,
  BookOpen,
  Clock,
  Tag,
  User,
  Globe,
  Upload,
  X,
  Video,
  Play,
  ListChecks,
  Plus,
  Trash2,
} from 'lucide-react';

interface Category {
  id: string;
  name: { ar: string; en: string };
}

interface Instructor {
  id: string;
  name: string;
  email: string;
}

export default function NewCoursePage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    thumbnail: '',
    previewVideo: '',
    price: '',
    originalPrice: '',
    level: 'BEGINNER',
    duration: '',
    categoryId: '',
    instructorId: '',
    isPublished: false,
    isFeatured: false,
    certificateTemplate: 'QABA',
  });

  const [learningOutcomesAr, setLearningOutcomesAr] = useState<string[]>(['']);
  const [learningOutcomesEn, setLearningOutcomesEn] = useState<string[]>(['']);
  const [requirementsAr, setRequirementsAr] = useState<string[]>(['']);
  const [requirementsEn, setRequirementsEn] = useState<string[]>(['']);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingPreviewVideo, setUploadingPreviewVideo] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewVideoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !['ADMIN','SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }

    fetchCategories();
    fetchInstructors();
  }, [user, router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInstructors = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/admin/users?role=INSTRUCTOR', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setInstructors(result.data);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingThumbnail(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'course');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      const result = await response.json();

      if (result.success) {
        setFormData({ ...formData, thumbnail: result.data.url });
      } else {
        setErrors({ ...errors, thumbnail: result.error || (language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image') });
      }
    } catch (error) {
      setErrors({ ...errors, thumbnail: language === 'ar' ? 'حدث خطأ في رفع الصورة' : 'Error uploading image' });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handlePreviewVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingPreviewVideo(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'video');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      const result = await response.json();

      if (result.success) {
        setFormData({ ...formData, previewVideo: result.data.url });
      } else {
        setErrors({ ...errors, previewVideo: result.error || (language === 'ar' ? 'فشل رفع الفيديو' : 'Failed to upload video') });
      }
    } catch (error) {
      setErrors({ ...errors, previewVideo: language === 'ar' ? 'حدث خطأ في رفع الفيديو' : 'Error uploading video' });
    } finally {
      setUploadingPreviewVideo(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.titleAr.trim()) {
      newErrors.titleAr = language === 'ar' ? 'العنوان بالعربية مطلوب' : 'Arabic title is required';
    }
    if (!formData.titleEn.trim()) {
      newErrors.titleEn = language === 'ar' ? 'العنوان بالإنجليزية مطلوب' : 'English title is required';
    }
    if (!formData.descriptionAr.trim()) {
      newErrors.descriptionAr = language === 'ar' ? 'الوصف بالعربية مطلوب' : 'Arabic description is required';
    }
    if (!formData.descriptionEn.trim()) {
      newErrors.descriptionEn = language === 'ar' ? 'الوصف بالإنجليزية مطلوب' : 'English description is required';
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = language === 'ar' ? 'السعر مطلوب' : 'Price is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = language === 'ar' ? 'التصنيف مطلوب' : 'Category is required';
    }
    if (!formData.instructorId) {
      newErrors.instructorId = language === 'ar' ? 'المدرب مطلوب' : 'Instructor is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) return;

    setLoading(true);

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          duration: formData.duration ? parseInt(formData.duration) : 0,
          learningOutcomesAr: learningOutcomesAr.filter(l => l.trim()).join('\n') || null,
          learningOutcomesEn: learningOutcomesEn.filter(l => l.trim()).join('\n') || null,
          requirementsAr: requirementsAr.filter(l => l.trim()).join('\n') || null,
          requirementsEn: requirementsEn.filter(l => l.trim()).join('\n') || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/admin/courses');
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('Error creating course:', error);
      setErrors({ submit: language === 'ar' ? 'حدث خطأ' : 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'إضافة دورة جديدة' : 'Add New Course'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? 'أدخل تفاصيل الدورة' : 'Enter course details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Title Arabic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'العنوان بالعربية' : 'Arabic Title'} *
              </label>
              <input
                type="text"
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                className={`input-field ${errors.titleAr ? 'border-red-500' : ''}`}
                placeholder={language === 'ar' ? 'مثال: دورة تطوير الويب الشاملة' : 'Ex: Complete Web Development Course'}
              />
              {errors.titleAr && <p className="text-red-500 text-sm mt-1">{errors.titleAr}</p>}
            </div>

            {/* Title English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'العنوان بالإنجليزية' : 'English Title'} *
              </label>
              <input
                type="text"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                className={`input-field ${errors.titleEn ? 'border-red-500' : ''}`}
                placeholder="Ex: Complete Web Development Course"
              />
              {errors.titleEn && <p className="text-red-500 text-sm mt-1">{errors.titleEn}</p>}
            </div>

            {/* Description Arabic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الوصف بالعربية' : 'Arabic Description'} *
              </label>
              <textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                rows={4}
                className={`input-field resize-none ${errors.descriptionAr ? 'border-red-500' : ''}`}
                placeholder={language === 'ar' ? 'وصف تفصيلي للدورة...' : 'Detailed course description...'}
              />
              {errors.descriptionAr && <p className="text-red-500 text-sm mt-1">{errors.descriptionAr}</p>}
            </div>

            {/* Description English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الوصف بالإنجليزية' : 'English Description'} *
              </label>
              <textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                rows={4}
                className={`input-field resize-none ${errors.descriptionEn ? 'border-red-500' : ''}`}
                placeholder="Detailed course description..."
              />
              {errors.descriptionEn && <p className="text-red-500 text-sm mt-1">{errors.descriptionEn}</p>}
            </div>
          </div>
        </div>

        {/* Learning Outcomes & Requirements */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary-600" />
            {language === 'ar' ? 'ماذا ستتعلم والمتطلبات' : 'Learning Outcomes & Requirements'}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Learning Outcomes Arabic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'ماذا ستتعلم (عربي)' : 'What You\'ll Learn (Arabic)'}
              </label>
              <div className="space-y-2">
                {learningOutcomesAr.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...learningOutcomesAr];
                        updated[index] = e.target.value;
                        setLearningOutcomesAr(updated);
                      }}
                      className="input-field flex-1"
                      placeholder={language === 'ar' ? `النقطة ${index + 1}` : `Point ${index + 1}`}
                    />
                    {learningOutcomesAr.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLearningOutcomesAr(learningOutcomesAr.filter((_, i) => i !== index))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setLearningOutcomesAr([...learningOutcomesAr, ''])}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة نقطة' : 'Add Point'}
                </button>
              </div>
            </div>

            {/* Learning Outcomes English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'ماذا ستتعلم (إنجليزي)' : 'What You\'ll Learn (English)'}
              </label>
              <div className="space-y-2">
                {learningOutcomesEn.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...learningOutcomesEn];
                        updated[index] = e.target.value;
                        setLearningOutcomesEn(updated);
                      }}
                      className="input-field flex-1"
                      placeholder={`Point ${index + 1}`}
                    />
                    {learningOutcomesEn.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLearningOutcomesEn(learningOutcomesEn.filter((_, i) => i !== index))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setLearningOutcomesEn([...learningOutcomesEn, ''])}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة نقطة' : 'Add Point'}
                </button>
              </div>
            </div>

            {/* Requirements Arabic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'المتطلبات (عربي)' : 'Requirements (Arabic)'}
              </label>
              <div className="space-y-2">
                {requirementsAr.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...requirementsAr];
                        updated[index] = e.target.value;
                        setRequirementsAr(updated);
                      }}
                      className="input-field flex-1"
                      placeholder={language === 'ar' ? `المتطلب ${index + 1}` : `Requirement ${index + 1}`}
                    />
                    {requirementsAr.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRequirementsAr(requirementsAr.filter((_, i) => i !== index))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRequirementsAr([...requirementsAr, ''])}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة متطلب' : 'Add Requirement'}
                </button>
              </div>
            </div>

            {/* Requirements English */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'المتطلبات (إنجليزي)' : 'Requirements (English)'}
              </label>
              <div className="space-y-2">
                {requirementsEn.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...requirementsEn];
                        updated[index] = e.target.value;
                        setRequirementsEn(updated);
                      }}
                      className="input-field flex-1"
                      placeholder={`Requirement ${index + 1}`}
                    />
                    {requirementsEn.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRequirementsEn(requirementsEn.filter((_, i) => i !== index))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRequirementsEn([...requirementsEn, ''])}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة متطلب' : 'Add Requirement'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Media & Pricing */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-600" />
            {language === 'ar' ? 'الصورة والتسعير' : 'Media & Pricing'}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Thumbnail */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'صورة الغلاف' : 'Thumbnail'}
              </label>
              <input
                type="file"
                ref={thumbnailInputRef}
                onChange={handleThumbnailUpload}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
              />

              {formData.thumbnail ? (
                <div className="relative inline-block">
                  <img
                    src={ikUrl(formData.thumbnail, { width: 600 })}
                    alt="Preview"
                    className="w-64 h-40 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thumbnail: '' })}
                    className="absolute -top-2 -end-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                    className="absolute bottom-2 end-2 px-3 py-1.5 bg-white/90 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition-colors flex items-center gap-1"
                  >
                    {uploadingThumbnail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {language === 'ar' ? 'تغيير' : 'Change'}
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !uploadingThumbnail && thumbnailInputRef.current?.click()}
                  className="w-64 h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  {uploadingThumbnail ? (
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">
                        {language === 'ar' ? 'اضغط لرفع صورة' : 'Click to upload image'}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        PNG, JPG, WebP (max 5MB)
                      </span>
                    </>
                  )}
                </div>
              )}
              {errors.thumbnail && <p className="text-red-500 text-sm mt-2">{errors.thumbnail}</p>}
            </div>

            {/* Preview Video */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Video className="w-4 h-4 inline-block me-1" />
                {language === 'ar' ? 'الفيديو التعريفي' : 'Preview Video'}
              </label>
              <input
                type="file"
                ref={previewVideoInputRef}
                onChange={handlePreviewVideoUpload}
                accept="video/mp4,video/webm,video/ogg"
                className="hidden"
              />

              {formData.previewVideo ? (
                <div className="relative inline-block">
                  <video
                    src={formData.previewVideo}
                    className="w-80 h-48 object-cover rounded-xl border border-gray-200"
                    controls
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, previewVideo: '' })}
                    className="absolute -top-2 -end-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => previewVideoInputRef.current?.click()}
                    disabled={uploadingPreviewVideo}
                    className="absolute bottom-2 end-2 px-3 py-1.5 bg-white/90 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition-colors flex items-center gap-1"
                  >
                    {uploadingPreviewVideo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {language === 'ar' ? 'تغيير' : 'Change'}
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !uploadingPreviewVideo && previewVideoInputRef.current?.click()}
                  className="w-80 h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  {uploadingPreviewVideo ? (
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">
                        {language === 'ar' ? 'اضغط لرفع فيديو تعريفي' : 'Click to upload preview video'}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        MP4, WebM, OGG (max 100MB)
                      </span>
                    </>
                  )}
                </div>
              )}
              {errors.previewVideo && <p className="text-red-500 text-sm mt-2">{errors.previewVideo}</p>}
              <p className="text-xs text-gray-500 mt-2">
                {language === 'ar'
                  ? 'هذا الفيديو سيظهر كمعاينة مجانية للزوار قبل شراء الدورة'
                  : 'This video will be shown as a free preview for visitors before purchasing the course'}
              </p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'السعر ($)' : 'Price ($)'} *
              </label>
              <div className="relative">
                <DollarSign className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={`input-field ps-12 ${errors.price ? 'border-red-500' : ''}`}
                  placeholder="99"
                  min="0"
                  step="0.01"
                />
              </div>
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'السعر الأصلي ($)' : 'Original Price ($)'}
              </label>
              <div className="relative">
                <DollarSign className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  className="input-field ps-12"
                  placeholder="199"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'المدة (بالساعات)' : 'Duration (hours)'}
              </label>
              <div className="relative">
                <Clock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="input-field ps-12"
                  placeholder="10"
                  min="0"
                />
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'المستوى' : 'Level'}
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="input-field"
              >
                <option value="BEGINNER">{language === 'ar' ? 'مبتدئ' : 'Beginner'}</option>
                <option value="INTERMEDIATE">{language === 'ar' ? 'متوسط' : 'Intermediate'}</option>
                <option value="ADVANCED">{language === 'ar' ? 'متقدم' : 'Advanced'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category & Instructor */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-600" />
            {language === 'ar' ? 'التصنيف والمدرب' : 'Category & Instructor'}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'التصنيف' : 'Category'} *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className={`input-field ${errors.categoryId ? 'border-red-500' : ''}`}
              >
                <option value="">{language === 'ar' ? 'اختر التصنيف' : 'Select Category'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name[language]}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
            </div>

            {/* Instructor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'المدرب' : 'Instructor'} *
              </label>
              <select
                value={formData.instructorId}
                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                className={`input-field ${errors.instructorId ? 'border-red-500' : ''}`}
              >
                <option value="">{language === 'ar' ? 'اختر المدرب' : 'Select Instructor'}</option>
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.email})
                  </option>
                ))}
              </select>
              {errors.instructorId && <p className="text-red-500 text-sm mt-1">{errors.instructorId}</p>}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-600" />
            {language === 'ar' ? 'خيارات النشر' : 'Publishing Options'}
          </h2>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-gray-700">
                {language === 'ar' ? 'نشر الدورة مباشرة' : 'Publish course immediately'}
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-gray-700">
                {language === 'ar' ? 'دورة مميزة' : 'Featured course'}
              </span>
            </label>
          </div>

          {/* Certificate Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'ar' ? 'نوع الشهادة' : 'Certificate Template'}
            </label>
            <select
              value={formData.certificateTemplate}
              onChange={(e) => setFormData({ ...formData, certificateTemplate: e.target.value })}
              className="input-field"
            >
              <option value="QABA">QABA</option>
              <option value="IBAO">IBAO</option>
              <option value="CEU">CEU - QABA (Continuing Education)</option>
              <option value="IBAO_CEU">CEU - IBAO (Continuing Education)</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {errors.submit && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/admin/courses"
            className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {language === 'ar' ? 'حفظ الدورة' : 'Save Course'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
