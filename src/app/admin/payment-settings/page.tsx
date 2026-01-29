'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  CreditCard,
  ArrowLeft,
  Loader2,
  Save,
  Building,
  DollarSign,
  Bell,
  Settings,
  Check,
  AlertCircle,
} from 'lucide-react';

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
  notifyAdminOnNewOrder: boolean;
  notifyUserOnStatusChange: boolean;
}

const DEFAULT_SETTINGS: PaymentSettings = {
  currency: 'USD',
  paymentMethods: {
    card: { enabled: true, label: { ar: 'بطاقة ائتمان', en: 'Credit Card' } },
    paypal: { enabled: true, label: { ar: 'باي بال', en: 'PayPal' } },
    bank: { enabled: true, label: { ar: 'تحويل بنكي', en: 'Bank Transfer' } },
  },
  bankDetails: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    iban: '',
    swiftCode: '',
    notes: { ar: '', en: '' },
  },
  taxRate: 0,
  requireManualApproval: true,
  notifyAdminOnNewOrder: true,
  notifyUserOnStatusChange: true,
};

export default function PaymentSettingsPage() {
  const { language } = useLanguage();
  const { token, isLoading: authLoading } = useAuth();

  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && token) {
      fetchSettings();
    }
  }, [authLoading, token]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payment-settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.data });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const response = await fetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentMethod = (method: 'card' | 'paypal' | 'bank', enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: { ...prev.paymentMethods[method], enabled },
      },
    }));
  };

  const updateBankDetails = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const updateBankNotes = (lang: 'ar' | 'en', value: string) => {
    setSettings((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        notes: {
          ...prev.bankDetails.notes,
          [lang]: value,
        },
      },
    }));
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إعدادات الدفع' : 'Payment Settings'}
            </h1>
            <p className="text-gray-600 mt-1">
              {language === 'ar'
                ? 'إدارة طرق الدفع وإعدادات المعاملات'
                : 'Manage payment methods and transaction settings'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <Check className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving
            ? language === 'ar'
              ? 'جاري الحفظ...'
              : 'Saving...'
            : saved
            ? language === 'ar'
              ? 'تم الحفظ'
              : 'Saved'
            : language === 'ar'
            ? 'حفظ التغييرات'
            : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Settings className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'العملة الافتراضية' : 'Default Currency'}
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="EGP">EGP - Egyptian Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) => setSettings((prev) => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Credit Card */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {settings.paymentMethods.card.label[language]}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'فيزا، ماستركارد، أمريكان إكسبريس' : 'Visa, Mastercard, American Express'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.card.enabled}
                  onChange={(e) => updatePaymentMethod('card', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* PayPal */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {settings.paymentMethods.paypal.label[language]}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'الدفع عبر حساب باي بال' : 'Pay with PayPal account'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.paypal.enabled}
                  onChange={(e) => updatePaymentMethod('paypal', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Bank Transfer */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Building className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {settings.paymentMethods.bank.label[language]}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? 'التحويل المصرفي المباشر' : 'Direct bank transfer'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paymentMethods.bank.enabled}
                  onChange={(e) => updatePaymentMethod('bank', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {settings.paymentMethods.bank.enabled && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {language === 'ar' ? 'معلومات الحساب البنكي' : 'Bank Account Details'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'اسم البنك' : 'Bank Name'}
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.bankName}
                  onChange={(e) => updateBankDetails('bankName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'اسم صاحب الحساب' : 'Account Holder Name'}
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.accountName}
                  onChange={(e) => updateBankDetails('accountName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'رقم الحساب' : 'Account Number'}
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.accountNumber}
                  onChange={(e) => updateBankDetails('accountNumber', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'رقم IBAN' : 'IBAN'}
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.iban}
                  onChange={(e) => updateBankDetails('iban', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'رمز SWIFT' : 'SWIFT Code'}
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.swiftCode}
                  onChange={(e) => updateBankDetails('swiftCode', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'ملاحظات (بالعربية)' : 'Notes (Arabic)'}
                </label>
                <textarea
                  value={settings.bankDetails.notes.ar}
                  onChange={(e) => updateBankNotes('ar', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="ملاحظات إضافية تظهر للمستخدم..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'ملاحظات (بالإنجليزية)' : 'Notes (English)'}
                </label>
                <textarea
                  value={settings.bankDetails.notes.en}
                  onChange={(e) => updateBankNotes('en', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Additional notes shown to user..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {language === 'ar' ? 'الإشعارات والموافقات' : 'Notifications & Approvals'}
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <h3 className="font-medium text-gray-900">
                  {language === 'ar' ? 'طلب موافقة يدوية' : 'Require Manual Approval'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'ar'
                    ? 'يجب على المدير الموافقة على الطلبات قبل تفعيل التسجيل'
                    : 'Admin must approve orders before enrollment is activated'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.requireManualApproval}
                onChange={(e) => setSettings((prev) => ({ ...prev, requireManualApproval: e.target.checked }))}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <h3 className="font-medium text-gray-900">
                  {language === 'ar' ? 'إشعار المدير بالطلبات الجديدة' : 'Notify Admin on New Orders'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'ar'
                    ? 'إرسال إشعار للمدير عند وصول طلب جديد'
                    : 'Send notification to admin when new order arrives'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyAdminOnNewOrder}
                onChange={(e) => setSettings((prev) => ({ ...prev, notifyAdminOnNewOrder: e.target.checked }))}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <div>
                <h3 className="font-medium text-gray-900">
                  {language === 'ar' ? 'إشعار المستخدم بتغيير الحالة' : 'Notify User on Status Change'}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'ar'
                    ? 'إرسال إشعار للمستخدم عند تغيير حالة طلبه'
                    : 'Send notification to user when order status changes'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyUserOnStatusChange}
                onChange={(e) => setSettings((prev) => ({ ...prev, notifyUserOnStatusChange: e.target.checked }))}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
            </label>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
