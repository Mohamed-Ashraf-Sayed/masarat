'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminLayout from '@/components/AdminLayout';
import { Building2, Plus, Pencil, Trash2, Search, X, Check } from 'lucide-react';

interface Union {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  _count: { entities: number };
}

export default function AdminUnionsPage() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const ar = language === 'ar';

  const [unions, setUnions] = useState<Union[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUnion, setEditingUnion] = useState<Union | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', logo: '',
  });

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }
    fetchUnions();
  }, [user, token, router]);

  const fetchUnions = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/unions', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setUnions(result.data);
    } catch (error) {
      console.error('Error fetching unions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingUnion(null);
    setForm({ nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', logo: '' });
    setShowModal(true);
  };

  const openEdit = (union: Union) => {
    setEditingUnion(union);
    setForm({
      nameAr: union.nameAr, nameEn: union.nameEn,
      descriptionAr: union.descriptionAr, descriptionEn: union.descriptionEn,
      logo: union.logo || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nameAr || !form.nameEn || !form.descriptionAr || !form.descriptionEn) return;
    setSaving(true);
    try {
      const url = editingUnion ? `/api/admin/unions/${editingUnion.id}` : '/api/admin/unions';
      const method = editingUnion ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        setShowModal(false);
        fetchUnions();
      }
    } catch (error) {
      console.error('Error saving union:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/unions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteId(null);
      fetchUnions();
    } catch (error) {
      console.error('Error deleting union:', error);
    }
  };

  const filtered = unions.filter(u =>
    u.nameAr.includes(searchQuery) || u.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {ar ? 'الاتحادات' : 'Unions'}
            </h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {ar ? 'إضافة اتحاد' : 'Add Union'}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ar ? 'بحث عن اتحاد...' : 'Search unions...'}
            className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">{ar ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الاسم' : 'Name'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الجهات' : 'Entities'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((union) => (
                  <tr key={union.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{ar ? union.nameAr : union.nameEn}</div>
                      <div className="text-sm text-gray-500">{ar ? union.nameEn : union.nameAr}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {union._count.entities} {ar ? 'جهة' : 'entities'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        union.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {union.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {union.isActive ? (ar ? 'نشط' : 'Active') : (ar ? 'غير نشط' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(union)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(union.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">{ar ? 'لا يوجد اتحادات' : 'No unions found'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingUnion ? (ar ? 'تعديل الاتحاد' : 'Edit Union') : (ar ? 'إضافة اتحاد' : 'Add Union')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الاسم بالعربي' : 'Name (Arabic)'}</label>
                  <input
                    value={form.nameAr}
                    onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
                  <input
                    value={form.nameEn}
                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الوصف بالعربي' : 'Description (Arabic)'}</label>
                <textarea
                  value={form.descriptionAr}
                  onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الوصف بالإنجليزي' : 'Description (English)'}</label>
                <textarea
                  value={form.descriptionEn}
                  onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'رابط الشعار (اختياري)' : 'Logo URL (optional)'}</label>
                <input
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                {ar ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'حفظ' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{ar ? 'تأكيد الحذف' : 'Confirm Delete'}</h3>
            <p className="text-gray-600 mb-6">{ar ? 'هل أنت متأكد من حذف هذا الاتحاد؟ سيتم حذف جميع الجهات والمبادرات المرتبطة به.' : 'Are you sure you want to delete this union? All related entities and initiatives will be deleted.'}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">{ar ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">{ar ? 'حذف' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
