'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  BookOpen,
  ArrowLeft,
  ShoppingCart,
  Download,
  User,
  Calendar,
  FileText,
  Loader2,
  CheckCircle,
  Star,
  Tag,
  Globe,
  Hash,
  CreditCard,
  Building2,
  Eye,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';

interface Book {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  author: { ar: string; en: string };
  cover: string | null;
  price: number;
  originalPrice: number | null;
  previewUrl: string | null;
  pages: number | null;
  language: string;
  isbn: string | null;
  publishedYear: number | null;
  isFeatured: boolean;
  downloads: number;
  purchaseCount: number;
  hasPurchased: boolean;
  category: {
    id: string;
    name: { ar: string; en: string };
  } | null;
}

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, token } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Receipt upload states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);

  useEffect(() => {
    fetchBook();
  }, [id, token]);

  const fetchBook = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/books/${id}`, { headers });
      const result = await response.json();

      if (result.success) {
        setBook(result.data);
      } else {
        router.push('/store');
      }
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      router.push(`/login?redirect=/store/${id}`);
      return;
    }

    if (book?.hasPurchased) {
      return;
    }

    // كتاب مجاني — اضف مباشرة بدون دفع
    if (book?.price === 0) {
      setPurchasing(true);
      setError('');
      try {
        const response = await fetch(`/api/books/${book.id}/purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentMethod: 'free' }),
        });
        const result = await response.json();
        if (result.success) {
          setPurchaseSuccess(true);
          setPurchaseId(result.data.purchaseId);
          setBook({ ...book, hasPurchased: true });
        } else {
          setError(result.error);
        }
      } catch (e) {
        setError(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
      } finally {
        setPurchasing(false);
      }
      return;
    }

    setShowPaymentModal(true);
  };

  const confirmPurchase = async () => {
    if (!token || !book) return;

    setPurchasing(true);
    setError('');

    try {
      const response = await fetch(`/api/books/${book.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod }),
      });

      const result = await response.json();

      if (result.success) {
        setPurchaseSuccess(true);
        setPurchaseId(result.data.purchaseId);
        setShowPaymentModal(false);

        // If bank transfer and requires approval, show receipt upload modal
        if (paymentMethod === 'bank' && result.data.requiresApproval) {
          setShowReceiptModal(true);
        }

        if (!result.data.requiresApproval) {
          setBook({ ...book, hasPurchased: true });
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError(language === 'ar' ? 'حدث خطأ أثناء الشراء' : 'An error occurred during purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError(language === 'ar' ? 'نوع الملف غير مدعوم. يرجى رفع صورة أو PDF' : 'Invalid file type. Please upload an image or PDF');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(language === 'ar' ? 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' : 'File too large. Max 5MB allowed');
        return;
      }

      setReceiptFile(file);
      setError('');

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const uploadReceipt = async () => {
    if (!receiptFile || !purchaseId || !token) return;

    setUploadingReceipt(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      const response = await fetch(`/api/book-purchases/${purchaseId}/receipt`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setReceiptUploaded(true);
        setShowReceiptModal(false);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(language === 'ar' ? 'حدث خطأ أثناء رفع الإيصال' : 'An error occurred while uploading receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleDownload = async () => {
    if (!book) return;

    // لو مش logged in وكتاب مدفوع
    if (!token && book.price > 0) {
      router.push(`/login?redirect=/store/${id}`);
      return;
    }

    try {
      const response = await fetch(`/api/books/${book.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const result = await response.json();

      if (result.success && result.data.downloadUrl) {
        const url = result.data.downloadUrl;
        if (result.data.isExternal) {
          // رابط خارجي — افتح في تاب جديد
          window.open(url, '_blank');
        } else {
          // ملف مرفوع — حمّله مباشرة
          const a = document.createElement('a');
          a.href = url;
          a.download = result.data.title?.[language] || 'book';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        setError(result.error || (language === 'ar' ? 'فشل التحميل' : 'Download failed'));
      }
    } catch (error) {
      console.error('Download error:', error);
      setError(language === 'ar' ? 'حدث خطأ أثناء التحميل' : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="pt-32 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'الكتاب غير موجود' : 'Book not found'}
          </h1>
          <Link href="/store" className="text-primary-600 hover:underline">
            {language === 'ar' ? 'العودة للمتجر' : 'Back to Store'}
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount = book.originalPrice && book.originalPrice > book.price;
  const discountPercent = hasDiscount
    ? Math.round(((book.originalPrice! - book.price) / book.originalPrice!) * 100)
    : 0;

  const languageLabel = {
    ar: language === 'ar' ? 'العربية' : 'Arabic',
    en: language === 'ar' ? 'الإنجليزية' : 'English',
    both: language === 'ar' ? 'العربية والإنجليزية' : 'Arabic & English',
  }[book.language] || book.language;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="solid" />

      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              href="/store"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'ar' ? 'العودة للمتجر' : 'Back to Store'}
            </Link>
          </div>

          {/* Purchase Success Banner */}
          {purchaseSuccess && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">
                    {language === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Your order has been submitted!'}
                  </p>
                  <p className="text-sm text-green-600">
                    {receiptUploaded
                      ? language === 'ar'
                        ? 'تم رفع الإيصال. سيتم مراجعة طلبك وتفعيله قريباً'
                        : 'Receipt uploaded. Your order will be reviewed and activated soon'
                      : language === 'ar'
                        ? 'سيتم مراجعة طلبك وتفعيله قريباً'
                        : 'Your order will be reviewed and activated soon'}
                  </p>
                </div>
              </div>
              {/* Upload Receipt Button */}
              {purchaseId && !receiptUploaded && (
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {language === 'ar' ? 'رفع إيصال التحويل' : 'Upload Transfer Receipt'}
                </button>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Book Cover */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200">
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title[language]}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-24 h-24 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Preview Button */}
                  {book.previewUrl && (
                    <a
                      href={book.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-4 border-t text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                      {language === 'ar' ? 'معاينة الكتاب' : 'Preview Book'}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.isFeatured && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-sm px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 fill-current" />
                      {language === 'ar' ? 'مميز' : 'Featured'}
                    </span>
                  )}
                  {book.category && (
                    <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full">
                      <Tag className="w-4 h-4" />
                      {book.category.name[language]}
                    </span>
                  )}
                </div>

                {/* Title & Author */}
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {book.title[language]}
                </h1>
                <p className="text-lg text-gray-600 flex items-center gap-2 mb-6">
                  <User className="w-5 h-5" />
                  {book.author[language]}
                </p>

                {/* Price */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                  {book.price > 0 ? (
                    <>
                      <span className="text-4xl font-bold text-primary-600">
                        ${book.price.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-xl text-gray-400 line-through">
                            ${book.originalPrice!.toFixed(2)}
                          </span>
                          <span className="bg-red-100 text-red-600 text-sm font-bold px-3 py-1 rounded-full">
                            -{discountPercent}%
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-green-600">
                      {language === 'ar' ? 'مجاني' : 'Free'}
                    </span>
                  )}
                </div>

                {/* Meta Info */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {book.pages && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">
                          {language === 'ar' ? 'عدد الصفحات' : 'Pages'}
                        </p>
                        <p className="font-semibold text-gray-900">{book.pages}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'اللغة' : 'Language'}
                      </p>
                      <p className="font-semibold text-gray-900">{languageLabel}</p>
                    </div>
                  </div>
                  {book.publishedYear && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">
                          {language === 'ar' ? 'سنة النشر' : 'Published'}
                        </p>
                        <p className="font-semibold text-gray-900">{book.publishedYear}</p>
                      </div>
                    </div>
                  )}
                  {book.isbn && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Hash className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">ISBN</p>
                        <p className="font-semibold text-gray-900">{book.isbn}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Download className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'التحميلات' : 'Downloads'}
                      </p>
                      <p className="font-semibold text-gray-900">{book.downloads}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {language === 'ar' ? 'وصف الكتاب' : 'Book Description'}
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {book.description[language]}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {book.hasPurchased ? (
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      {language === 'ar' ? 'تحميل الكتاب' : 'Download Book'}
                    </button>
                  ) : (
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-70"
                    >
                      {purchasing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-5 h-5" />
                      )}
                      {book.price > 0
                        ? language === 'ar' ? 'شراء الآن' : 'Buy Now'
                        : language === 'ar' ? 'احصل عليه مجاناً' : 'Get it Free'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {language === 'ar' ? 'إتمام الشراء' : 'Complete Purchase'}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Book Summary */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={book.title[language]}
                  className="w-16 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{book.title[language]}</h4>
                <p className="text-sm text-gray-500">{book.author[language]}</p>
                <p className="text-lg font-bold text-primary-600 mt-1">
                  ${book.price.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700">
                {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
              </p>
              <button
                onClick={() => setPaymentMethod('bank')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-5 h-5 text-gray-600" />
                <span className="font-medium">
                  {language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}
                </span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="font-medium">
                  {language === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}
                </span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={confirmPurchase}
                disabled={purchasing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {purchasing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {language === 'ar' ? 'تأكيد الشراء' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {language === 'ar' ? 'رفع إيصال التحويل' : 'Upload Transfer Receipt'}
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <p className="text-gray-600 mb-4">
              {language === 'ar'
                ? 'يرجى رفع صورة أو ملف PDF لإيصال التحويل البنكي لتسريع مراجعة طلبك'
                : 'Please upload an image or PDF of your bank transfer receipt to speed up order review'}
            </p>

            {/* Upload Area */}
            <div className="mb-6">
              {receiptPreview ? (
                <div className="relative">
                  <img
                    src={receiptPreview}
                    alt="Receipt preview"
                    className="w-full max-h-64 object-contain rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptPreview(null);
                    }}
                    className="absolute top-2 end-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : receiptFile ? (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <FileText className="w-10 h-10 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{receiptFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptPreview(null);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all">
                  <Upload className="w-10 h-10 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'ar' ? 'اضغط لاختيار ملف' : 'Click to select file'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {language === 'ar' ? 'JPG, PNG, WEBP أو PDF (حد أقصى 5 ميجابايت)' : 'JPG, PNG, WEBP or PDF (max 5MB)'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleReceiptFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {language === 'ar' ? 'لاحقاً' : 'Later'}
              </button>
              <button
                onClick={uploadReceipt}
                disabled={!receiptFile || uploadingReceipt}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {uploadingReceipt ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {language === 'ar' ? 'رفع الإيصال' : 'Upload Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
