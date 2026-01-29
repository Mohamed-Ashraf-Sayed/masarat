'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  Smartphone,
  Key,
  Check,
  X,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Monitor,
  MapPin,
  Clock,
  Trash2,
} from 'lucide-react';

interface TwoFactorData {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

interface Session {
  id: string;
  device: {
    browser: string;
    os: string;
    device: string;
    deviceType: string;
  };
  ipAddress: string;
  userAgent: string;
  lastActive: string;
  createdAt: string;
  expires: string;
  isCurrent: boolean;
}

export default function SecurityPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    fetchStatus();
    fetchSessions();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auth/2fa/setup');
      const data = await res.json();
      if (data.success) {
        setIs2FAEnabled(data.data.isEnabled);
        setBackupCodesRemaining(data.data.backupCodesRemaining);
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSessions(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const startSetup = async () => {
    setSetupLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSetupData(data.data);
        setShowSetup(true);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setSetupLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError(language === 'ar' ? 'الرجاء إدخال رمز مكون من 6 أرقام' : 'Please enter a 6-digit code');
      return;
    }

    setVerifyLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();
      if (data.success) {
        setIs2FAEnabled(true);
        setShowSetup(false);
        setShowBackupCodes(true);
        setSuccess(language === 'ar' ? 'تم تفعيل التحقق بخطوتين بنجاح!' : '2FA enabled successfully!');
        setBackupCodesRemaining(10);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setVerifyLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!disablePassword || !disableCode) {
      setError(language === 'ar' ? 'الرجاء إدخال كلمة المرور ورمز التحقق' : 'Please enter password and verification code');
      return;
    }

    setDisableLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      });
      const data = await res.json();
      if (data.success) {
        setIs2FAEnabled(false);
        setShowDisableModal(false);
        setDisablePassword('');
        setDisableCode('');
        setSuccess(language === 'ar' ? 'تم إلغاء التحقق بخطوتين' : '2FA disabled successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setDisableLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(language === 'ar' ? 'تم النسخ!' : 'Copied!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        setSuccess(language === 'ar' ? 'تم إنهاء الجلسة' : 'Session terminated');
      }
    } catch (err) {
      setError(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'الأمان والخصوصية' : 'Security & Privacy'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ar' ? 'إدارة إعدادات الأمان لحسابك' : 'Manage your account security settings'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center gap-2">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* 2FA Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {language === 'ar' ? 'التحقق بخطوتين (2FA)' : 'Two-Factor Authentication (2FA)'}
                </h2>
                <p className="text-sm text-gray-500">
                  {language === 'ar'
                    ? 'أضف طبقة حماية إضافية لحسابك'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {is2FAEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                  <Check className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      {language === 'ar' ? 'التحقق بخطوتين مفعل' : '2FA is enabled'}
                    </p>
                    <p className="text-sm text-green-600">
                      {language === 'ar'
                        ? `${backupCodesRemaining} رموز احتياطية متبقية`
                        : `${backupCodesRemaining} backup codes remaining`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDisableModal(true)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  {language === 'ar' ? 'إلغاء التحقق بخطوتين' : 'Disable 2FA'}
                </button>
              </div>
            ) : showSetup ? (
              <div className="space-y-6">
                {/* QR Code */}
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {language === 'ar'
                      ? 'امسح رمز QR باستخدام تطبيق المصادقة'
                      : 'Scan the QR code with your authenticator app'}
                  </p>
                  {setupData?.qrCode && (
                    <img
                      src={setupData.qrCode}
                      alt="QR Code"
                      className="mx-auto w-48 h-48 border rounded-xl"
                    />
                  )}
                </div>

                {/* Manual Entry */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {language === 'ar' ? 'أو أدخل الرمز يدوياً:' : 'Or enter the code manually:'}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg font-mono text-sm">
                      {showSecret ? setupData?.secret : '••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                      {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setupData?.secret && copyToClipboard(setupData.secret)}
                      className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Verification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'أدخل رمز التحقق' : 'Enter verification code'}
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSetup(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    onClick={verifyAndEnable}
                    disabled={verifyLoading || verificationCode.length !== 6}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {verifyLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {language === 'ar' ? 'تفعيل' : 'Enable'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <p className="text-yellow-800">
                    {language === 'ar'
                      ? 'التحقق بخطوتين غير مفعل. حسابك أقل أماناً.'
                      : '2FA is not enabled. Your account is less secure.'}
                  </p>
                </div>

                <button
                  onClick={startSetup}
                  disabled={setupLoading}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  {setupLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Smartphone className="w-5 h-5" />
                  )}
                  {language === 'ar' ? 'إعداد التحقق بخطوتين' : 'Setup 2FA'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Backup Codes Modal */}
        {showBackupCodes && setupData?.backupCodes && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <Key className="w-6 h-6 text-primary-600" />
                <h3 className="text-lg font-semibold">
                  {language === 'ar' ? 'رموز الاحتياطية' : 'Backup Codes'}
                </h3>
              </div>

              <p className="text-gray-600 mb-4 text-sm">
                {language === 'ar'
                  ? 'احفظ هذه الرموز في مكان آمن. يمكنك استخدامها للوصول إلى حسابك إذا فقدت جهازك.'
                  : 'Save these codes in a safe place. You can use them to access your account if you lose your device.'}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {setupData.backupCodes.map((code, i) => (
                  <code key={i} className="bg-gray-100 px-3 py-2 rounded-lg text-center font-mono text-sm">
                    {code}
                  </code>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {language === 'ar' ? 'نسخ الكل' : 'Copy All'}
                </button>
                <button
                  onClick={() => setShowBackupCodes(false)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                >
                  {language === 'ar' ? 'تم' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disable 2FA Modal */}
        {showDisableModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">
                {language === 'ar' ? 'إلغاء التحقق بخطوتين' : 'Disable 2FA'}
              </h3>

              <p className="text-gray-600 mb-4 text-sm">
                {language === 'ar'
                  ? 'هذا سيجعل حسابك أقل أماناً. للتأكيد، أدخل كلمة المرور ورمز التحقق.'
                  : 'This will make your account less secure. To confirm, enter your password and verification code.'}
              </p>

              <div className="space-y-4">
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={language === 'ar' ? 'رمز التحقق' : 'Verification code'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDisableModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={disable2FA}
                  disabled={disableLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  {disableLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {language === 'ar' ? 'إلغاء التفعيل' : 'Disable'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Monitor className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {language === 'ar' ? 'الجلسات النشطة' : 'Active Sessions'}
                </h2>
                <p className="text-sm text-gray-500">
                  {language === 'ar'
                    ? 'الأجهزة التي سجلت الدخول منها'
                    : 'Devices where you\'re logged in'}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {sessions.length > 0 ? sessions.map((session) => (
              <div key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    session.device?.deviceType === 'Mobile'
                      ? 'bg-purple-100'
                      : session.device?.deviceType === 'Tablet'
                      ? 'bg-orange-100'
                      : 'bg-blue-100'
                  }`}>
                    {session.device?.deviceType === 'Mobile' ? (
                      <Smartphone className={`w-5 h-5 ${session.device?.deviceType === 'Mobile' ? 'text-purple-600' : 'text-blue-600'}`} />
                    ) : (
                      <Monitor className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.device?.device || session.userAgent?.slice(0, 30) || 'Unknown Device'}
                      {session.isCurrent && (
                        <span className="ms-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          {language === 'ar' ? 'الجلسة الحالية' : 'Current'}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.ipAddress || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.lastActive ? new Date(session.lastActive).toLocaleString(
                          language === 'ar' ? 'ar-EG' : 'en-US',
                          { dateStyle: 'short', timeStyle: 'short' }
                        ) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => terminateSession(session.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={language === 'ar' ? 'إنهاء الجلسة' : 'End session'}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500">
                <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{language === 'ar' ? 'لا توجد جلسات أخرى' : 'No other sessions'}</p>
                <p className="text-sm mt-1">
                  {language === 'ar'
                    ? 'سجّل الدخول لتظهر جلستك هنا'
                    : 'Log in again to see your session here'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
