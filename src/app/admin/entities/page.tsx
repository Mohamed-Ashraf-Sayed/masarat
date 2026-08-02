'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminLayout from '@/components/AdminLayout';
import { Building, Plus, Pencil, Trash2, Search, X, Check } from 'lucide-react';

interface Entity {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  logo?: string;
  isActive: boolean;
  unionId: string;
  ownerId: string;
  union: { id: string; nameAr: string; nameEn: string };
  owner: { id: string; name: string; email: string };
  _count: { initiatives: number };
}

interface Union { id: string; nameAr: string; nameEn: string; }
interface AdminUser { id: string; name: string; email: string; }

export default function AdminEntitiesPage() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const ar = language === 'ar';

  const [entities, setEntities] = useState<Entity[]>([]);
  const [unions, setUnions] = useState<Union[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', logo: '', unionId: '', ownerId: '',
  });

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }
    fetchAll();
  }, [user, token, router]);

  const fetchAll = async () => {
    if (!token) return;
    try {
      const [entRes, unionsRes, usersRes] = await Promise.all([
        fetch('/api/admin/entities', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/unions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [entData, unionsData, usersData] = await Promise.all([entRes.json(), unionsRes.json(), usersRes.json()]);
      if (entData.success) setEntities(entData.data);
      if (unionsData.success) setUnions(unionsData.data);
      if (usersData.success) setUsers(usersData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingEntity(null);
    setForm({ nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', logo: '', unionId: '', ownerId: '' });
    setShowModal(true);
  };

  const openEdit = (entity: Entity) => {
    setEditingEntity(entity);
    setForm({
      nameAr: entity.nameAr, nameEn: entity.nameEn,
      descriptionAr: entity.descriptionAr, descriptionEn: entity.descriptionEn,
      logo: entity.logo || '', unionId: entity.unionId, ownerId: entity.ownerId,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nameAr || !form.nameEn || !form.unionId || !form.ownerId) return;
    setSaving(true);
    try {
      const url = editingEntity ? `/api/admin/entities/${editingEntity.id}` : '/api/admin/entities';
      const method = editingEntity ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) { setShowModal(false); fetchAll(); }
    } catch (error) {
      console.error('Error saving entity:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/entities/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setDeleteId(null);
      fetchAll();
    } catch (error) {
      console.error('Error deleting entity:', error);
    }
  };

  const filtered = entities.filter(e =>
    e.nameAr.includes(searchQuery) || e.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">{ar ? 'الجهات' : 'Entities'}</h1>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
            <Plus className="w-4 h-4" />
            {ar ? 'إضافة جهة' : 'Add Entity'}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ar ? 'بحث...' : 'Search...'}
            className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">{ar ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الاسم' : 'Name'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الاتحاد' : 'Union'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'المالك' : 'Owner'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'المبادرات' : 'Initiatives'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((entity) => (
                  <tr key={entity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{ar ? entity.nameAr : entity.nameEn}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ar ? entity.union.nameAr : entity.union.nameEn}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entity.owner.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {entity._count.initiatives}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${entity.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {entity.isActive ? (ar ? 'نشط' : 'Active') : (ar ? 'غير نشط' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(entity)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(entity.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">{ar ? 'لا يوجد جهات' : 'No entities found'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingEntity ? (ar ? 'تعديل الجهة' : 'Edit Entity') : (ar ? 'إضافة جهة' : 'Add Entity')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الاسم بالعربي' : 'Name (Arabic)'}</label>
                  <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" dir="rtl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الاسم بالإنجليزي' : 'Name (English)'}</label>
                  <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الوصف بالعربي' : 'Description (Arabic)'}</label>
                <textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الوصف بالإنجليزي' : 'Description (English)'}</label>
                <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الاتحاد' : 'Union'}</label>
                <select value={form.unionId} onChange={(e) => setForm({ ...form, unionId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">{ar ? 'اختر الاتحاد' : 'Select union'}</option>
                  {unions.map(u => <option key={u.id} value={u.id}>{ar ? u.nameAr : u.nameEn}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'مالك الجهة' : 'Entity Owner'}</label>
                <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">{ar ? 'اختر المالك' : 'Select owner'}</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">{ar ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : (ar ? 'حفظ' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{ar ? 'تأكيد الحذف' : 'Confirm Delete'}</h3>
            <p className="text-gray-600 mb-6">{ar ? 'هل أنت متأكد من حذف هذه الجهة؟' : 'Are you sure you want to delete this entity?'}</p>
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
