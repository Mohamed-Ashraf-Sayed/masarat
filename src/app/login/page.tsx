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
        if (userData.role === 'ADMIN') {
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

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    {t('orContinueWith')}
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-gray-700 font-medium">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-gray-700 font-medium">Facebook</span>
                </button>
              </div>

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

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl text-white text-sm">
          <p className="font-semibold mb-2">
            {language === 'ar' ? 'بيانات تجريبية:' : 'Demo Credentials:'}
          </p>
          <p>
            {language === 'ar' ? 'طالب: ' : 'Student: '}
            student@test.com / 123456
          </p>
          <p>
            {language === 'ar' ? 'مدرب: ' : 'Instructor: '}
            instructor@test.com / 123456
          </p>
          <p>
            {language === 'ar' ? 'مدير: ' : 'Admin: '}
            admin@test.com / admin123
          </p>
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
