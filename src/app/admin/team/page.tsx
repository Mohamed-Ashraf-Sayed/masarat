'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  X,
  Save,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

interface TeamMember {
  id: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  image: string | null;
  credentials: string | null;
  order: number;
  isActive: boolean;
}

export default function AdminTeamPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    roleAr: '',
    roleEn: '',
    image: '',
    credentials: '',
    order: 0,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchMembers();
  }, [user, token, router, authLoading]);

  const fetchMembers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/admin/team', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        nameAr: member.nameAr,
        nameEn: member.nameEn,
        roleAr: member.roleAr,
        roleEn: member.roleEn,
        image: member.image || '',
        credentials: member.credentials || '',
        order: member.order,
      });
    } else {
      setEditingMember(null);
      setFormData({
        nameAr: '',
        nameEn: '',
        roleAr: '',
        roleEn: '',
        image: '',
        credentials: '',
        order: members.length,
      });
    }
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, image: result.url }));
      } else {
        alert(result.error || 'فشل رفع الصورة');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('حدث خطأ في رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !formData.nameAr || !formData.nameEn || !formData.roleAr || !formData.roleEn) return;

    setSaving(true);
    try {
      const method = editingMember ? 'PUT' : 'POST';
      const body: any = { ...formData };
      if (editingMember) body.id = editingMember.id;

      const response = await fetch('/api/admin/team', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        fetchMembers();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error saving team member:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العضو؟' : 'Are you sure you want to delete this member?')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/team?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setMembers(members.filter(m => m.id !== id));
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    if (!token) return;
    try {
      const response = await fetch('/api/admin/team', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: member.id, isActive: !member.isActive }),
      });

      const result = await response.json();
      if (result.success) {
        setMembers(members.map(m => m.id === member.id ? { ...m, isActive: !m.isActive } : m));
      }
    } catch (error) {
      console.error('Error toggling member:', error);
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    if (!token) return;
    const index = members.findIndex(m => m.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === members.length - 1)) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const newMembers = [...members];
    const temp = newMembers[index].order;
    newMembers[index].order = newMembers[swapIndex].order;
    newMembers[swapIndex].order = temp;
    [newMembers[index], newMembers[swapIndex]] = [newMembers[swapIndex], newMembers[index]];
    setMembers(newMembers);

    try {
      await Promise.all([
        fetch('/api/admin/team', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: newMembers[index].id, order: newMembers[index].order }),
        }),
        fetch('/api/admin/team', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: newMembers[swapIndex].id, order: newMembers[swapIndex].order }),
        }),
      ]);
    } catch (error) {
      console.error('Error reordering:', error);
      fetchMembers();
    }
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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'إدارة فريق العمل' : 'Manage Team'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? `${members.length} عضو` : `${members.length} members`}
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إضافة عضو' : 'Add Member'}
        </button>
      </div>

      {/* Members List */}
      {members.length > 0 ? (
        <div className="space-y-4">
          {members.map((member, index) => (
            <div
              key={member.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${!member.isActive ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleReorder(member.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReorder(member.id, 'down')}
                    disabled={index === members.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Avatar */}
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {member.image ? (
                    <img src={member.image} alt={member.nameAr} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{language === 'ar' ? member.nameAr : member.nameEn}</h3>
                  <p className="text-sm text-[#4485b5]">{language === 'ar' ? member.roleAr : member.roleEn}</p>
                  {member.credentials && (
                    <p className="text-xs text-gray-500 mt-1">{member.credentials}</p>
                  )}
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => handleToggleActive(member)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    member.isActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {member.isActive
                    ? (language === 'ar' ? 'نشط' : 'Active')
                    : (language === 'ar' ? 'مخفي' : 'Hidden')}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(member)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    disabled={deleting === member.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deleting === member.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'ar' ? 'لا يوجد أعضاء في الفريق' : 'No team members found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'ar' ? 'ابدأ بإضافة عضو جديد' : 'Start by adding a new member'}
          </p>
          <button onClick={() => handleOpenModal()} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {language === 'ar' ? 'إضافة عضو' : 'Add Member'}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingMember
                  ? (language === 'ar' ? 'تعديل عضو الفريق' : 'Edit Team Member')
                  : (language === 'ar' ? 'إضافة عضو جديد' : 'Add New Member')}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'صورة العضو' : 'Member Image'}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.image ? (
                      <img src={formData.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {language === 'ar' ? 'رفع صورة' : 'Upload Image'}
                    </button>
                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                      >
                        {language === 'ar' ? 'إزالة الصورة' : 'Remove Image'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="input-field"
                    placeholder="د. أحمد محمد"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="input-field"
                    placeholder="Dr. Ahmed Mohamed"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الدور (عربي)' : 'Role (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.roleAr}
                    onChange={(e) => setFormData({ ...formData, roleAr: e.target.value })}
                    className="input-field"
                    placeholder="محلل سلوك معتمد"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'ar' ? 'الدور (إنجليزي)' : 'Role (English)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.roleEn}
                    onChange={(e) => setFormData({ ...formData, roleEn: e.target.value })}
                    className="input-field"
                    placeholder="Certified Behavior Analyst"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'المؤهلات / الشهادات' : 'Credentials'}
                </label>
                <input
                  type="text"
                  value={formData.credentials}
                  onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                  className="input-field"
                  placeholder="BCBA, M.Ed, Ph.D"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الترتيب' : 'Order'}
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.nameAr || !formData.nameEn || !formData.roleAr || !formData.roleEn}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
