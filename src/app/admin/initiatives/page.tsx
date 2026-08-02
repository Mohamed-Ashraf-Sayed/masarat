'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminLayout from '@/components/AdminLayout';
import { Target, Plus, Pencil, Trash2, Search, X } from 'lucide-react';

interface Initiative {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  entityId: string;
  leaderId: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  entity: { id: string; nameAr: string; nameEn: string };
  leader: { id: string; name: string; email: string };
}

interface Entity { id: string; nameAr: string; nameEn: string; }
interface AdminUser { id: string; name: string; email: string; }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};
const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft' },
  ACTIVE: { ar: 'نشطة', en: 'Active' },
  COMPLETED: { ar: 'مكتملة', en: 'Completed' },
};

export default function AdminInitiativesPage() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const ar = language === 'ar';

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Initiative | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '',
    entityId: '', leaderId: '', startDate: '', endDate: '', status: 'DRAFT',
  });

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/login'); return; }
    fetchAll();
  }, [user, token, router]);

  const fetchAll = async () => {
    if (!token) return;
    try {
      const [initRes, entRes, usersRes] = await Promise.all([
        fetch(`/api/admin/initiatives${statusFilter ? `?status=${statusFilter}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/entities', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [initData, entData, usersData] = await Promise.all([initRes.json(), entRes.json(), usersRes.json()]);
      if (initData.success) setInitiatives(initData.data);
      if (entData.success) setEntities(entData.data);
      if (usersData.success) setUsers(usersData.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchAll(); }, [statusFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', entityId: '', leaderId: '', startDate: '', endDate: '', status: 'DRAFT' });
    setShowModal(true);
  };

  const openEdit = (item: Initiative) => {
    setEditingItem(item);
    setForm({
      titleAr: item.titleAr, titleEn: item.titleEn,
      descriptionAr: item.descriptionAr, descriptionEn: item.descriptionEn,
      entityId: item.entityId, leaderId: item.leaderId, status: item.status,
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titleAr || !form.titleEn || !form.entityId || !form.leaderId) return;
    setSaving(true);
    try {
      const url = editingItem ? `/api/admin/initiatives/${editingItem.id}` : '/api/admin/initiatives';
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) { setShowModal(false); fetchAll(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/initiatives/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDeleteId(null);
    fetchAll();
  };

  const filtered = initiatives.filter(i => i.titleAr.includes(searchQuery) || i.titleEn.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">{ar ? 'المبادرات' : 'Initiatives'}</h1>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
            <Plus className="w-4 h-4" />
            {ar ? 'إضافة مبادرة' : 'Add Initiative'}
          </button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={ar ? 'بحث...' : 'Search...'} className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
            <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="DRAFT">{ar ? 'مسودة' : 'Draft'}</option>
            <option value="ACTIVE">{ar ? 'نشطة' : 'Active'}</option>
            <option value="COMPLETED">{ar ? 'مكتملة' : 'Completed'}</option>
          </select>
        </div>

        {loading ? <div className="text-center py-12 text-gray-500">{ar ? 'جاري التحميل...' : 'Loading...'}</div> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'العنوان' : 'Title'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الجهة' : 'Entity'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'القائد' : 'Leader'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{ar ? item.titleAr : item.titleEn}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{ar ? item.entity.nameAr : item.entity.nameEn}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.leader.name}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
                        {ar ? STATUS_LABELS[item.status].ar : STATUS_LABELS[item.status].en}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">{ar ? 'لا يوجد مبادرات' : 'No initiatives'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingItem ? (ar ? 'تعديل المبادرة' : 'Edit Initiative') : (ar ? 'إضافة مبادرة' : 'Add Initiative')}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'العنوان بالعربي' : 'Title (Arabic)'}</label>
                  <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" dir="rtl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'العنوان بالإنجليزي' : 'Title (English)'}</label>
                  <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الجهة' : 'Entity'}</label>
                <select value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">{ar ? 'اختر الجهة' : 'Select entity'}</option>
                  {entities.map(e => <option key={e.id} value={e.id}>{ar ? e.nameAr : e.nameEn}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'قائد المبادرة' : 'Leader'}</label>
                <select value={form.leaderId} onChange={(e) => setForm({ ...form, leaderId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">{ar ? 'اختر القائد' : 'Select leader'}</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الحالة' : 'Status'}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="DRAFT">{ar ? 'مسودة' : 'Draft'}</option>
                  <option value="ACTIVE">{ar ? 'نشطة' : 'Active'}</option>
                  <option value="COMPLETED">{ar ? 'مكتملة' : 'Completed'}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'تاريخ البدء' : 'Start Date'}</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'تاريخ الانتهاء' : 'End Date'}</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
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
            <h3 className="text-lg font-bold mb-2">{ar ? 'تأكيد الحذف' : 'Confirm Delete'}</h3>
            <p className="text-gray-600 mb-6">{ar ? 'هل أنت متأكد من حذف هذه المبادرة؟' : 'Are you sure you want to delete this initiative?'}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-gray-300 rounded-lg">{ar ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 bg-red-600 text-white rounded-lg">{ar ? 'حذف' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
