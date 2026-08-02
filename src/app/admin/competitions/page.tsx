'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminLayout from '@/components/AdminLayout';
import { Trophy, Plus, Pencil, Trash2, Search, X, Users } from 'lucide-react';

interface Competition {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image?: string;
  mode: 'INDIVIDUAL' | 'TEAM';
  maxTeamSize: number;
  startDate: string;
  endDate: string;
  status: string;
  prizes?: string;
  rules?: string;
  _count: { participants: number; teams: number };
}

const STATUS_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft', color: 'bg-gray-100 text-gray-800' },
  OPEN: { ar: 'مفتوحة', en: 'Open', color: 'bg-green-100 text-green-800' },
  JUDGING: { ar: 'قيد التحكيم', en: 'Judging', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { ar: 'مكتملة', en: 'Completed', color: 'bg-blue-100 text-blue-800' },
};

export default function AdminCompetitionsPage() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const ar = language === 'ar';

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Competition | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '',
    mode: 'INDIVIDUAL', maxTeamSize: '1', startDate: '', endDate: '',
    status: 'DRAFT', prizes: '', rules: '',
  });

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/login'); return; }
    fetchCompetitions();
  }, [user, token, router]);

  const fetchCompetitions = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/competitions', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setCompetitions(result.data);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', mode: 'INDIVIDUAL', maxTeamSize: '1', startDate: '', endDate: '', status: 'DRAFT', prizes: '', rules: '' });
    setShowModal(true);
  };

  const openEdit = (item: Competition) => {
    setEditingItem(item);
    setForm({
      titleAr: item.titleAr, titleEn: item.titleEn,
      descriptionAr: item.descriptionAr, descriptionEn: item.descriptionEn,
      mode: item.mode, maxTeamSize: String(item.maxTeamSize),
      startDate: item.startDate.split('T')[0], endDate: item.endDate.split('T')[0],
      status: item.status, prizes: item.prizes || '', rules: item.rules || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titleAr || !form.titleEn || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      const url = editingItem ? `/api/admin/competitions/${editingItem.id}` : '/api/admin/competitions';
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, maxTeamSize: Number(form.maxTeamSize) }),
      });
      const result = await res.json();
      if (result.success) { setShowModal(false); fetchCompetitions(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/competitions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDeleteId(null);
    fetchCompetitions();
  };

  const filtered = competitions.filter(c => c.titleAr.includes(searchQuery) || c.titleEn.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">{ar ? 'المسابقات' : 'Competitions'}</h1>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
            <Plus className="w-4 h-4" />
            {ar ? 'إضافة مسابقة' : 'Add Competition'}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={ar ? 'بحث...' : 'Search...'} className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg" />
        </div>

        {loading ? <div className="text-center py-12 text-gray-500">{ar ? 'جاري التحميل...' : 'Loading...'}</div> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'المسابقة' : 'Competition'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'النوع' : 'Mode'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'التاريخ' : 'Date'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'المشاركون' : 'Participants'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{ar ? item.titleAr : item.titleEn}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${item.mode === 'TEAM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {item.mode === 'TEAM' ? (ar ? 'فريق' : 'Team') : (ar ? 'فردي' : 'Individual')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{item._count.participants}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg?.color}`}>
                          {ar ? cfg?.ar : cfg?.en}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">{ar ? 'لا يوجد مسابقات' : 'No competitions'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingItem ? (ar ? 'تعديل المسابقة' : 'Edit Competition') : (ar ? 'إضافة مسابقة' : 'Add Competition')}</h2>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'النوع' : 'Mode'}</label>
                  <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="INDIVIDUAL">{ar ? 'فردي' : 'Individual'}</option>
                    <option value="TEAM">{ar ? 'فريق' : 'Team'}</option>
                  </select>
                </div>
                {form.mode === 'TEAM' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الحد الأقصى للفريق' : 'Max Team Size'}</label>
                    <input type="number" min="2" value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                  </div>
                )}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الحالة' : 'Status'}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>{ar ? val.ar : val.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الجوائز' : 'Prizes'}</label>
                <textarea value={form.prizes} onChange={(e) => setForm({ ...form, prizes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'القواعد' : 'Rules'}</label>
                <textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
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
            <p className="text-gray-600 mb-6">{ar ? 'هل أنت متأكد من حذف هذه المسابقة؟' : 'Delete this competition?'}</p>
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
