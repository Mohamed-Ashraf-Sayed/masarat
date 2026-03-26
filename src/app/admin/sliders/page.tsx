'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  ArrowLeft,
  Loader2,
  Upload,
  Trash2,
  GripVertical,
  ImageIcon,
  Plus,
  AlertCircle,
  User,
  Info,
  CheckCircle,
} from 'lucide-react';

interface Slide {
  id: string;
  src: string;
  alt: string;
  order: number;
}

interface SiteImages {
  hero?: string;
  about?: string;
}

export default function AdminSlidersPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const aboutInputRef = useRef<HTMLInputElement>(null);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [siteImages, setSiteImages] = useState<SiteImages>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAbout, setUploadingAbout] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, router, authLoading]);

  const fetchData = async () => {
    try {
      const [slidersRes, imagesRes] = await Promise.all([
        fetch('/api/admin/sliders', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/site-images', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const slidersData = await slidersRes.json();
      const imagesData = await imagesRes.json();
      if (slidersData.success) setSlides(slidersData.data);
      if (imagesData.success) setSiteImages(imagesData.data);
    } catch {
      setError(language === 'ar' ? 'فشل في تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.split('.')[0]);

    try {
      const res = await fetch('/api/admin/sliders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSlides((prev) => [...prev, data.data]);
        showSuccess(language === 'ar' ? 'تم رفع البانر بنجاح' : 'Banner uploaded successfully');
      } else {
        setError(data.error);
      }
    } catch {
      setError(language === 'ar' ? 'فشل في رفع الصورة' : 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSiteImageDelete = (imageType: 'hero' | 'about') => {
    const label = imageType === 'hero'
      ? (language === 'ar' ? 'صورة الهيرو' : 'Hero image')
      : (language === 'ar' ? 'صورة من نحن' : 'About image');

    setConfirmModal({
      open: true,
      title: language === 'ar' ? 'حذف الصورة' : 'Delete Image',
      message: language === 'ar' ? `هل أنت متأكد من حذف ${label}؟ سيتم الرجوع للصورة الافتراضية.` : `Are you sure you want to delete the ${label}? It will revert to the default.`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        if (imageType === 'hero') setUploadingHero(true);
        else setUploadingAbout(true);
        setError('');

        try {
          const res = await fetch(`/api/admin/site-images?type=${imageType}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setSiteImages(data.data);
            showSuccess(language === 'ar' ? `تم حذف ${label}` : `${label} deleted`);
          } else {
            setError(data.error);
          }
        } catch {
          setError(language === 'ar' ? 'فشل في حذف الصورة' : 'Failed to delete image');
        } finally {
          setUploadingHero(false);
          setUploadingAbout(false);
        }
      },
    });
  };

  const handleSiteImageUpload = async (imageType: 'hero' | 'about', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageType === 'hero') setUploadingHero(true);
    else setUploadingAbout(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', imageType);

    try {
      const res = await fetch('/api/admin/site-images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSiteImages(data.data);
        const label = imageType === 'hero'
          ? (language === 'ar' ? 'صورة الهيرو' : 'Hero image')
          : (language === 'ar' ? 'صورة من نحن' : 'About image');
        showSuccess(language === 'ar' ? `تم تحديث ${label} بنجاح` : `${label} updated successfully`);
      } else {
        setError(data.error);
      }
    } catch {
      setError(language === 'ar' ? 'فشل في رفع الصورة' : 'Failed to upload image');
    } finally {
      setUploadingHero(false);
      setUploadingAbout(false);
      if (heroInputRef.current) heroInputRef.current.value = '';
      if (aboutInputRef.current) aboutInputRef.current.value = '';
    }
  };

  const handleDelete = (slideId: string) => {
    setConfirmModal({
      open: true,
      title: language === 'ar' ? 'حذف البانر' : 'Delete Banner',
      message: language === 'ar' ? 'هل أنت متأكد من حذف هذا البانر؟' : 'Are you sure you want to delete this banner?',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        setDeleting(slideId);
        try {
          const res = await fetch(`/api/admin/sliders?id=${slideId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setSlides(data.data);
            showSuccess(language === 'ar' ? 'تم حذف البانر' : 'Banner deleted');
          } else {
            setError(data.error);
          }
        } catch {
          setError(language === 'ar' ? 'فشل في حذف البانر' : 'Failed to delete banner');
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSlides = [...slides];
    const draggedItem = newSlides[draggedIndex];
    newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, draggedItem);

    const reordered = newSlides.map((s, i) => ({ ...s, order: i }));
    setSlides(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    try {
      await fetch('/api/admin/sliders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slides }),
      });
    } catch {
      setError(language === 'ar' ? 'فشل في حفظ الترتيب' : 'Failed to save order');
    }
  };

  if (authLoading || loading) {
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
          href="/admin"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'إدارة الصور والبانرات' : 'Manage Images & Banners'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? 'تحكم في صور الموقع وبانرات الصفحة الرئيسية' : 'Control site images and homepage banners'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Site Images Section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600" />
          {language === 'ar' ? 'صور الموقع' : 'Site Images'}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Hero Image */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {language === 'ar' ? 'صورة الصفحة الرئيسية (Hero)' : 'Homepage Hero Image'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {language === 'ar' ? 'الصورة الشخصية في أعلى الصفحة الرئيسية' : 'The personal image at the top of the homepage'}
              </p>
            </div>
            <div className="p-4">
              <div className="relative w-full h-48 bg-gray-50 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
                {siteImages.hero ? (
                  <img
                    src={siteImages.hero}
                    alt="Hero"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <img
                      src="/images/hero.png"
                      alt="Hero (default)"
                      className="max-w-full max-h-40 object-contain mx-auto"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      {language === 'ar' ? 'الصورة الافتراضية' : 'Default image'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => heroInputRef.current?.click()}
                  disabled={uploadingHero}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-50 text-primary-600 rounded-xl font-medium hover:bg-primary-100 transition-colors"
                >
                  {uploadingHero ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {language === 'ar' ? 'تغيير الصورة' : 'Change Image'}
                </button>
                {siteImages.hero && (
                  <button
                    onClick={() => handleSiteImageDelete('hero')}
                    disabled={uploadingHero}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-xl font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <input
                ref={heroInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleSiteImageUpload('hero', e)}
                className="hidden"
              />
            </div>
          </div>

          {/* About Image */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {language === 'ar' ? 'صورة من نحن (About)' : 'About Section Image'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {language === 'ar' ? 'الصورة في قسم التعريف بالمنصة' : 'The image in the about/intro section'}
              </p>
            </div>
            <div className="p-4">
              <div className="relative w-full h-48 bg-gray-50 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
                {siteImages.about ? (
                  <img
                    src={siteImages.about}
                    alt="About"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center py-8">
                    <Info className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      {language === 'ar' ? 'لم يتم تعيين صورة بعد' : 'No image set yet'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => aboutInputRef.current?.click()}
                  disabled={uploadingAbout}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-50 text-primary-600 rounded-xl font-medium hover:bg-primary-100 transition-colors"
                >
                  {uploadingAbout ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {language === 'ar' ? 'تغيير الصورة' : 'Change Image'}
                </button>
                {siteImages.about && (
                  <button
                    onClick={() => handleSiteImageDelete('about')}
                    disabled={uploadingAbout}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-500 rounded-xl font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <input
                ref={aboutInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleSiteImageUpload('about', e)}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Slider Banners Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-600" />
            {language === 'ar' ? 'بانرات السلايدر' : 'Slider Banners'}
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {language === 'ar' ? 'إضافة بانر' : 'Add Banner'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {slides.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد بانرات' : 'No Banners'}
            </h3>
            <p className="text-gray-500 mb-6">
              {language === 'ar' ? 'أضف بانرات لعرضها في الصفحة الرئيسية' : 'Add banners to display on the homepage'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {language === 'ar' ? 'رفع صورة' : 'Upload Image'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {language === 'ar'
                ? 'اسحب وأفلت لتغيير ترتيب البانرات'
                : 'Drag and drop to reorder banners'}
            </p>

            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-[0.98]' : ''
                } hover:shadow-md cursor-grab active:cursor-grabbing`}
              >
                <div className="text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-6 h-6" />
                </div>

                <div className="w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>

                <div className="relative w-48 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{slide.alt}</p>
                  <p className="text-sm text-gray-500 truncate" dir="ltr">{slide.src}</p>
                </div>

                <button
                  onClick={() => handleDelete(slide.id)}
                  disabled={deleting === slide.id}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  {deleting === slide.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                {language === 'ar' ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
