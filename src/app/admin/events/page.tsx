'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminLayout from '@/components/AdminLayout';
import { Calendar, Plus, Pencil, Trash2, Search, X, Users } from 'lucide-react';

interface Event {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  capacity: number;
  registeredCount: number;
  price: number;
  status: string;
  organizerId: string;
  entityId?: string;
  refundPolicy?: string;
  organizer: { id: string; name: string; email: string };
  entity?: { id: string; nameAr: string; nameEn: string };
  _count: { registrations: number };
}

const STATUS_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft', color: 'bg-gray-100 text-gray-800' },
  SUBMITTED: { ar: 'بانتظار الموافقة', en: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { ar: 'معتمدة', en: 'Approved', color: 'bg-blue-100 text-blue-800' },
  PUBLISHED: { ar: 'منشورة', en: 'Published', color: 'bg-green-100 text-green-800' },
  COMPLETED: { ar: 'مكتملة', en: 'Completed', color: 'bg-purple-100 text-purple-800' },
  CANCELLED: { ar: 'ملغاة', en: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

export default function AdminEventsPage() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const ar = language === 'ar';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '',
    venue: '', startDate: '', endDate: '', capacity: '0', price: '0', refundPolicy: '',
  });

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/login'); return; }
    fetchEvents();
  }, [user, token, router]);

  const fetchEvents = async () => {
    if (!token) return;
    try {
      const url = `/api/admin/events${statusFilter ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setEvents(result.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) { setLoading(true); fetchEvents(); } }, [statusFilter]);

  const openCreate = () => {
    setEditingEvent(null);
    setForm({ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', venue: '', startDate: '', endDate: '', capacity: '0', price: '0', refundPolicy: '' });
    setShowModal(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setForm({
      titleAr: event.titleAr, titleEn: event.titleEn,
      descriptionAr: event.descriptionAr, descriptionEn: event.descriptionEn,
      venue: event.venue || '', refundPolicy: event.refundPolicy || '',
      startDate: event.startDate.split('T')[0], endDate: event.endDate.split('T')[0],
      capacity: String(event.capacity), price: String(event.price),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titleAr || !form.titleEn || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : '/api/admin/events';
      const res = await fetch(url, {
        method: editingEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity), price: Number(form.price) }),
      });
      const result = await res.json();
      if (result.success) { setShowModal(false); fetchEvents(); }
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/events/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      fetchEvents();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDeleteId(null);
    fetchEvents();
  };

  const filtered = events.filter(e =>
    e.titleAr.includes(searchQuery) || e.titleEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">{ar ? 'الفعاليات' : 'Events'}</h1>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
            <Plus className="w-4 h-4" />
            {ar ? 'إضافة فعالية' : 'Add Event'}
          </button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={ar ? 'بحث...' : 'Search...'} className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
            <option value="">{ar ? 'كل الحالات' : 'All Statuses'}</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{ar ? val.ar : val.en}</option>
            ))}
          </select>
        </div>

        {loading ? <div className="text-center py-12 text-gray-500">{ar ? 'جاري التحميل...' : 'Loading...'}</div> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الفعالية' : 'Event'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'التاريخ' : 'Date'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'المسجلون' : 'Registered'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="text-start px-6 py-3 text-xs font-medium text-gray-500 uppercase">{ar ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((event) => {
                  const cfg = STATUS_CONFIG[event.status];
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{ar ? event.titleAr : event.titleEn}</div>
                        {event.venue && <div className="text-sm text-gray-500">{event.venue}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(event.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{event.registeredCount}{event.capacity > 0 ? `/${event.capacity}` : ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={event.status}
                          onChange={(e) => handleStatusChange(event.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${cfg.color}`}
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                            <option key={key} value={key}>{ar ? val.ar : val.en}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(event)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">{ar ? 'لا يوجد فعاليات' : 'No events found'}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingEvent ? (ar ? 'تعديل الفعالية' : 'Edit Event') : (ar ? 'إضافة فعالية' : 'Add Event')}</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'المكان' : 'Venue'}</label>
                <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'تاريخ البدء' : 'Start Date'}</label>
                  <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'تاريخ الانتهاء' : 'End Date'}</label>
                  <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الطاقة الاستيعابية' : 'Capacity'} ({ar ? '0 = غير محدود' : '0 = unlimited'})</label>
                  <input type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'السعر' : 'Price'} ({ar ? '0 = مجاني' : '0 = free'})</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'سياسة الاسترداد' : 'Refund Policy'}</label>
                <textarea value={form.refundPolicy} onChange={(e) => setForm({ ...form, refundPolicy: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
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
            <p className="text-gray-600 mb-6">{ar ? 'هل أنت متأكد من حذف هذه الفعالية؟' : 'Are you sure you want to delete this event?'}</p>
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
