'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ikUrl } from '@/lib/imagekit';
import {
  ArrowLeft,
  Upload,
  Image,
  Loader2,
  Save,
  BookOpen,
} from 'lucide-react';

interface Category {
  id: string;
  name: { ar: string; en: string };
}

export default function NewCoursePage() {
  const { language, direction } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: '',
    originalPrice: '',
    level: 'BEGINNER',
    categoryId: '',
    thumbnail: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchCategories();
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

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setThumbnailFile(file);

    // Upload
    setUploadingThumbnail(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      const result = await response.json();
      if (result.success) {
        setFormData({ ...formData, thumbnail: result.data.url });
      } else {
        alert(result.error || (language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image'));
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titleAr || !formData.titleEn || !formData.categoryId) {
      alert(
        language === 'ar'
          ? 'يرجى ملء جميع الحقول المطلوبة'
          : 'Please fill in all required fields'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/instructor/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/instructor/courses/${result.data.id}/lessons`);
      } else {
        alert(result.error || (language === 'ar' ? 'فشل إنشاء الدورة' : 'Failed to create course'));
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إنشاء الدورة' : 'An error occurred while creating the course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/instructor/courses"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {language === 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar'
              ? 'أضف معلومات الدورة الأساسية'
              : 'Add basic course information'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'ar' ? 'صورة الدورة' : 'Course Thumbnail'}
            </label>
            <div className="flex items-start gap-4">
              {thumbnailPreview || formData.thumbnail ? (
                <img
                  src={ikUrl(thumbnailPreview || formData.thumbnail, { width: 200 })}
                  alt="Thumbnail preview"
                  className="w-48 h-32 object-cover rounded-xl"
                />
              ) : (
                <div className="w-48 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                  {uploadingThumbnail ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <span>
                    {language === 'ar' ? 'رفع صورة' : 'Upload Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    disabled={uploadingThumbnail}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'ar'
                    ? 'الحد الأقصى: 5 ميجابايت. الأبعاد المثلى: 1280x720'
                    : 'Max: 5MB. Recommended: 1280x720'}
                </p>
              </div>
            </div>
          </div>

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
                placeholder={language === 'ar' ? 'أدخل عنوان الدورة بالعربية' : 'Enter course title in Arabic'}
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
                placeholder={language === 'ar' ? 'أدخل عنوان الدورة بالإنجليزية' : 'Enter course title in English'}
                required
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
              </label>
              <textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                className="input-field resize-y min-h-[120px]"
                placeholder={language === 'ar' ? 'أدخل وصف الدورة بالعربية' : 'Enter course description in Arabic'}
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
              </label>
              <textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                className="input-field resize-y min-h-[120px]"
                placeholder={language === 'ar' ? 'أدخل وصف الدورة بالإنجليزية' : 'Enter course description in English'}
                rows={4}
              />
            </div>
          </div>

          {/* Category & Level */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'التصنيف' : 'Category'} *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">
                  {language === 'ar' ? 'اختر التصنيف' : 'Select Category'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name[language]}
                  </option>
                ))}
              </select>
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
                <option value="BEGINNER">
                  {language === 'ar' ? 'مبتدئ' : 'Beginner'}
                </option>
                <option value="INTERMEDIATE">
                  {language === 'ar' ? 'متوسط' : 'Intermediate'}
                </option>
                <option value="ADVANCED">
                  {language === 'ar' ? 'متقدم' : 'Advanced'}
                </option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'السعر ($)' : 'Price ($)'}
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'اتركه 0 للدورات المجانية' : 'Leave 0 for free courses'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'السعر الأصلي ($)' : 'Original Price ($)'}
              </label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="input-field"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'اختياري - لإظهار الخصم' : 'Optional - to show discount'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Link href="/instructor/courses" className="btn-secondary">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingThumbnail}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {language === 'ar' ? 'إنشاء الدورة' : 'Create Course'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
