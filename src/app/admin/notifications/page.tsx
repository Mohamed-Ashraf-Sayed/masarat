'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  Search,
  Filter,
  User,
  RefreshCw,
} from 'lucide-react';

interface Notification {
  id: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminNotificationsPage() {
  const { token } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifications = async (page = 1) => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterUnread ? { unreadOnly: 'true' } : {}),
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data.notifications);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token, filterUnread]);

  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!token) return;

    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
      case 'enrollment':
      case 'course_completion':
        return 'bg-green-100 text-green-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'quiz_result':
        return 'bg-purple-100 text-purple-600';
      case 'certificate':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      enrollment: { ar: 'تسجيل', en: 'Enrollment' },
      course_completion: { ar: 'إتمام كورس', en: 'Course Completion' },
      quiz_result: { ar: 'نتيجة اختبار', en: 'Quiz Result' },
      certificate: { ar: 'شهادة', en: 'Certificate' },
      success: { ar: 'نجاح', en: 'Success' },
      warning: { ar: 'تحذير', en: 'Warning' },
      error: { ar: 'خطأ', en: 'Error' },
      info: { ar: 'معلومات', en: 'Info' },
    };
    return labels[type]?.[language] || type;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      n.titleAr.toLowerCase().includes(search) ||
      n.titleEn.toLowerCase().includes(search) ||
      n.messageAr.toLowerCase().includes(search) ||
      n.messageEn.toLowerCase().includes(search) ||
      n.user?.name.toLowerCase().includes(search) ||
      n.user?.email.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الإشعارات' : 'Notifications Management'}
            </h1>
            <p className="text-gray-500 mt-1">
              {language === 'ar'
                ? `إجمالي ${pagination.total} إشعار`
                : `Total ${pagination.total} notifications`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(pagination.page)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title={language === 'ar' ? 'تحديث' : 'Refresh'}
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <CheckCheck className="w-5 h-5" />
              {language === 'ar' ? 'قراءة الكل' : 'Mark All Read'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث في الإشعارات...' : 'Search notifications...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ps-10 pe-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setFilterUnread(!filterUnread)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                filterUnread
                  ? 'bg-primary-50 border-primary-200 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              {language === 'ar' ? 'غير المقروءة فقط' : 'Unread Only'}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">
                {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-primary-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                        notification.isRead ? 'bg-gray-300' : 'bg-primary-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className={`font-medium ${
                                notification.isRead ? 'text-gray-600' : 'text-gray-900'
                              }`}
                            >
                              {language === 'ar' ? notification.titleAr : notification.titleEn}
                            </h3>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(
                                notification.type
                              )}`}
                            >
                              {getTypeLabel(notification.type)}
                            </span>
                          </div>
                          {notification.user && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-primary-600">
                              <User className="w-4 h-4" />
                              <span>{notification.user.name}</span>
                              <span className="text-gray-400">({notification.user.email})</span>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {language === 'ar' ? notification.messageAr : notification.messageEn}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title={language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
                            >
                              <Check className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title={language === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
              <button
                onClick={() => fetchNotifications(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                {language === 'ar' ? 'السابق' : 'Previous'}
              </button>
              <span className="text-sm text-gray-600">
                {language === 'ar'
                  ? `صفحة ${pagination.page} من ${pagination.totalPages}`
                  : `Page ${pagination.page} of ${pagination.totalPages}`}
              </span>
              <button
                onClick={() => fetchNotifications(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
