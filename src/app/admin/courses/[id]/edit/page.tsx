'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Globe,
  Upload,
  X,
  Shield,
  Video,
  Play,
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

export default function EditCoursePage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    enableWatermark: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingPreviewVideo, setUploadingPreviewVideo] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewVideoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchData();
  }, [user, router, id]);

  const fetchData = async () => {
    if (!token) return;

    try {
      // جلب بيانات الكورس
      const courseRes = await fetch(`/api/admin/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const courseResult = await courseRes.json();

      if (courseResult.success) {
        const course = courseResult.data;
        setFormData({
          titleAr: course.titleAr || '',
          titleEn: course.titleEn || '',
          descriptionAr: course.descriptionAr || '',
          descriptionEn: course.descriptionEn || '',
          thumbnail: course.thumbnail || '',
          previewVideo: course.previewVideo || '',
          price: course.price?.toString() || '',
          originalPrice: course.originalPrice?.toString() || '',
          level: course.level || 'BEGINNER',
          duration: course.duration?.toString() || '',
          categoryId: course.categoryId || '',
          instructorId: course.instructorId || '',
          isPublished: course.isPublished || false,
          isFeatured: course.isFeatured || false,
          enableWatermark: course.enableWatermark !== false,
        });
      }

      // جلب التصنيفات
      const categoriesRes = await fetch('/api/categories');
      const categoriesResult = await categoriesRes.json();
      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }

      // جلب المدربين
      const instructorsRes = await fetch('/api/admin/users?role=INSTRUCTOR', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const instructorsResult = await instructorsRes.json();
      if (instructorsResult.success) {
        setInstructors(instructorsResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titleAr: formData.titleAr,
          titleEn: formData.titleEn,
          descriptionAr: formData.descriptionAr,
          descriptionEn: formData.descriptionEn,
          thumbnail: formData.thumbnail || null,
          previewVideo: formData.previewVideo || null,
          price: parseFloat(formData.price) || 0,
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          level: formData.level,
          duration: formData.duration ? parseInt(formData.duration) : 0,
          categoryId: formData.categoryId,
          instructorId: formData.instructorId,
          isPublished: formData.isPublished,
          isFeatured: formData.isFeatured,
          enableWatermark: formData.enableWatermark,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/admin/courses');
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('Error updating course:', error);
      setErrors({ submit: language === 'ar' ? 'حدث خطأ' : 'An error occurred' });
    } finally {
      setSaving(false);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'تعديل الدورة' : 'Edit Course'}
          </h1>
          <p className="text-gray-500">{formData.titleAr || formData.titleEn}</p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'العنوان بالعربية' : 'Arabic Title'} *
              </label>
              <input
                type="text"
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                className={`input-field ${errors.titleAr ? 'border-red-500' : ''}`}
              />
              {errors.titleAr && <p className="text-red-500 text-sm mt-1">{errors.titleAr}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'العنوان بالإنجليزية' : 'English Title'} *
              </label>
              <input
                type="text"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                className={`input-field ${errors.titleEn ? 'border-red-500' : ''}`}
              />
              {errors.titleEn && <p className="text-red-500 text-sm mt-1">{errors.titleEn}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الوصف بالعربية' : 'Arabic Description'}
              </label>
              <textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                rows={4}
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الوصف بالإنجليزية' : 'English Description'}
              </label>
              <textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                rows={4}
                className="input-field resize-none"
              />
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
                    src={formData.thumbnail}
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

            {/* Preview Video Upload */}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'السعر ($)' : 'Price ($)'}
              </label>
              <div className="relative">
                <DollarSign className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field ps-12"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

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
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

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
                  min="0"
                />
              </div>
            </div>

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
                {language === 'ar' ? 'نشر الدورة' : 'Publish course'}
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
        </div>

        {/* Video Protection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            {language === 'ar' ? 'حماية الفيديو' : 'Video Protection'}
          </h2>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableWatermark}
                onChange={(e) => setFormData({ ...formData, enableWatermark: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <div>
                <span className="text-gray-700 block">
                  {language === 'ar' ? 'تفعيل العلامة المائية' : 'Enable Watermark'}
                </span>
                <span className="text-gray-500 text-sm">
                  {language === 'ar'
                    ? 'يظهر اسم المستخدم ومعرفه على الفيديو لمنع التسريب'
                    : 'Shows user name and ID on video to prevent leaking'}
                </span>
              </div>
            </label>
          </div>
        </div>

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
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
          </button>
          <Link
            href={`/admin/courses/${id}/lessons`}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            {language === 'ar' ? 'إدارة الدروس' : 'Manage Lessons'}
          </Link>
        </div>
      </form>
    </AdminLayout>
  );
}
