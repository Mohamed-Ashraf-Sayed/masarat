'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ikUrl } from '@/lib/imagekit';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Filter,
  Download,
  User,
  X,
  Check,
  FileImage,
  ExternalLink,
} from 'lucide-react';

interface BookPurchase {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  transactionId: string;
  receiptUrl: string | null;
  downloadCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    phone: string | null;
  };
  book: {
    id: string;
    title: { ar: string; en: string };
    author: { ar: string; en: string };
    price: number;
    cover: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BookOrdersPage() {
  const { language } = useLanguage();
  const { token, isLoading: authLoading } = useAuth();

  const [purchases, setPurchases] = useState<BookPurchase[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPurchase, setSelectedPurchase] = useState<BookPurchase | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    if (!authLoading && token) {
      fetchPurchases();
    }
  }, [authLoading, token, pagination.page, statusFilter]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
      });
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/book-orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        setPurchases(result.data.purchases);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPurchases();
  };

  const handleStatusChange = async (purchaseId: string, newStatus: string, note?: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/book-orders/${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, adminNote: note }),
      });

      const result = await response.json();
      if (result.success) {
        fetchPurchases();
        setShowModal(false);
        setSelectedPurchase(null);
        setAdminNote('');
      }
    } catch (error) {
      console.error('Error updating purchase:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
      COMPLETED: { ar: 'مكتمل', en: 'Completed' },
      FAILED: { ar: 'مرفوض', en: 'Failed' },
      REFUNDED: { ar: 'مسترد', en: 'Refunded' },
    };
    const icons = {
      PENDING: Clock,
      COMPLETED: CheckCircle,
      FAILED: XCircle,
      REFUNDED: RefreshCw,
    };
    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.PENDING}`}>
        <Icon className="w-3 h-3" />
        {labels[status as keyof typeof labels]?.[language] || status}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, { ar: string; en: string }> = {
      CARD: { ar: 'بطاقة ائتمان', en: 'Credit Card' },
      PAYPAL: { ar: 'باي بال', en: 'PayPal' },
      BANK: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
    };
    return methods[method]?.[language] || method;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            href="/admin"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'طلبات الكتب' : 'Book Orders'}
            </h1>
            <p className="text-gray-600 mt-1">
              {language === 'ar'
                ? `${pagination.total} طلب`
                : `${pagination.total} orders`}
            </p>
          </div>
        </div>

        <Link
          href="/admin/books"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <BookOpen className="w-5 h-5" />
          {language === 'ar' ? 'إدارة الكتب' : 'Manage Books'}
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'البحث برقم المعاملة أو اسم المستخدم...' : 'Search by transaction ID or user name...'}
                className="w-full ps-10 pe-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
              <option value="PENDING">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
              <option value="COMPLETED">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
              <option value="FAILED">{language === 'ar' ? 'مرفوض' : 'Failed'}</option>
              <option value="REFUNDED">{language === 'ar' ? 'مسترد' : 'Refunded'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'رقم الطلب' : 'Order ID'}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'المستخدم' : 'User'}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الكتاب' : 'Book'}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'المبلغ' : 'Amount'}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'التحميلات' : 'Downloads'}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </th>
                <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
                    </p>
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.transactionId?.slice(0, 15)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {purchase.user.avatar ? (
                            <Image
                              src={purchase.user.avatar}
                              alt={purchase.user.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{purchase.user.name}</div>
                          <div className="text-xs text-gray-500">{purchase.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {purchase.book ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {purchase.book.cover ? (
                              <Image
                                src={purchase.book.cover}
                                alt=""
                                width={40}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-sm text-gray-900 line-clamp-1">
                              {purchase.book.title[language]}
                            </span>
                            <span className="text-xs text-gray-500 line-clamp-1">
                              {purchase.book.author[language]}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {purchase.currency} {purchase.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {getPaymentMethodLabel(purchase.paymentMethod || '')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Download className="w-4 h-4" />
                        {purchase.downloadCount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {formatDate(purchase.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {purchase.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(purchase.id, 'COMPLETED')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={language === 'ar' ? 'قبول' : 'Approve'}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setShowModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={language === 'ar' ? 'رفض' : 'Reject'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {purchase.status === 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setShowModal(true);
                            }}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title={language === 'ar' ? 'استرداد' : 'Refund'}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title={language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {language === 'ar'
                ? `عرض ${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(pagination.page * pagination.limit, pagination.total)} من ${pagination.total}`
                : `Showing ${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {language === 'ar' ? 'السابق' : 'Previous'}
              </button>
              <span className="px-3 py-1.5 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPurchase(null);
                  setAdminNote('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{language === 'ar' ? 'رقم المعاملة' : 'Transaction ID'}</span>
                  <span className="font-mono text-sm">{selectedPurchase.transactionId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                  {getStatusBadge(selectedPurchase.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{language === 'ar' ? 'المبلغ' : 'Amount'}</span>
                  <span className="font-semibold">{selectedPurchase.currency} {selectedPurchase.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</span>
                  <span>{getPaymentMethodLabel(selectedPurchase.paymentMethod || '')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{language === 'ar' ? 'عدد التحميلات' : 'Downloads'}</span>
                  <span>{selectedPurchase.downloadCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{language === 'ar' ? 'التاريخ' : 'Date'}</span>
                  <span>{formatDate(selectedPurchase.createdAt)}</span>
                </div>
              </div>

              {/* User Info */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  {language === 'ar' ? 'معلومات المستخدم' : 'User Information'}
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedPurchase.user.avatar ? (
                      <Image
                        src={selectedPurchase.user.avatar}
                        alt={selectedPurchase.user.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedPurchase.user.name}</div>
                    <div className="text-sm text-gray-500">{selectedPurchase.user.email}</div>
                    {selectedPurchase.user.phone && (
                      <div className="text-sm text-gray-500">{selectedPurchase.user.phone}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Book Info */}
              {selectedPurchase.book && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {language === 'ar' ? 'معلومات الكتاب' : 'Book Information'}
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-20 bg-gray-200 rounded overflow-hidden">
                      {selectedPurchase.book.cover ? (
                        <Image
                          src={selectedPurchase.book.cover}
                          alt=""
                          width={56}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedPurchase.book.title[language]}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedPurchase.book.author[language]}
                      </div>
                      <div className="text-sm text-primary-600 font-medium mt-1">
                        {selectedPurchase.currency} {selectedPurchase.book.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Image */}
              {selectedPurchase.receiptUrl && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-green-600" />
                    {language === 'ar' ? 'إيصال التحويل' : 'Transfer Receipt'}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-2">
                    {selectedPurchase.receiptUrl.endsWith('.pdf') ? (
                      <a
                        href={selectedPurchase.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileImage className="w-8 h-8 text-red-500" />
                        <span className="text-gray-700">
                          {language === 'ar' ? 'عرض ملف PDF' : 'View PDF File'}
                        </span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    ) : (
                      <a
                        href={selectedPurchase.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={ikUrl(selectedPurchase.receiptUrl, { width: 1200 })}
                          alt="Transfer Receipt"
                          className="w-full max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        />
                        <p className="text-center text-xs text-gray-500 mt-2">
                          {language === 'ar' ? 'اضغط للتكبير' : 'Click to enlarge'}
                        </p>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Note */}
              {selectedPurchase.status === 'PENDING' && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block font-medium text-gray-900 mb-2">
                    {language === 'ar' ? 'ملاحظة (للرفض)' : 'Note (for rejection)'}
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={language === 'ar' ? 'سبب الرفض...' : 'Reason for rejection...'}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedPurchase.status === 'PENDING' && (
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => handleStatusChange(selectedPurchase.id, 'COMPLETED')}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  {language === 'ar' ? 'قبول الطلب' : 'Approve Order'}
                </button>
                <button
                  onClick={() => handleStatusChange(selectedPurchase.id, 'FAILED', adminNote)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                  {language === 'ar' ? 'رفض الطلب' : 'Reject Order'}
                </button>
              </div>
            )}

            {selectedPurchase.status === 'COMPLETED' && (
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => handleStatusChange(selectedPurchase.id, 'REFUNDED', adminNote)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  {language === 'ar' ? 'استرداد المبلغ' : 'Refund Payment'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
