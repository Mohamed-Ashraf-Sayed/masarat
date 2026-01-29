'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  CreditCard,
  Lock,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Shield,
  Clock,
  BookOpen,
  Users,
  Star,
  AlertCircle,
  Plus,
  MapPin,
  Trash2,
  Upload,
  FileImage,
  X,
} from 'lucide-react';
import PayPalButton from '@/components/payment/PayPalButton';

interface CourseData {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  thumbnail: string;
  price: number;
  originalPrice: number | null;
  duration: number;
  instructor: {
    name: string;
    avatar: string | null;
  };
  stats: {
    studentsCount: number;
    lessonsCount: number;
    rating: number;
  };
}

interface PaymentSettings {
  currency: string;
  paymentMethods: {
    card: { enabled: boolean; label: { ar: string; en: string } };
    paypal: { enabled: boolean; label: { ar: string; en: string } };
    bank: { enabled: boolean; label: { ar: string; en: string } };
  };
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
    swiftCode: string;
    notes: { ar: string; en: string };
  };
  taxRate: number;
  requireManualApproval: boolean;
}

type PaymentMethod = 'card' | 'paypal' | 'bank';

interface SavedBillingInfo {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string | null;
  city: string | null;
  address: string | null;
  label: string | null;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading, logout } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Success, 4: Pending Approval
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [error, setError] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [orderInfo, setOrderInfo] = useState<{ transactionId: string; amount: number; currency: string; paymentId: string } | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);

  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedBillingInfo[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveBillingInfo, setSaveBillingInfo] = useState(true);

  const [cardInfo, setCardInfo] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/login?redirect=/checkout/${courseId}`);
      return;
    }

    // Pre-fill with user data
    setBillingInfo(prev => ({
      ...prev,
      fullName: user.name || '',
      email: user.email || '',
    }));

    checkEnrollmentAndFetchCourse();
    fetchSavedBillingInfo();
  }, [user, courseId, authLoading, router, token]);

  const fetchSavedBillingInfo = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/billing-info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      // Handle user not found - logout and redirect
      if (response.status === 401 || result.error === 'User not found') {
        logout();
        router.push(`/login?redirect=/checkout/${courseId}`);
        return;
      }

      if (result.success && result.data.length > 0) {
        setSavedAddresses(result.data);
        // Select the default address
        const defaultAddress = result.data.find((a: SavedBillingInfo) => a.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setBillingInfo({
            fullName: defaultAddress.fullName,
            email: defaultAddress.email,
            phone: defaultAddress.phone,
            country: defaultAddress.country || '',
            city: defaultAddress.city || '',
          });
        }
      } else {
        // No saved addresses, show the form
        setShowNewAddressForm(true);
      }
    } catch (error) {
      console.error('Error fetching billing info:', error);
      setShowNewAddressForm(true);
    }
  };

  const handleSelectAddress = (address: SavedBillingInfo) => {
    setSelectedAddressId(address.id);
    setBillingInfo({
      fullName: address.fullName,
      email: address.email,
      phone: address.phone,
      country: address.country || '',
      city: address.city || '',
    });
    setShowNewAddressForm(false);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/billing-info?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setSavedAddresses(savedAddresses.filter(a => a.id !== id));
        if (selectedAddressId === id) {
          setSelectedAddressId(null);
          setBillingInfo({
            fullName: user?.name || '',
            email: user?.email || '',
            phone: '',
            country: '',
            city: '',
          });
          setShowNewAddressForm(true);
        }
      }
    } catch (error) {
      console.error('Error deleting billing info:', error);
    }
  };

  const checkEnrollmentAndFetchCourse = async () => {
    try {
      // Check if already enrolled
      if (token) {
        const enrollmentRes = await fetch(`/api/enrollments/check?courseId=${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const enrollmentData = await enrollmentRes.json();
        if (enrollmentData.success && enrollmentData.data.isEnrolled) {
          // Already enrolled, redirect to learn page
          router.push(`/courses/${courseId}/learn`);
          return;
        }
      }

      // Fetch course details and payment settings in parallel
      const [courseRes, settingsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch('/api/payment-settings'),
      ]);

      const courseResult = await courseRes.json();
      const settingsResult = await settingsRes.json();

      if (settingsResult.success) {
        setPaymentSettings(settingsResult.data);
        // Set default payment method based on enabled methods
        if (settingsResult.data.paymentMethods) {
          if (settingsResult.data.paymentMethods.card?.enabled) {
            setPaymentMethod('card');
          } else if (settingsResult.data.paymentMethods.paypal?.enabled) {
            setPaymentMethod('paypal');
          } else if (settingsResult.data.paymentMethods.bank?.enabled) {
            setPaymentMethod('bank');
          }
        }
      }

      if (courseResult.success) {
        // If course is free, redirect to course page
        if (courseResult.data.price === 0) {
          router.push(`/courses/${courseId}`);
          return;
        }
        setCourse(courseResult.data);
      } else {
        router.push('/courses');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/courses');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = async () => {
    if (!billingInfo.fullName || !billingInfo.email || !billingInfo.phone) {
      setError(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email)) {
      setError(language === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address');
      return false;
    }
    setError('');

    // Save billing info if it's a new address and user wants to save it
    if (showNewAddressForm && saveBillingInfo && token) {
      try {
        const response = await fetch('/api/billing-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...billingInfo,
            isDefault: savedAddresses.length === 0,
          }),
        });
        const result = await response.json();
        if (result.success) {
          setSavedAddresses([...savedAddresses, result.data]);
          setSelectedAddressId(result.data.id);
          setShowNewAddressForm(false);
        }
      } catch (error) {
        console.error('Error saving billing info:', error);
      }
    }

    return true;
  };

  const validateStep2 = () => {
    if (paymentMethod === 'card') {
      if (!cardInfo.number || !cardInfo.name || !cardInfo.expiry || !cardInfo.cvv) {
        setError(language === 'ar' ? 'يرجى ملء جميع بيانات البطاقة' : 'Please fill all card details');
        return false;
      }
      if (cardInfo.number.replace(/\s/g, '').length < 16) {
        setError(language === 'ar' ? 'رقم البطاقة غير صالح' : 'Invalid card number');
        return false;
      }
      if (cardInfo.cvv.length < 3) {
        setError(language === 'ar' ? 'رمز CVV غير صالح' : 'Invalid CVV');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await validateStep1();
      if (isValid) {
        setStep(2);
      }
    } else if (step === 2 && validateStep2()) {
      processPayment();
    }
  };

  const processPayment = async () => {
    setProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          paymentMethod,
          billingInfo,
          cardInfo: paymentMethod === 'card' ? {
            last4: cardInfo.number.slice(-4),
          } : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.data.requiresApproval) {
          // Order needs approval (bank transfer or manual approval enabled)
          setOrderInfo({
            transactionId: result.data.payment.transactionId,
            amount: result.data.payment.amount,
            currency: result.data.payment.currency,
            paymentId: result.data.payment.id,
          });
          setStep(4); // Pending approval step
        } else {
          // Order completed immediately
          setStep(3); // Success step
        }
      } else {
        // Handle user not found error - logout and redirect to login
        if (result.error === 'User not found. Please log in again.' || response.status === 401) {
          logout();
          router.push(`/login?redirect=/checkout/${courseId}`);
          return;
        }
        setError(result.error || (language === 'ar' ? 'فشل في إتمام الدفع' : 'Payment failed'));
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(language === 'ar' ? 'حدث خطأ أثناء الدفع' : 'An error occurred during payment');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Get currency symbol and format price
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      SAR: 'ر.س',
      AED: 'د.إ',
      EGP: 'ج.م',
    };
    return symbols[currency] || currency;
  };

  const currency = paymentSettings?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  // Calculate total with tax
  const taxRate = paymentSettings?.taxRate || 0;
  const taxAmount = course ? (course.price * taxRate) / 100 : 0;
  const totalAmount = course ? course.price + taxAmount : 0;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  // Success Step
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="pt-32 pb-20">
          <div className="max-w-xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
              </h1>
              <p className="text-gray-600 mb-6">
                {language === 'ar'
                  ? 'تم تسجيلك في الدورة بنجاح. يمكنك البدء في التعلم الآن.'
                  : 'You have been successfully enrolled in the course. You can start learning now.'}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={course.thumbnail || 'https://via.placeholder.com/100'}
                    alt={course.title[language]}
                    className="w-20 h-14 object-cover rounded-lg"
                  />
                  <div className="text-start">
                    <h3 className="font-semibold text-gray-900">{course.title[language]}</h3>
                    <p className="text-sm text-gray-500">{course.instructor.name}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/courses/${courseId}/learn`}
                  className="flex-1 btn-primary"
                >
                  {language === 'ar' ? 'ابدأ التعلم' : 'Start Learning'}
                </Link>
                <Link
                  href="/dashboard/courses"
                  className="flex-1 btn-secondary"
                >
                  {language === 'ar' ? 'دوراتي' : 'My Courses'}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle receipt file selection
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError(language === 'ar' ? 'نوع الملف غير مدعوم. يُسمح فقط بـ JPG, PNG, WEBP, PDF' : 'Invalid file type. Allowed: JPG, PNG, WEBP, PDF');
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
        reader.onload = (e) => setReceiptPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  // Upload receipt
  const handleUploadReceipt = async () => {
    if (!receiptFile || !orderInfo?.paymentId) return;

    setUploadingReceipt(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      const response = await fetch(`/api/payments/${orderInfo.paymentId}/receipt`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setReceiptUploaded(true);
      } else {
        setError(result.error || (language === 'ar' ? 'فشل رفع الإيصال' : 'Failed to upload receipt'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(language === 'ar' ? 'حدث خطأ أثناء رفع الإيصال' : 'An error occurred while uploading receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Pending Approval Step (step 4)
  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="pt-32 pb-20">
          <div className="max-w-xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'تم إرسال طلبك!' : 'Order Submitted!'}
              </h1>
              <p className="text-gray-600 mb-6">
                {paymentMethod === 'bank'
                  ? (language === 'ar'
                    ? 'يرجى إتمام التحويل البنكي ورفع إيصال التحويل لتسريع عملية التفعيل.'
                    : 'Please complete the bank transfer and upload the receipt to speed up activation.')
                  : (language === 'ar'
                    ? 'طلبك قيد المراجعة وسيتم تفعيل اشتراكك قريباً.'
                    : 'Your order is under review. Your enrollment will be activated soon.')}
              </p>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-start">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {language === 'ar' ? 'معلومات الطلب' : 'Order Information'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}:</span>
                    <span className="font-mono">{orderInfo?.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === 'ar' ? 'المبلغ' : 'Amount'}:</span>
                    <span className="font-semibold">
                      {getCurrencySymbol(orderInfo?.currency || 'USD')} {orderInfo?.amount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details for bank transfer */}
              {paymentMethod === 'bank' && paymentSettings?.bankDetails && (
                <div className="bg-blue-50 rounded-xl p-4 mb-6 text-start">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    {language === 'ar' ? 'معلومات التحويل البنكي' : 'Bank Transfer Details'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    {paymentSettings.bankDetails.bankName && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">{language === 'ar' ? 'اسم البنك' : 'Bank Name'}:</span>
                        <span className="font-medium">{paymentSettings.bankDetails.bankName}</span>
                      </div>
                    )}
                    {paymentSettings.bankDetails.accountName && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">{language === 'ar' ? 'اسم الحساب' : 'Account Name'}:</span>
                        <span className="font-medium">{paymentSettings.bankDetails.accountName}</span>
                      </div>
                    )}
                    {paymentSettings.bankDetails.accountNumber && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">{language === 'ar' ? 'رقم الحساب' : 'Account Number'}:</span>
                        <span className="font-mono">{paymentSettings.bankDetails.accountNumber}</span>
                      </div>
                    )}
                    {paymentSettings.bankDetails.iban && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">IBAN:</span>
                        <span className="font-mono text-xs">{paymentSettings.bankDetails.iban}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    {language === 'ar'
                      ? '⚠️ يرجى ذكر رقم الطلب في وصف التحويل'
                      : '⚠️ Please include order ID in transfer description'}
                  </p>
                </div>
              )}

              {/* Receipt Upload Section for bank transfer */}
              {paymentMethod === 'bank' && (
                <div className="bg-green-50 rounded-xl p-4 mb-6 text-start">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    {language === 'ar' ? 'رفع إيصال التحويل' : 'Upload Transfer Receipt'}
                  </h3>

                  {receiptUploaded ? (
                    <div className="flex items-center gap-3 p-4 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">
                          {language === 'ar' ? 'تم رفع الإيصال بنجاح!' : 'Receipt uploaded successfully!'}
                        </p>
                        <p className="text-sm text-green-600">
                          {language === 'ar' ? 'سيتم مراجعة طلبك قريباً' : 'Your order will be reviewed soon'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {error}
                        </div>
                      )}

                      {!receiptFile ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-100/50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileImage className="w-8 h-8 text-green-500 mb-2" />
                            <p className="text-sm text-green-700">
                              {language === 'ar' ? 'اضغط لرفع الإيصال' : 'Click to upload receipt'}
                            </p>
                            <p className="text-xs text-green-500 mt-1">
                              JPG, PNG, WEBP, PDF (max 5MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleReceiptFileChange}
                          />
                        </label>
                      ) : (
                        <div className="space-y-3">
                          {/* Preview */}
                          <div className="relative">
                            {receiptPreview ? (
                              <img
                                src={receiptPreview}
                                alt="Receipt preview"
                                className="w-full h-40 object-contain bg-white rounded-lg border"
                              />
                            ) : (
                              <div className="w-full h-20 bg-white rounded-lg border flex items-center justify-center gap-2 text-gray-600">
                                <FileImage className="w-6 h-6" />
                                <span>{receiptFile.name}</span>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setReceiptFile(null);
                                setReceiptPreview(null);
                              }}
                              className="absolute top-2 end-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Upload Button */}
                          <button
                            onClick={handleUploadReceipt}
                            disabled={uploadingReceipt}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {uploadingReceipt ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5" />
                                {language === 'ar' ? 'رفع الإيصال' : 'Upload Receipt'}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Course Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={course.thumbnail || 'https://via.placeholder.com/100'}
                    alt={course.title[language]}
                    className="w-20 h-14 object-cover rounded-lg"
                  />
                  <div className="text-start">
                    <h3 className="font-semibold text-gray-900">{course.title[language]}</h3>
                    <p className="text-sm text-gray-500">{course.instructor.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="flex-1 btn-primary"
                >
                  {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                </Link>
                <Link
                  href="/courses"
                  className="flex-1 btn-secondary"
                >
                  {language === 'ar' ? 'تصفح الدورات' : 'Browse Courses'}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="solid" />

      <div className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            {language === 'ar' ? 'العودة للدورة' : 'Back to Course'}
          </Link>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <span className="hidden sm:inline font-medium">
                  {language === 'ar' ? 'البيانات' : 'Information'}
                </span>
              </div>
              <div className={`w-12 h-1 rounded ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                </div>
                <span className="hidden sm:inline font-medium">
                  {language === 'ar' ? 'الدفع' : 'Payment'}
                </span>
              </div>
              <div className={`w-12 h-1 rounded ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`} />
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  3
                </div>
                <span className="hidden sm:inline font-medium">
                  {language === 'ar' ? 'تأكيد' : 'Confirmation'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {step === 1 && (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      {language === 'ar' ? 'معلومات الفاتورة' : 'Billing Information'}
                    </h2>

                    {/* Saved Addresses */}
                    {savedAddresses.length > 0 && !showNewAddressForm && (
                      <div className="space-y-3 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {language === 'ar' ? 'العناوين المحفوظة' : 'Saved Addresses'}
                        </label>
                        {savedAddresses.map((address) => (
                          <div
                            key={address.id}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedAddressId === address.id
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleSelectAddress(address)}
                          >
                            <div className="flex items-start gap-3">
                              <MapPin className={`w-5 h-5 mt-0.5 ${
                                selectedAddressId === address.id ? 'text-primary-600' : 'text-gray-400'
                              }`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{address.fullName}</span>
                                  {address.isDefault && (
                                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                      {language === 'ar' ? 'افتراضي' : 'Default'}
                                    </span>
                                  )}
                                  {address.label && (
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                      {address.label}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{address.email}</p>
                                <p className="text-sm text-gray-600">{address.phone}</p>
                                {(address.city || address.country) && (
                                  <p className="text-sm text-gray-500">
                                    {[address.city, address.country].filter(Boolean).join(', ')}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAddress(address.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add New Address Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewAddressForm(true);
                            setSelectedAddressId(null);
                            setBillingInfo({
                              fullName: user?.name || '',
                              email: user?.email || '',
                              phone: '',
                              country: '',
                              city: '',
                            });
                          }}
                          className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 text-gray-600 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          {language === 'ar' ? 'إضافة عنوان جديد' : 'Add New Address'}
                        </button>
                      </div>
                    )}

                    {/* New Address Form */}
                    {(showNewAddressForm || savedAddresses.length === 0) && (
                      <div className="space-y-4">
                        {savedAddresses.length > 0 && (
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900">
                              {language === 'ar' ? 'عنوان جديد' : 'New Address'}
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewAddressForm(false);
                                const defaultAddress = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
                                if (defaultAddress) {
                                  handleSelectAddress(defaultAddress);
                                }
                              }}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </button>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
                          </label>
                          <input
                            type="text"
                            value={billingInfo.fullName}
                            onChange={(e) => setBillingInfo({ ...billingInfo, fullName: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                            placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                            </label>
                            <input
                              type="email"
                              value={billingInfo.email}
                              onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                              placeholder="email@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *
                            </label>
                            <input
                              type="tel"
                              value={billingInfo.phone}
                              onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                              placeholder="+20 10 0000 0000"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'ar' ? 'الدولة' : 'Country'}
                            </label>
                            <select
                              value={billingInfo.country}
                              onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                            >
                              <option value="">{language === 'ar' ? 'اختر الدولة' : 'Select Country'}</option>
                              <option value="EG">{language === 'ar' ? 'مصر' : 'Egypt'}</option>
                              <option value="SA">{language === 'ar' ? 'السعودية' : 'Saudi Arabia'}</option>
                              <option value="AE">{language === 'ar' ? 'الإمارات' : 'UAE'}</option>
                              <option value="JO">{language === 'ar' ? 'الأردن' : 'Jordan'}</option>
                              <option value="KW">{language === 'ar' ? 'الكويت' : 'Kuwait'}</option>
                              <option value="QA">{language === 'ar' ? 'قطر' : 'Qatar'}</option>
                              <option value="BH">{language === 'ar' ? 'البحرين' : 'Bahrain'}</option>
                              <option value="OM">{language === 'ar' ? 'عمان' : 'Oman'}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'ar' ? 'المدينة' : 'City'}
                            </label>
                            <input
                              type="text"
                              value={billingInfo.city}
                              onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                              placeholder={language === 'ar' ? 'المدينة' : 'City'}
                            />
                          </div>
                        </div>

                        {/* Save billing info checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer mt-4">
                          <input
                            type="checkbox"
                            checked={saveBillingInfo}
                            onChange={(e) => setSaveBillingInfo(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-600">
                            {language === 'ar'
                              ? 'حفظ معلومات الفاتورة للمرات القادمة'
                              : 'Save billing info for future purchases'}
                          </span>
                        </label>
                      </div>
                    )}
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                    </h2>

                    {/* Payment Methods */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {(!paymentSettings || paymentSettings.paymentMethods.card?.enabled) && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === 'card'
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                            paymentMethod === 'card' ? 'text-primary-600' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            paymentMethod === 'card' ? 'text-primary-600' : 'text-gray-600'
                          }`}>
                            {paymentSettings?.paymentMethods.card?.label?.[language] || (language === 'ar' ? 'بطاقة' : 'Card')}
                          </span>
                        </button>
                      )}
                      {(!paymentSettings || paymentSettings.paymentMethods.paypal?.enabled) && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('paypal')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === 'paypal'
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-6 h-6 mx-auto mb-2 font-bold text-lg ${
                            paymentMethod === 'paypal' ? 'text-primary-600' : 'text-gray-400'
                          }`}>P</div>
                          <span className={`text-sm font-medium ${
                            paymentMethod === 'paypal' ? 'text-primary-600' : 'text-gray-600'
                          }`}>
                            {paymentSettings?.paymentMethods.paypal?.label?.[language] || 'PayPal'}
                          </span>
                        </button>
                      )}
                      {(!paymentSettings || paymentSettings.paymentMethods.bank?.enabled) && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bank')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === 'bank'
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-6 h-6 mx-auto mb-2 ${
                            paymentMethod === 'bank' ? 'text-primary-600' : 'text-gray-400'
                          }`}>🏦</div>
                          <span className={`text-sm font-medium ${
                            paymentMethod === 'bank' ? 'text-primary-600' : 'text-gray-600'
                          }`}>
                            {paymentSettings?.paymentMethods.bank?.label?.[language] || (language === 'ar' ? 'تحويل' : 'Bank')}
                          </span>
                        </button>
                      )}
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'ar' ? 'رقم البطاقة' : 'Card Number'} *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardInfo.number}
                              onChange={(e) => setCardInfo({ ...cardInfo, number: formatCardNumber(e.target.value) })}
                              maxLength={19}
                              className="w-full px-4 py-3 ps-12 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                              placeholder="0000 0000 0000 0000"
                            />
                            <CreditCard className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'ar' ? 'الاسم على البطاقة' : 'Name on Card'} *
                          </label>
                          <input
                            type="text"
                            value={cardInfo.name}
                            onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                            placeholder={language === 'ar' ? 'الاسم كما يظهر على البطاقة' : 'Name as it appears on card'}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'} *
                            </label>
                            <input
                              type="text"
                              value={cardInfo.expiry}
                              onChange={(e) => setCardInfo({ ...cardInfo, expiry: formatExpiry(e.target.value) })}
                              maxLength={5}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                              placeholder="MM/YY"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV *
                            </label>
                            <input
                              type="text"
                              value={cardInfo.cvv}
                              onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                              maxLength={4}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                              placeholder="123"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'paypal' && (
                      <div className="py-4">
                        <p className="text-gray-600 mb-4 text-center">
                          {language === 'ar'
                            ? 'اضغط على زر PayPal أدناه لإتمام الدفع'
                            : 'Click the PayPal button below to complete payment'}
                        </p>
                        <PayPalButton
                          courseId={courseId as string}
                          amount={totalAmount}
                          onSuccess={(data) => {
                            setStep(3);
                          }}
                          onError={(error) => {
                            setError(language === 'ar' ? 'فشل الدفع عبر PayPal' : 'PayPal payment failed');
                          }}
                        />
                      </div>
                    )}

                    {paymentMethod === 'bank' && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">
                          {language === 'ar' ? 'معلومات التحويل البنكي' : 'Bank Transfer Details'}
                        </h4>
                        <div className="space-y-3 text-sm">
                          {paymentSettings?.bankDetails?.bankName && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">{language === 'ar' ? 'اسم البنك' : 'Bank Name'}:</span>
                              <span className="font-medium">{paymentSettings.bankDetails.bankName}</span>
                            </div>
                          )}
                          {paymentSettings?.bankDetails?.accountName && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">{language === 'ar' ? 'اسم صاحب الحساب' : 'Account Holder'}:</span>
                              <span className="font-medium">{paymentSettings.bankDetails.accountName}</span>
                            </div>
                          )}
                          {paymentSettings?.bankDetails?.accountNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">{language === 'ar' ? 'رقم الحساب' : 'Account Number'}:</span>
                              <span className="font-medium font-mono">{paymentSettings.bankDetails.accountNumber}</span>
                            </div>
                          )}
                          {paymentSettings?.bankDetails?.iban && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">IBAN:</span>
                              <span className="font-medium font-mono text-xs">{paymentSettings.bankDetails.iban}</span>
                            </div>
                          )}
                          {paymentSettings?.bankDetails?.swiftCode && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">SWIFT:</span>
                              <span className="font-medium font-mono">{paymentSettings.bankDetails.swiftCode}</span>
                            </div>
                          )}
                        </div>

                        {/* Amount to transfer */}
                        <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
                          <div className="flex justify-between items-center">
                            <span className="text-primary-700 font-medium">
                              {language === 'ar' ? 'المبلغ المطلوب تحويله' : 'Amount to transfer'}:
                            </span>
                            <span className="text-primary-700 font-bold text-lg">
                              {currencySymbol} {totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {paymentSettings?.bankDetails?.notes?.[language] && (
                          <p className="text-sm text-gray-600 mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            {paymentSettings.bankDetails.notes[language]}
                          </p>
                        )}

                        {paymentSettings?.requireManualApproval && (
                          <p className="text-xs text-gray-500 mt-4">
                            {language === 'ar'
                              ? '⚠️ سيتم مراجعة طلبك والموافقة عليه بعد التحقق من التحويل'
                              : '⚠️ Your order will be reviewed and approved after verifying the transfer'}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      {language === 'ar' ? 'السابق' : 'Previous'}
                    </button>
                  )}
                  {step === 1 && <div />}

                  {/* Hide pay button when PayPal is selected (PayPal has its own button) */}
                  {!(step === 2 && paymentMethod === 'paypal') && (
                    <button
                      onClick={handleNextStep}
                      disabled={processing}
                      className="btn-primary flex items-center gap-2"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                        </>
                      ) : step === 2 ? (
                        <>
                          <Lock className="w-5 h-5" />
                          {language === 'ar' ? `ادفع ${currencySymbol} ${totalAmount.toFixed(2)}` : `Pay ${currencySymbol} ${totalAmount.toFixed(2)}`}
                        </>
                      ) : (
                        language === 'ar' ? 'التالي' : 'Next'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
                <Shield className="w-5 h-5" />
                <span>
                  {language === 'ar'
                    ? 'بياناتك محمية بتشفير SSL 256-bit'
                    : 'Your data is protected with 256-bit SSL encryption'}
                </span>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">
                  {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                </h3>

                {/* Course Card */}
                <div className="flex gap-4 pb-4 border-b border-gray-100">
                  <img
                    src={course.thumbnail || 'https://via.placeholder.com/100'}
                    alt={course.title[language]}
                    className="w-20 h-14 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {course.title[language]}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{course.instructor.name}</p>
                  </div>
                </div>

                {/* Course Stats */}
                <div className="py-4 border-b border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration} {language === 'ar' ? 'ساعة' : 'hours'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.stats.lessonsCount} {language === 'ar' ? 'درس' : 'lessons'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{course.stats.studentsCount.toLocaleString()} {language === 'ar' ? 'طالب' : 'students'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>{course.stats.rating}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{language === 'ar' ? 'السعر' : 'Price'}</span>
                    <span>{currencySymbol} {course.originalPrice || course.price}</span>
                  </div>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                      <span className="text-green-600">-{currencySymbol} {course.originalPrice - course.price}</span>
                    </div>
                  )}
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{language === 'ar' ? `الضريبة (${taxRate}%)` : `Tax (${taxRate}%)`}</span>
                      <span>{currencySymbol} {taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                    <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                    <span className="text-primary-600">{currencySymbol} {totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Guarantee */}
                <div className="mt-6 p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700">
                      {language === 'ar'
                        ? 'ضمان استرداد المال خلال 30 يوم'
                        : '30-Day Money-Back Guarantee'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
