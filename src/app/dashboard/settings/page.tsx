'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Mail,
  Lock,
  Bell,
  Globe,
  CreditCard,
  Shield,
  Camera,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
} from 'lucide-react';

export default function SettingsPage() {
  const { language, t, setLanguage } = useLanguage();
  const { user, token, updateProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    courseUpdates: true,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setFormData(prev => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
    }));
  }, [user, router]);

  const tabs = [
    { id: 'profile', label: { ar: 'الملف الشخصي', en: 'Profile' }, icon: User },
    { id: 'security', label: { ar: 'الأمان', en: 'Security' }, icon: Shield },
    { id: 'notifications', label: { ar: 'الإشعارات', en: 'Notifications' }, icon: Bell },
    { id: 'billing', label: { ar: 'الفوترة', en: 'Billing' }, icon: CreditCard },
  ];

  const handleSaveProfile = async () => {
    if (!token) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateProfile({ name: formData.name, email: formData.email });
        setMessage({
          type: 'success',
          text: language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully',
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'),
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        setMessage({
          type: 'error',
          text: uploadResult.error || (language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image'),
        });
        setAvatarPreview(null);
        return;
      }

      // Update profile with new avatar URL
      const profileResponse = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatar: uploadResult.data.url,
        }),
      });

      const profileResult = await profileResponse.json();

      if (profileResult.success) {
        updateProfile({ avatar: uploadResult.data.url });
        setMessage({
          type: 'success',
          text: language === 'ar' ? 'تم تحديث الصورة الشخصية بنجاح' : 'Profile picture updated successfully',
        });
      } else {
        setMessage({
          type: 'error',
          text: profileResult.error || (language === 'ar' ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile'),
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'حدث خطأ في رفع الصورة' : 'Error uploading image',
      });
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!token) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        setMessage({
          type: 'success',
          text: language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'),
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'ar' ? 'الإعدادات' : 'Settings'}
        </h1>
        <p className="text-gray-500">
          {language === 'ar'
            ? 'إدارة حسابك وتفضيلاتك'
            : 'Manage your account and preferences'}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage(null);
              }}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label[language]}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <img
                    src={avatarPreview || user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                    alt={user?.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 end-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{user?.name}</h3>
                  <p className="text-gray-500">{user?.email}</p>
                  <p className="text-sm text-primary-600 mt-1">
                    {user?.role === 'ADMIN'
                      ? (language === 'ar' ? 'مدير' : 'Admin')
                      : user?.role === 'INSTRUCTOR'
                      ? (language === 'ar' ? 'مدرب' : 'Instructor')
                      : (language === 'ar' ? 'طالب' : 'Student')}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="text-sm text-primary-600 hover:underline mt-2 flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    {language === 'ar' ? 'تغيير الصورة' : 'Change photo'}
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fullName')}
                  </label>
                  <div className="relative">
                    <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="input-field ps-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-field ps-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'نبذة عنك' : 'Bio'}
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={4}
                    className="input-field resize-none"
                    placeholder={language === 'ar' ? 'اكتب نبذة عنك...' : 'Write something about yourself...'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'اللغة' : 'Language'}
                  </label>
                  <div className="relative">
                    <Globe className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
                      className="input-field ps-12 appearance-none cursor-pointer"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, currentPassword: e.target.value })
                      }
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, newPassword: e.target.value })
                      }
                      className="input-field ps-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className="input-field ps-12"
                    />
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                </button>
              </div>

              <hr className="my-8" />

              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'الجلسات النشطة' : 'Active Sessions'}
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {language === 'ar' ? 'الجهاز الحالي' : 'Current Device'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Chrome on macOS - {language === 'ar' ? 'نشط الآن' : 'Active now'}
                    </p>
                  </div>
                  <span className="badge badge-success">
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-6">
              {[
                {
                  id: 'email',
                  label: { ar: 'إشعارات البريد الإلكتروني', en: 'Email Notifications' },
                  desc: {
                    ar: 'تلقي التحديثات والإشعارات عبر البريد',
                    en: 'Receive updates and notifications via email',
                  },
                },
                {
                  id: 'push',
                  label: { ar: 'الإشعارات الفورية', en: 'Push Notifications' },
                  desc: {
                    ar: 'إشعارات فورية للأنشطة المهمة',
                    en: 'Instant notifications for important activities',
                  },
                },
                {
                  id: 'courseUpdates',
                  label: { ar: 'تحديثات الدورات', en: 'Course Updates' },
                  desc: {
                    ar: 'إشعارات عند إضافة دروس جديدة',
                    en: 'Notifications when new lessons are added',
                  },
                },
                {
                  id: 'marketing',
                  label: { ar: 'رسائل تسويقية', en: 'Marketing Emails' },
                  desc: {
                    ar: 'عروض وتخفيضات حصرية',
                    en: 'Exclusive offers and discounts',
                  },
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {item.label[language]}
                    </h4>
                    <p className="text-sm text-gray-500">{item.desc[language]}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[item.id as keyof typeof notifications]}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          [item.id]: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}

              <button className="btn-primary flex items-center gap-2">
                <Save className="w-5 h-5" />
                {language === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences'}
              </button>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="max-w-2xl">
              <div className="bg-gradient-to-br from-primary-600 to-primary-400 rounded-2xl p-6 text-white mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm opacity-80">
                    {language === 'ar' ? 'نوع الحساب' : 'Account Type'}
                  </span>
                  <span className="badge bg-white/20 text-white">
                    {user?.role === 'ADMIN'
                      ? (language === 'ar' ? 'مدير' : 'Admin')
                      : user?.role === 'INSTRUCTOR'
                      ? (language === 'ar' ? 'مدرب' : 'Instructor')
                      : (language === 'ar' ? 'طالب' : 'Student')}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {language === 'ar' ? 'حساب مجاني' : 'Free Account'}
                </h3>
                <p className="text-sm opacity-80">
                  {language === 'ar'
                    ? 'استمتع بالوصول إلى جميع الدورات المتاحة'
                    : 'Enjoy access to all available courses'}
                </p>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
              </h3>
              <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {language === 'ar' ? 'لم تتم إضافة بطاقة' : 'No card added'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {language === 'ar' ? 'أضف بطاقة للمشتريات' : 'Add a card for purchases'}
                    </p>
                  </div>
                </div>
              </div>

              <button className="text-primary-600 font-medium hover:underline">
                + {language === 'ar' ? 'إضافة طريقة دفع' : 'Add Payment Method'}
              </button>

              <hr className="my-8" />

              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'سجل المشتريات' : 'Purchase History'}
              </h3>
              <div className="text-center py-8 text-gray-500">
                {language === 'ar' ? 'لا توجد مشتريات بعد' : 'No purchases yet'}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
