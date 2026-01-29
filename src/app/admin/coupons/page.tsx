'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  Save,
  Copy,
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  courseId: string | null;
  course: {
    id: string;
    titleAr: string;
    titleEn: string;
  } | null;
  _count: {
    usages: number;
  };
}

interface Course {
  id: string;
  titleAr: string;
  titleEn: string;
}

export default function CouponsPage() {
  const { language } = useLanguage();
  const { token } = useAuth();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 10,
    maxUses: '',
    minPurchase: '',
    maxDiscount: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    isActive: true,
    courseId: '',
  });

  useEffect(() => {
    if (token) {
      fetchCoupons();
      fetchCourses();
    }
  }, [token]);

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`/api/admin/coupons?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setCoupons(result.data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?limit=100');
      const result = await response.json();
      if (result.success) {
        setCourses(result.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons';

      const response = await fetch(url, {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : null,
          maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
          validUntil: form.validUntil || null,
          courseId: form.courseId || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchCoupons();
        setShowModal(false);
        resetForm();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        fetchCoupons();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
    setDeleteConfirm(null);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses?.toString() || '',
      minPurchase: coupon.minPurchase?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil?.split('T')[0] || '',
      isActive: coupon.isActive,
      courseId: coupon.courseId || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: '',
      minPurchase: '',
      maxDiscount: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      isActive: true,
      courseId: '',
    });
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, code });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'إدارة الكوبونات' : 'Manage Coupons'}
            </h1>
            <p className="text-gray-600">
              {language === 'ar'
                ? 'إنشاء وإدارة أكواد الخصم'
                : 'Create and manage discount codes'}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {language === 'ar' ? 'إضافة كوبون' : 'Add Coupon'}
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCoupons()}
              placeholder={language === 'ar' ? 'بحث بكود الخصم...' : 'Search by coupon code...'}
              className="input-field ps-10"
            />
          </div>
        </div>

        {/* Coupons List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'الكود' : 'Code'}
                </th>
                <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'الخصم' : 'Discount'}
                </th>
                <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'الاستخدام' : 'Usage'}
                </th>
                <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'الصلاحية' : 'Validity'}
                </th>
                <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </th>
                <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{language === 'ar' ? 'لا توجد كوبونات' : 'No coupons found'}</p>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title={language === 'ar' ? 'نسخ' : 'Copy'}
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      {coupon.course && (
                        <p className="text-xs text-gray-500 mt-1">
                          {language === 'ar' ? coupon.course.titleAr : coupon.course.titleEn}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {coupon.discountType === 'PERCENTAGE' ? (
                          <>
                            <Percent className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{coupon.discountValue}%</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-medium">${coupon.discountValue}</span>
                          </>
                        )}
                      </div>
                      {coupon.maxDiscount && (
                        <p className="text-xs text-gray-500">
                          {language === 'ar' ? 'حد أقصى:' : 'Max:'} ${coupon.maxDiscount}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {coupon._count.usages}
                        {coupon.maxUses && ` / ${coupon.maxUses}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {coupon.validUntil ? (
                          <span>
                            {new Date(coupon.validUntil).toLocaleDateString(
                              language === 'ar' ? 'ar-EG' : 'en-US'
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            {language === 'ar' ? 'غير محدد' : 'No limit'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {coupon.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          <CheckCircle className="w-3 h-3" />
                          {language === 'ar' ? 'مفعل' : 'Active'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          <XCircle className="w-3 h-3" />
                          {language === 'ar' ? 'معطل' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(coupon.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCoupon
                    ? language === 'ar'
                      ? 'تعديل الكوبون'
                      : 'Edit Coupon'
                    : language === 'ar'
                    ? 'إضافة كوبون جديد'
                    : 'Add New Coupon'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'كود الخصم' : 'Coupon Code'} *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="input-field flex-1 font-mono"
                      placeholder="SUMMER2024"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="btn-secondary"
                    >
                      {language === 'ar' ? 'توليد' : 'Generate'}
                    </button>
                  </div>
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'نوع الخصم' : 'Discount Type'}
                    </label>
                    <select
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                      className="input-field"
                    >
                      <option value="PERCENTAGE">
                        {language === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}
                      </option>
                      <option value="FIXED">
                        {language === 'ar' ? 'مبلغ ثابت ($)' : 'Fixed Amount ($)'}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'قيمة الخصم' : 'Discount Value'} *
                    </label>
                    <input
                      type="number"
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) })}
                      className="input-field"
                      min="0"
                      max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                      required
                    />
                  </div>
                </div>

                {/* Max Uses & Min Purchase */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الحد الأقصى للاستخدام' : 'Max Uses'}
                    </label>
                    <input
                      type="number"
                      value={form.maxUses}
                      onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                      className="input-field"
                      placeholder={language === 'ar' ? 'غير محدود' : 'Unlimited'}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الحد الأدنى للشراء' : 'Min Purchase'}
                    </label>
                    <input
                      type="number"
                      value={form.minPurchase}
                      onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                      className="input-field"
                      placeholder="$0"
                      min="0"
                    />
                  </div>
                </div>

                {/* Max Discount (for percentage) */}
                {form.discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الحد الأقصى للخصم' : 'Max Discount Amount'}
                    </label>
                    <input
                      type="number"
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      className="input-field"
                      placeholder={language === 'ar' ? 'غير محدود' : 'Unlimited'}
                      min="0"
                    />
                  </div>
                )}

                {/* Validity Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'تاريخ البداية' : 'Valid From'} *
                    </label>
                    <input
                      type="date"
                      value={form.validFrom}
                      onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'تاريخ الانتهاء' : 'Valid Until'}
                    </label>
                    <input
                      type="date"
                      value={form.validUntil}
                      onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'تطبيق على دورة معينة' : 'Apply to Specific Course'}
                  </label>
                  <select
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">
                      {language === 'ar' ? 'جميع الدورات' : 'All Courses'}
                    </option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {language === 'ar' ? course.titleAr : course.titleEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    {language === 'ar' ? 'الكوبون مفعل' : 'Coupon is active'}
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5 me-2" />
                        {language === 'ar' ? 'حفظ' : 'Save'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </h3>
              <p className="text-gray-600 mb-6">
                {language === 'ar'
                  ? 'هل أنت متأكد من حذف هذا الكوبون؟'
                  : 'Are you sure you want to delete this coupon?'}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
