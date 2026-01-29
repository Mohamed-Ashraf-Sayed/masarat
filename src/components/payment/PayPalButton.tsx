'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PayPalButtonProps {
  courseId: string;
  amount: number;
  couponCode?: string;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalButton({
  courseId,
  amount,
  couponCode,
  onSuccess,
  onError,
  disabled = false,
}: PayPalButtonProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  // Fallback to hardcoded sandbox ID if env var not available
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';

  useEffect(() => {
    if (!clientId) {
      setSdkError(true);
      setLoading(false);
      return;
    }

    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      setSdkReady(true);
      setLoading(false);
      return;
    }

    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.async = true;

    script.onload = () => {
      setSdkReady(true);
      setLoading(false);
    };

    script.onerror = () => {
      setSdkError(true);
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [clientId]);

  useEffect(() => {
    if (sdkReady && window.paypal && paypalRef.current && !buttonsRendered.current) {
      buttonsRendered.current = true;

      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          shape: 'rect',
          label: 'pay',
          height: 50,
        },

        createOrder: async () => {
          setStatus('processing');

          try {
            const response = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                courseId,
                couponCode,
              }),
            });

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error);
            }

            // If course is free (100% coupon), handle it
            if (data.data.free) {
              setStatus('success');
              onSuccess(data.data);
              return null;
            }

            return data.data.orderId;
          } catch (error: any) {
            setStatus('error');
            onError(error);
            throw error;
          }
        },

        onApprove: async (data: any) => {
          setStatus('processing');

          try {
            const response = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                orderId: data.orderID,
              }),
            });

            const result = await response.json();

            if (!result.success) {
              throw new Error(result.error);
            }

            setStatus('success');
            onSuccess(result.data);
          } catch (error: any) {
            setStatus('error');
            onError(error);
          }
        },

        onError: (err: any) => {
          setStatus('error');
          onError(err);
        },

        onCancel: () => {
          setStatus('idle');
        },
      }).render(paypalRef.current);
    }
  }, [sdkReady, courseId, couponCode, onSuccess, onError]);

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-xl">
        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
        <p className="text-green-700 font-medium">
          {language === 'ar' ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-xl">
        <XCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-red-700 font-medium mb-3">
          {language === 'ar' ? 'فشل الدفع' : 'Payment Failed'}
        </p>
        <button
          onClick={() => {
            setStatus('idle');
            buttonsRendered.current = false;
          }}
          className="text-sm text-red-600 hover:underline"
        >
          {language === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
        </button>
      </div>
    );
  }

  if (!clientId || sdkError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-yellow-50 rounded-xl">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-3" />
        <p className="text-yellow-700 font-medium text-center">
          {language === 'ar' ? 'PayPal غير مُعد. يرجى التواصل مع الدعم.' : 'PayPal is not configured. Please contact support.'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-gray-600 text-sm">
          {language === 'ar' ? 'جاري تحميل PayPal...' : 'Loading PayPal...'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[60px]">
      {status === 'processing' && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}
      <div ref={paypalRef} className={disabled ? 'pointer-events-none opacity-50' : ''} />
    </div>
  );
}
