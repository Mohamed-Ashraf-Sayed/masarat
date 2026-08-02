'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  Settings,
  Globe,
  Bell,
  Shield,
  CreditCard,
  Mail,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface SiteSettings {
  general_settings: {
    siteName: { ar: string; en: string };
    contactEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
  };
  localization_settings: {
    defaultLanguage: string;
    currency: string;
    taxRate: number;
  };
  notification_settings: {
    enableNotifications: boolean;
    emailNotifications: boolean;
  };
  security_settings: {
    enableRegistration: boolean;
    requireEmailVerification: boolean;
  };
  payment_settings: {
    currency: string;
    requireManualApproval: boolean;
    bankAccountDetails: string;
  };
  email_settings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpFrom: string;
  };
}

const DEFAULT_SETTINGS: SiteSettings = {
  general_settings: {
    siteName: { ar: 'مسارات', en: 'Masarat' },
    contactEmail: 'support@masarat.com',
    supportPhone: '',
    maintenanceMode: false,
  },
  localization_settings: { defaultLanguage: 'ar', currency: 'USD', taxRate: 0 },
  notification_settings: { enableNotifications: true, emailNotifications: true },
  security_settings: { enableRegistration: true, requireEmailVerification: false },
  payment_settings: { currency: 'USD', requireManualApproval: true, bankAccountDetails: '' },
  email_settings: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', smtpFrom: '' },
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(ev) => onChange(ev.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4485b5]"></div>
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

const inputClass =
  'w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4485b5]';

export default function AdminSettingsPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const fetchSettings = useCallback(
    async (authToken: string) => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/settings', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setSettings((prev) => ({ ...prev, ...data.data }));
        } else {
          setError(data.error || 'Failed to load settings');
        }
      } catch {
        setError('Network error while loading settings');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }
    if (token) {
      fetchSettings(token);
    }
  }, [user, token, authLoading, fetchSettings, router]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch {
      setError('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  function updateGroup<K extends keyof SiteSettings>(group: K, patch: Partial<SiteSettings[K]>) {
    setSettings((prev) => ({
      ...prev,
      [group]: { ...prev[group], ...patch },
    }));
  }

  const tabs = [
    { id: 'general',       icon: Settings,    label: { ar: 'عام',              en: 'General' } },
    { id: 'localization',  icon: Globe,       label: { ar: 'اللغة والعملة',   en: 'Localization' } },
    { id: 'notifications', icon: Bell,        label: { ar: 'الإشعارات',        en: 'Notifications' } },
    { id: 'security',      icon: Shield,      label: { ar: 'الأمان',           en: 'Security' } },
    { id: 'payment',       icon: CreditCard,  label: { ar: 'الدفع',            en: 'Payment' } },
    { id: 'email',         icon: Mail,        label: { ar: 'البريد',           en: 'Email' } },
  ];

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-[#4485b5] animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const gen  = settings.general_settings;
  const loc  = settings.localization_settings;
  const notif = settings.notification_settings;
  const sec  = settings.security_settings;
  const pay  = settings.payment_settings;
  const smtp = settings.email_settings;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إعدادات المنصة' : 'Platform Settings'}
            </h1>
            <p className="text-gray-500 text-sm">
              {language === 'ar' ? 'إدارة إعدادات الموقع' : 'Manage site settings'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#4485b5] text-white font-semibold rounded-xl hover:bg-[#3a7299] transition-colors disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saved
            ? (language === 'ar' ? 'تم الحفظ ✓' : 'Saved ✓')
            : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-[#4485b5]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{tab.label[language]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">

            {/* ── General ── */}
            {activeTab === 'general' && (
              <>
                <h3 className="text-lg font-bold text-gray-900">
                  {language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'اسم الموقع (عربي)' : 'Site Name (Arabic)'}
                    </label>
                    <input
                      type="text"
                      value={gen.siteName.ar}
                      onChange={(ev) =>
                        updateGroup('general_settings', { siteName: { ...gen.siteName, ar: ev.target.value } })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'اسم الموقع (إنجليزي)' : 'Site Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={gen.siteName.en}
                      onChange={(ev) =>
                        updateGroup('general_settings', { siteName: { ...gen.siteName, en: ev.target.value } })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني للتواصل' : 'Contact Email'}
                  </label>
                  <input
                    type="email"
                    value={gen.contactEmail}
                    onChange={(ev) => updateGroup('general_settings', { contactEmail: ev.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'رقم الدعم الفني' : 'Support Phone'}
                  </label>
                  <input
                    type="text"
                    value={gen.supportPhone}
                    onChange={(ev) => updateGroup('general_settings', { supportPhone: ev.target.value })}
                    className={inputClass}
                    placeholder="+966 50 000 0000"
                  />
                </div>

                <ToggleRow
                  label={language === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}
                  description={language === 'ar' ? 'تعطيل الوصول للموقع مؤقتاً' : 'Temporarily disable site access'}
                  checked={gen.maintenanceMode}
                  onChange={(v) => updateGroup('general_settings', { maintenanceMode: v })}
                />
              </>
            )}

            {/* ── Localization ── */}
            {activeTab === 'localization' && (
              <>
                <h3 className="text-lg font-bold text-gray-900">
                  {language === 'ar' ? 'اللغة والعملة' : 'Language & Currency'}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'اللغة الافتراضية' : 'Default Language'}
                  </label>
                  <select
                    value={loc.defaultLanguage}
                    onChange={(ev) => updateGroup('localization_settings', { defaultLanguage: ev.target.value })}
                    className={inputClass}
                  >
                    <option value="ar">{language === 'ar' ? 'العربية' : 'Arabic'}</option>
                    <option value="en">{language === 'ar' ? 'الإنجليزية' : 'English'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'العملة' : 'Currency'}
                  </label>
                  <select
                    value={loc.currency}
                    onChange={(ev) => updateGroup('localization_settings', { currency: ev.target.value })}
                    className={inputClass}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="EGP">EGP (ج.م)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="KWD">KWD (د.ك)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}
                  </label>
                  <input
                    type="number"
                    value={loc.taxRate}
                    onChange={(ev) =>
                      updateGroup('localization_settings', { taxRate: parseFloat(ev.target.value) || 0 })
                    }
                    className={inputClass}
                    min="0"
                    max="100"
                    step="0.5"
                  />
                </div>
              </>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifications' && (
              <>
                <h3 className="text-lg font-bold text-gray-900">
                  {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
                </h3>
                <div className="space-y-4">
                  <ToggleRow
                    label={language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
                    description={language === 'ar' ? 'إرسال إشعارات داخلية للمستخدمين' : 'Send in-app notifications to users'}
                    checked={notif.enableNotifications}
                    onChange={(v) => updateGroup('notification_settings', { enableNotifications: v })}
                  />
                  <ToggleRow
                    label={language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                    description={language === 'ar' ? 'إرسال إشعارات عبر البريد الإلكتروني' : 'Send notifications via email'}
                    checked={notif.emailNotifications}
                    onChange={(v) => updateGroup('notification_settings', { emailNotifications: v })}
                  />
                </div>
              </>
            )}

            {/* ── Security ── */}
            {activeTab === 'security' && (
              <>
                <h3 className="text-lg font-bold text-gray-900">
                  {language === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}
                </h3>
                <div className="space-y-4">
                  <ToggleRow
                    label={language === 'ar' ? 'السماح بالتسجيل' : 'Allow Registration'}
                    description={language === 'ar' ? 'السماح للمستخدمين الجدد بإنشاء حسابات' : 'Allow new users to create accounts'}
                    checked={sec.enableRegistration}
                    onChange={(v) => updateGroup('security_settings', { enableRegistration: v })}
                  />
                  <ToggleRow
                    label={language === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Require Email Verification'}
                    description={language === 'ar' ? 'طلب تأكيد البريد عند التسجيل' : 'Require email verification on signup'}
                    checked={sec.requireEmailVerification}
                    onChange={(v) => updateGroup('security_settings', { requireEmailVerification: v })}
                  />
                </div>
              </>
            )}

            {/* ── Payment ── */}
            {activeTab === 'payment' && (
              <>
                <h3 className="text-lg font-bold text-gray-900">
                  {language === 'ar' ? 'إعدادات الدفع' : 'Payment Settings'}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'عملة الدفع' : 'Payment Currency'}
                  </label>
                  <select
                    value={pay.currency}
                    onChange={(ev) => updateGroup('payment_settings', { currency: ev.target.value })}
                    className={inputClass}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="EGP">EGP (ج.م)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="KWD">KWD (د.ك)</option>
                  </select>
                </div>

                <ToggleRow
                  label={language === 'ar' ? 'الموافقة اليدوية على المدفوعات' : 'Manual Payment Approval'}
                  description={language === 'ar' ? 'يجب على الأدمن الموافقة على كل دفعة يدوياً' : 'Admin must manually approve each payment'}
                  checked={pay.requireManualApproval}
                  onChange={(v) => updateGroup('payment_settings', { requireManualApproval: v })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'بيانات الحساب البنكي' : 'Bank Account Details'}
                  </label>
                  <textarea
                    value={pay.bankAccountDetails}
                    onChange={(ev) => updateGroup('payment_settings', { bankAccountDetails: ev.target.value })}
                    rows={4}
                    className={inputClass}
                    placeholder={language === 'ar' ? 'اسم البنك، رقم الحساب، الآيبان...' : 'Bank name, account number, IBAN...'}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'ar'
                      ? 'تظهر للمستخدمين عند اختيار التحويل البنكي'
                      : 'Shown to users when selecting bank transfer'}
                  </p>
                </div>
              </>
            )}

            {/* ── Email ── */}
            {activeTab === 'email' && (
              <>
                <h3 className="text-lg font-bold text-gray-900">
                  {language === 'ar' ? 'إعدادات البريد الإلكتروني (SMTP)' : 'Email Settings (SMTP)'}
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={smtp.smtpHost}
                      onChange={(ev) => updateGroup('email_settings', { smtpHost: ev.target.value })}
                      className={inputClass}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      value={smtp.smtpPort}
                      onChange={(ev) =>
                        updateGroup('email_settings', { smtpPort: parseInt(ev.target.value) || 587 })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني (SMTP User)' : 'SMTP Username / Email'}
                  </label>
                  <input
                    type="email"
                    value={smtp.smtpUser}
                    onChange={(ev) => updateGroup('email_settings', { smtpUser: ev.target.value })}
                    className={inputClass}
                    placeholder="noreply@masarat.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'كلمة المرور / App Password' : 'Password / App Password'}
                  </label>
                  <input
                    type="password"
                    value={smtp.smtpPassword}
                    onChange={(ev) => updateGroup('email_settings', { smtpPassword: ev.target.value })}
                    className={inputClass}
                    placeholder="••••••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'عنوان المُرسِل (From)' : 'From Address'}
                  </label>
                  <input
                    type="text"
                    value={smtp.smtpFrom}
                    onChange={(ev) => updateGroup('email_settings', { smtpFrom: ev.target.value })}
                    className={inputClass}
                    placeholder='مسارات <noreply@masarat.com>'
                  />
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
