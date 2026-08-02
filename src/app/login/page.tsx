'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle, Shield, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const { language, t } = useLanguage();
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(
        language === 'ar'
          ? 'يرجى ملء جميع الحقول'
          : 'Please fill in all fields'
      );
      return;
    }

    if (requires2FA && !twoFactorCode) {
      setError(
        language === 'ar'
          ? 'يرجى إدخال رمز التحقق'
          : 'Please enter the verification code'
      );
      return;
    }

    const result = await login(email, password, requires2FA ? twoFactorCode : undefined);

    if (result.requires2FA) {
      setRequires2FA(true);
      setError('');
      return;
    }

    if (result.success) {
      // إذا كان هناك رابط إعادة توجيه، انتقل إليه
      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }

      // التحقق من localStorage لمعرفة نوع المستخدم
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else if (userData.role === 'INSTRUCTOR') {
          router.push('/instructor');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(
        result.error ||
        (language === 'ar'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'Invalid email or password')
      );
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTwoFactorCode('');
    setError('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary-600" />
            </div>
            <span className="text-2xl font-bold text-white">
              {language === 'ar' ? 'مسارات' : 'Masarat'}
            </span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* 2FA Step */}
          {requires2FA ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {language === 'ar' ? 'التحقق بخطوتين' : 'Two-Factor Authentication'}
                </h1>
                <p className="text-gray-500">
                  {language === 'ar'
                    ? 'أدخل الرمز من تطبيق المصادقة'
                    : 'Enter the code from your authenticator app'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'رمز التحقق' : 'Verification Code'}
                  </label>
                  <div className="relative">
                    <Shield className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="input-field ps-12 text-center text-2xl tracking-widest font-mono"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    {language === 'ar'
                      ? 'يمكنك أيضاً استخدام رمز احتياطي'
                      : 'You can also use a backup code'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || twoFactorCode.length < 6}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? language === 'ar'
                      ? 'جاري التحقق...'
                      : 'Verifying...'
                    : language === 'ar'
                    ? 'تحقق'
                    : 'Verify'}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to login'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {language === 'ar' ? 'مرحباً بعودتك!' : 'Welcome Back!'}
                </h1>
                <p className="text-gray-500">
                  {language === 'ar'
                    ? 'سجل دخولك للوصول إلى دوراتك'
                    : 'Login to access your courses'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                      className="input-field ps-12"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                      className="input-field ps-12 pe-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">{t('rememberMe')}</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary-600 hover:underline"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? language === 'ar'
                      ? 'جاري تسجيل الدخول...'
                      : 'Logging in...'
                    : t('login')}
                </button>
              </form>

              {/* Register Link */}
              <p className="text-center mt-8 text-gray-600">
                {t('noAccount')}{' '}
                <Link href="/register" className="text-primary-600 font-semibold hover:underline">
                  {t('register')}
                </Link>
              </p>
            </>
          )}
        </div>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
