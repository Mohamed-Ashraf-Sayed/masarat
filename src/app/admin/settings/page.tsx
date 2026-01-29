'use client';

import React, { useState, useEffect } from 'react';
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
  Palette,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState({
    siteName: { ar: 'مسارات', en: 'Masarat' },
    siteDescription: { ar: 'منصة تعليمية متكاملة', en: 'Complete learning platform' },
    contactEmail: 'support@eduplatform.com',
    supportPhone: '+966 50 123 4567',
    enableRegistration: true,
    requireEmailVerification: true,
    enableNotifications: true,
    emailNotifications: true,
    maintenanceMode: false,
    defaultLanguage: 'ar',
    currency: 'USD',
    taxRate: 15,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setTimeout(() => setLoading(false), 500);
  }, [user, router, authLoading]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'general', icon: Settings, label: { ar: 'عام', en: 'General' } },
    { id: 'localization', icon: Globe, label: { ar: 'اللغة والعملة', en: 'Localization' } },
    { id: 'notifications', icon: Bell, label: { ar: 'الإشعارات', en: 'Notifications' } },
    { id: 'security', icon: Shield, label: { ar: 'الأمان', en: 'Security' } },
    { id: 'payment', icon: CreditCard, label: { ar: 'الدفع', en: 'Payment' } },
    { id: 'email', icon: Mail, label: { ar: 'البريد', en: 'Email' } },
  ];

  if (authLoading || loading) {
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
            <p className="text-gray-500">
              {language === 'ar' ? 'إدارة إعدادات الموقع' : 'Manage site settings'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saved
            ? (language === 'ar' ? 'تم الحفظ' : 'Saved')
            : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label[language]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'اسم الموقع (عربي)' : 'Site Name (Arabic)'}
                    </label>
                    <input
                      type="text"
                      value={settings.siteName.ar}
                      onChange={(e) => setSettings({
                        ...settings,
                        siteName: { ...settings.siteName, ar: e.target.value }
                      })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'اسم الموقع (إنجليزي)' : 'Site Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={settings.siteName.en}
                      onChange={(e) => setSettings({
                        ...settings,
                        siteName: { ...settings.siteName, en: e.target.value }
                      })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني للتواصل' : 'Contact Email'}
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'رقم الدعم' : 'Support Phone'}
                  </label>
                  <input
                    type="text"
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">
                      {language === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {language === 'ar'
                        ? 'تعطيل الوصول للموقع مؤقتاً'
                        : 'Temporarily disable site access'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Localization Settings */}
            {activeTab === 'localization' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {language === 'ar' ? 'إعدادات اللغة والعملة' : 'Language & Currency Settings'}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'اللغة الافتراضية' : 'Default Language'}
                  </label>
                  <select
                    value={settings.defaultLanguage}
                    onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                    className="input-field"
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
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="input-field"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="SAR">SAR (ر.س)</option>
                    <option value="EGP">EGP (ج.م)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}
                  </label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        {language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'إرسال إشعارات للمستخدمين' : 'Send notifications to users'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableNotifications}
                        onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        {language === 'ar' ? 'إشعارات البريد' : 'Email Notifications'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'إرسال إشعارات عبر البريد' : 'Send notifications via email'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {language === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        {language === 'ar' ? 'السماح بالتسجيل' : 'Allow Registration'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'السماح للمستخدمين بإنشاء حسابات' : 'Allow users to create accounts'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableRegistration}
                        onChange={(e) => setSettings({ ...settings, enableRegistration: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        {language === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Require Email Verification'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === 'ar' ? 'طلب تأكيد البريد عند التسجيل' : 'Require email verification on signup'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requireEmailVerification}
                        onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {language === 'ar' ? 'إعدادات الدفع' : 'Payment Settings'}
                </h3>
                <p className="text-gray-500">
                  {language === 'ar'
                    ? 'قم بتكوين بوابات الدفع وإعداداتها هنا.'
                    : 'Configure payment gateways and settings here.'}
                </p>
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-700">
                    {language === 'ar'
                      ? 'إعدادات الدفع متقدمة. تواصل مع المطور لتكوينها.'
                      : 'Payment settings are advanced. Contact the developer to configure.'}
                  </p>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {language === 'ar' ? 'إعدادات البريد' : 'Email Settings'}
                </h3>
                <p className="text-gray-500">
                  {language === 'ar'
                    ? 'قم بتكوين خادم البريد الإلكتروني هنا.'
                    : 'Configure email server settings here.'}
                </p>
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-yellow-700">
                    {language === 'ar'
                      ? 'إعدادات البريد متقدمة. تواصل مع المطور لتكوينها.'
                      : 'Email settings are advanced. Contact the developer to configure.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
