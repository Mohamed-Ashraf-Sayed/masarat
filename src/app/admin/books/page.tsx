'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Search,
  Loader2,
  Eye,
  EyeOff,
  Star,
  Download,
  DollarSign,
  Tag,
  X,
  Save,
  Upload,
  FileText,
} from 'lucide-react';

interface Book {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  author: { ar: string; en: string };
  cover: string | null;
  price: number;
  originalPrice: number | null;
  fileUrl: string | null;
  previewUrl: string | null;
  pages: number | null;
  language: string;
  isbn: string | null;
  publishedYear: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  downloads: number;
  purchaseCount: number;
  createdAt: string;
  category: {
    id: string;
    name: { ar: string; en: string };
  } | null;
}

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string | null;
  bookCount: number;
}

export default function AdminBooksPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, token } = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    authorAr: '',
    authorEn: '',
    cover: '',
    price: '',
    originalPrice: '',
    fileUrl: '',
    previewUrl: '',
    pages: '',
    language: 'ar',
    isbn: '',
    publishedYear: '',
    categoryId: '',
    isPublished: false,
    isFeatured: false,
  });

  useEffect(() => {
    if (!user || !['ADMIN','SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [user, token, router]);

  const fetchData = async () => {
    if (!token) return;

    try {
      const [booksRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/books', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/book-categories', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const booksResult = await booksRes.json();
      const categoriesResult = await categoriesRes.json();

      if (booksResult.success) {
        setBooks(booksResult.data);
      }
      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        titleAr: book.title.ar,
        titleEn: book.title.en,
        descriptionAr: book.description.ar,
        descriptionEn: book.description.en,
        authorAr: book.author.ar,
        authorEn: book.author.en,
        cover: book.cover || '',
        price: book.price.toString(),
        originalPrice: book.originalPrice?.toString() || '',
        fileUrl: book.fileUrl || '',
        previewUrl: book.previewUrl || '',
        pages: book.pages?.toString() || '',
        language: book.language,
        isbn: book.isbn || '',
        publishedYear: book.publishedYear?.toString() || '',
        categoryId: book.category?.id || '',
        isPublished: book.isPublished,
        isFeatured: book.isFeatured,
      });
    } else {
      setEditingBook(null);
      setFormData({
        titleAr: '',
        titleEn: '',
        descriptionAr: '',
        descriptionEn: '',
        authorAr: '',
        authorEn: '',
        cover: '',
        price: '',
        originalPrice: '',
        fileUrl: '',
        previewUrl: '',
        pages: '',
        language: 'ar',
        isbn: '',
        publishedYear: '',
        categoryId: '',
        isPublished: false,
        isFeatured: false,
      });
    }
    setShowModal(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'course');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, cover: result.data.url }));
      }
    } catch (e) { console.error(e); }
    finally { setUploadingCover(false); }
  };

  const handleSave = async () => {
    if (!token || !formData.titleAr || !formData.titleEn || !formData.authorAr || !formData.authorEn) return;

    setSaving(true);

    try {
      const url = editingBook
        ? `/api/admin/books/${editingBook.id}`
        : '/api/admin/books';

      const response = await fetch(url, {
        method: editingBook ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titleAr: formData.titleAr,
          titleEn: formData.titleEn,
          descriptionAr: formData.descriptionAr,
          descriptionEn: formData.descriptionEn,
          authorAr: formData.authorAr,
          authorEn: formData.authorEn,
          cover: formData.cover || null,
          price: parseFloat(formData.price) || 0,
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          fileUrl: formData.fileUrl || null,
          previewUrl: formData.previewUrl || null,
          pages: formData.pages ? parseInt(formData.pages) : null,
          language: formData.language,
          isbn: formData.isbn || null,
          publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : null,
          categoryId: formData.categoryId || null,
          isPublished: formData.isPublished,
          isFeatured: formData.isFeatured,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving book:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!token || !confirm(language === 'ar' ? 'هل تريد حذف هذا الكتاب؟' : 'Delete this book?')) return;

    setDeleting(bookId);

    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setBooks(books.filter((b) => b.id !== bookId));
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePublish = async (book: Book) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/books/${book.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...book,
          titleAr: book.title.ar,
          titleEn: book.title.en,
          descriptionAr: book.description.ar,
          descriptionEn: book.description.en,
          authorAr: book.author.ar,
          authorEn: book.author.en,
          categoryId: book.category?.id,
          isPublished: !book.isPublished,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setBooks(
          books.map((b) =>
            b.id === book.id ? { ...b, isPublished: !b.isPublished } : b
          )
        );
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const filteredBooks = books.filter((book) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      book.title.ar.toLowerCase().includes(query) ||
      book.title.en.toLowerCase().includes(query) ||
      book.author.ar.toLowerCase().includes(query) ||
      book.author.en.toLowerCase().includes(query)
    );
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'إدارة الكتب' : 'Manage Books'}
          </h1>
          <p className="text-gray-500 mt-1">
            {books.length} {language === 'ar' ? 'كتاب' : 'books'}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إضافة كتاب' : 'Add Book'}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'البحث عن كتاب...' : 'Search books...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-12 pe-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Cover */}
              <div className="relative aspect-[3/4] bg-gray-100">
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title[language]}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-300" />
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-2 start-2 flex flex-col gap-1">
                  {!book.isPublished && (
                    <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                      {language === 'ar' ? 'مسودة' : 'Draft'}
                    </span>
                  )}
                  {book.isFeatured && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {language === 'ar' ? 'مميز' : 'Featured'}
                    </span>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-2 end-2 flex flex-col gap-1">
                  <button
                    onClick={() => handleTogglePublish(book)}
                    className={`p-2 rounded-full ${
                      book.isPublished
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                    title={book.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {book.isPublished ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                  {book.title[language]}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{book.author[language]}</p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {book.price > 0 ? `$${book.price}` : language === 'ar' ? 'مجاني' : 'Free'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {book.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {book.purchaseCount}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(book)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    disabled={deleting === book.id}
                    className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    {deleting === book.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد كتب' : 'No books yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'ar'
              ? 'ابدأ بإضافة أول كتاب للمتجر'
              : 'Start by adding your first book'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {language === 'ar' ? 'إضافة كتاب' : 'Add Book'}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingBook
                  ? language === 'ar'
                    ? 'تعديل الكتاب'
                    : 'Edit Book'
                  : language === 'ar'
                  ? 'إضافة كتاب جديد'
                  : 'Add New Book'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Title */}
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
                  />
                </div>
              </div>

              {/* Author */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'المؤلف بالعربية' : 'Arabic Author'} *
                  </label>
                  <input
                    type="text"
                    value={formData.authorAr}
                    onChange={(e) => setFormData({ ...formData, authorAr: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'المؤلف بالإنجليزية' : 'English Author'} *
                  </label>
                  <input
                    type="text"
                    value={formData.authorEn}
                    onChange={(e) => setFormData({ ...formData, authorEn: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid md:grid-cols-2 gap-4">
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

              {/* Cover & Files */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'صورة الغلاف' : 'Cover Image'}
                  </label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => !uploadingCover && coverInputRef.current?.click()}
                    className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary-400 transition-colors"
                    style={{ height: '140px' }}
                  >
                    {formData.cover ? (
                      <>
                        <img src={formData.cover} alt="cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-medium flex items-center gap-1">
                            <Upload className="w-4 h-4" />
                            {language === 'ar' ? 'تغيير الصورة' : 'Change image'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                        {uploadingCover ? (
                          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6" />
                            <span className="text-xs">{language === 'ar' ? 'اضغط لرفع صورة' : 'Click to upload'}</span>
                          </>
                        )}
                      </div>
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'رابط الملف (PDF)' : 'File URL (PDF)'}
                  </label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'رابط المعاينة' : 'Preview URL'}
                  </label>
                  <input
                    type="url"
                    value={formData.previewUrl}
                    onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Price */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'السعر ($)' : 'Price ($)'}
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-field"
                    min="0"
                    step="0.01"
                  />
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
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">{language === 'ar' ? 'بدون تصنيف' : 'No category'}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {language === 'ar' ? category.nameAr : category.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Meta */}
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'عدد الصفحات' : 'Pages'}
                  </label>
                  <input
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'اللغة' : 'Language'}
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="input-field"
                  >
                    <option value="ar">{language === 'ar' ? 'العربية' : 'Arabic'}</option>
                    <option value="en">{language === 'ar' ? 'الإنجليزية' : 'English'}</option>
                    <option value="both">{language === 'ar' ? 'كلاهما' : 'Both'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'سنة النشر' : 'Published Year'}
                  </label>
                  <input
                    type="number"
                    value={formData.publishedYear}
                    onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
                    className="input-field"
                    min="1900"
                    max="2030"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">
                    {language === 'ar' ? 'منشور' : 'Published'}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-gray-700 flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500" />
                    {language === 'ar' ? 'مميز' : 'Featured'}
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.titleAr || !formData.titleEn || !formData.authorAr || !formData.authorEn}
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
