'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BookOpen,
  Download,
  Clock,
  CheckCircle,
  Loader2,
  ExternalLink,
  ShoppingBag,
  AlertCircle,
  Calendar,
  FileText,
} from 'lucide-react';

interface BookPurchase {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  amount: number;
  currency: string;
  downloadCount: number;
  purchasedAt: string;
  book: {
    id: string;
    title: { ar: string; en: string };
    author: { ar: string; en: string };
    cover: string | null;
    pages: number | null;
    hasFile: boolean;
  };
}

export default function UserBooksPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();

  const [purchases, setPurchases] = useState<BookPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    fetchPurchases();
  }, [user, token, router, authLoading]);

  const fetchPurchases = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/user/books', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setPurchases(result.data);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (bookId: string) => {
    if (!token) return;

    setDownloading(bookId);
    setError('');

    try {
      const response = await fetch(`/api/books/${bookId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank');
        // Refresh to update download count
        fetchPurchases();
      } else {
        setError(result.error || (language === 'ar' ? 'فشل التحميل' : 'Download failed'));
      }
    } catch (error) {
      console.error('Download error:', error);
      setError(language === 'ar' ? 'حدث خطأ أثناء التحميل' : 'An error occurred during download');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            {language === 'ar' ? 'مكتمل' : 'Completed'}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            <Clock className="w-3 h-3" />
            {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            <AlertCircle className="w-3 h-3" />
            {language === 'ar' ? 'فشل' : 'Failed'}
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const completedPurchases = purchases.filter((p) => p.status === 'COMPLETED');
  const pendingPurchases = purchases.filter((p) => p.status === 'PENDING');

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'كتبي' : 'My Books'}
          </h1>
          <p className="text-gray-500 mt-1">
            {completedPurchases.length}{' '}
            {language === 'ar' ? 'كتاب في مكتبتك' : 'books in your library'}
          </p>
        </div>
        <Link
          href="/store"
          className="btn-primary inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          {language === 'ar' ? 'تصفح المتجر' : 'Browse Store'}
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Pending Purchases */}
      {pendingPurchases.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            {language === 'ar' ? 'طلبات قيد المراجعة' : 'Pending Orders'}
          </h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="space-y-4">
              {pendingPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm"
                >
                  {purchase.book.cover ? (
                    <img
                      src={purchase.book.cover}
                      alt={purchase.book.title[language]}
                      className="w-16 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {purchase.book.title[language]}
                    </h3>
                    <p className="text-sm text-gray-500">{purchase.book.author[language]}</p>
                    <p className="text-sm text-yellow-600 mt-1">
                      {language === 'ar'
                        ? 'جاري مراجعة طلبك...'
                        : 'Your order is being reviewed...'}
                    </p>
                  </div>
                  {getStatusBadge(purchase.status)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Completed Purchases */}
      {completedPurchases.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedPurchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Cover */}
              <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200">
                {purchase.book.cover ? (
                  <img
                    src={purchase.book.cover}
                    alt={purchase.book.title[language]}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {/* Owned Badge */}
                <div className="absolute top-3 start-3">
                  <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {language === 'ar' ? 'مملوك' : 'Owned'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                  {purchase.book.title[language]}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{purchase.book.author[language]}</p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  {purchase.book.pages && (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {purchase.book.pages} {language === 'ar' ? 'صفحة' : 'pages'}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {purchase.downloadCount} {language === 'ar' ? 'تحميل' : 'downloads'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {purchase.book.hasFile ? (
                    <button
                      onClick={() => handleDownload(purchase.book.id)}
                      disabled={downloading === purchase.book.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {downloading === purchase.book.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      {language === 'ar' ? 'تحميل' : 'Download'}
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-500 rounded-xl">
                      <AlertCircle className="w-5 h-5" />
                      {language === 'ar' ? 'الملف غير متاح' : 'File not available'}
                    </div>
                  )}
                  <Link
                    href={`/store/${purchase.book.id}`}
                    className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>

                {/* Purchase Date */}
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {language === 'ar' ? 'تم الشراء:' : 'Purchased:'}{' '}
                  {new Date(purchase.purchasedAt).toLocaleDateString(
                    language === 'ar' ? 'ar-SA' : 'en-US'
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        pendingPurchases.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لا توجد كتب بعد' : 'No books yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {language === 'ar'
                ? 'ابدأ بتصفح المتجر واكتشف مجموعة متنوعة من الكتب'
                : 'Start browsing the store and discover a variety of books'}
            </p>
            <Link
              href="/store"
              className="btn-primary inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              {language === 'ar' ? 'تصفح المتجر' : 'Browse Store'}
            </Link>
          </div>
        )
      )}
    </DashboardLayout>
  );
}
