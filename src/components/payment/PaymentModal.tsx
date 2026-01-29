'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import PayPalButton from './PayPalButton';
import {
  X,
  Tag,
  CheckCircle,
  Loader2,
  CreditCard,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface Course {
  id: string;
  titleAr: string;
  titleEn: string;
  price: number;
  originalPrice?: number;
  thumbnail?: string;
  instructor?: {
    name: string;
  };
}

interface PaymentModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
  course,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    finalPrice: number;
  } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: couponCode,
          courseId: course.id,
          amount: course.price,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAppliedCoupon({
          code: couponCode,
          discount: data.data.discount,
          finalPrice: data.data.finalPrice,
        });
      } else {
        setCouponError(data.error);
      }
    } catch {
      setCouponError(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePaymentSuccess = (data: any) => {
    setPaymentSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
  };

  if (!isOpen) return null;

  const finalPrice = appliedCoupon ? appliedCoupon.finalPrice : course.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {language === 'ar' ? 'إتمام الشراء' : 'Complete Purchase'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {paymentSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'ar' ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
              </h3>
              <p className="text-gray-500 text-center">
                {language === 'ar'
                  ? 'تم تسجيلك في الدورة بنجاح'
                  : 'You have been enrolled successfully'}
              </p>
            </div>
          ) : (
            <>
              {/* Course Info */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={language === 'ar' ? course.titleAr : course.titleEn}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {language === 'ar' ? course.titleAr : course.titleEn}
                  </h3>
                  {course.instructor && (
                    <p className="text-sm text-gray-500">
                      {language === 'ar' ? 'المدرب: ' : 'Instructor: '}
                      {course.instructor.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Coupon Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'كود الخصم' : 'Coupon Code'}
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-green-600">
                        (-${appliedCoupon.discount.toFixed(2)})
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      {language === 'ar' ? 'إزالة' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={
                        language === 'ar' ? 'أدخل كود الخصم' : 'Enter coupon code'
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {couponLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        language === 'ar' ? 'تطبيق' : 'Apply'
                      )}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {couponError}
                  </p>
                )}
              </div>

              {/* Price Summary */}
              <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>{language === 'ar' ? 'السعر الأصلي' : 'Original Price'}</span>
                  <span>${course.price.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                    <span>-${appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                  <span>${finalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-4">
                  {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                </h4>

                {/* PayPal */}
                <PayPalButton
                  courseId={course.id}
                  amount={finalPrice}
                  couponCode={appliedCoupon?.code}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>

              {/* Security Notice */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>
                  {language === 'ar'
                    ? 'الدفع آمن ومشفر بالكامل'
                    : 'Payment is secure and encrypted'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
