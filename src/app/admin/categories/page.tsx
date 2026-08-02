'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  Search,
  BookOpen,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description?: string;
  coursesCount: number;
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || !['ADMIN','SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }

    fetchCategories();
  }, [user, router, authLoading]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        slug: category.slug,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        nameAr: '',
        nameEn: '',
        slug: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      nameAr: '',
      nameEn: '',
      slug: '',
      description: '',
    });
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSave = async () => {
    if (!formData.nameAr || !formData.nameEn) {
      alert(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const slug = formData.slug || generateSlug(formData.nameEn);
      const payload = {
        ...formData,
        slug,
      };

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        fetchCategories();
        handleCloseModal();
      } else {
        alert(data.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const query = searchQuery.toLowerCase();
    return (
      cat.nameAr.toLowerCase().includes(query) ||
      cat.nameEn.toLowerCase().includes(query) ||
      cat.slug.toLowerCase().includes(query)
    );
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة التصنيفات' : 'Categories Management'}
            </h1>
            <p className="text-gray-500">
              {language === 'ar' ? 'إضافة وتعديل تصنيفات الدورات' : 'Add and edit course categories'}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إضافة تصنيف' : 'Add Category'}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'البحث في التصنيفات...' : 'Search categories...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد تصنيفات' : 'No categories found'}
          </h3>
          <p className="text-gray-500 mb-6">
            {language === 'ar'
              ? 'ابدأ بإضافة تصنيف جديد للدورات'
              : 'Start by adding a new category for courses'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {language === 'ar' ? 'إضافة تصنيف' : 'Add Category'}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FolderTree className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {deleteConfirm === category.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <span className="text-xs font-medium">
                          {language === 'ar' ? 'تأكيد' : 'Confirm'}
                        </span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(category.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-1">
                {language === 'ar' ? category.nameAr : category.nameEn}
              </h3>
              <p className="text-sm text-gray-500 mb-4">/{category.slug}</p>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>
                  {category.coursesCount} {language === 'ar' ? 'دورة' : 'courses'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory
                  ? language === 'ar'
                    ? 'تعديل التصنيف'
                    : 'Edit Category'
                  : language === 'ar'
                  ? 'إضافة تصنيف جديد'
                  : 'Add New Category'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'} *
                </label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder={language === 'ar' ? 'مثال: تطوير الويب' : 'e.g., Web Development'}
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'} *
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => {
                    setFormData({ ...formData, nameEn: e.target.value });
                    if (!editingCategory && !formData.slug) {
                      setFormData((prev) => ({
                        ...prev,
                        nameEn: e.target.value,
                        slug: generateSlug(e.target.value),
                      }));
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder="e.g., Web Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الرابط (Slug)' : 'Slug'}
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  placeholder="web-development"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'ar'
                    ? 'سيتم إنشاؤه تلقائياً من الاسم الإنجليزي إذا تُرك فارغاً'
                    : 'Will be auto-generated from English name if left empty'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
                  placeholder={
                    language === 'ar' ? 'وصف مختصر للتصنيف...' : 'Short description for the category...'
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
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
