'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { ikUrl } from '@/lib/imagekit';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  BookOpen,
  Star,
  X,
  Save,
  ArrowLeft,
  Mail,
  Award,
  Upload,
  ImageIcon,
} from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
}

export default function AdminInstructorsPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bio: '',
    avatar: '',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || !['ADMIN','SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }

    fetchInstructors();
  }, [user, token, router, authLoading]);

  const fetchInstructors = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/instructors', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setInstructors(result.data);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (instructor?: Instructor) => {
    if (instructor) {
      setEditingInstructor(instructor);
      setFormData({
        name: instructor.name,
        email: instructor.email,
        password: '',
        bio: instructor.bio || '',
        avatar: instructor.avatar || '',
      });
    } else {
      setEditingInstructor(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        bio: '',
        avatar: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!token || !formData.name || !formData.email) return;
    if (!editingInstructor && !formData.password) return;

    setSaving(true);

    try {
      const method = editingInstructor ? 'PUT' : 'POST';

      const body: any = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        avatar: formData.avatar,
      };

      if (editingInstructor) {
        body.id = editingInstructor.id;
      }

      if (formData.password) {
        body.password = formData.password;
      }

      const response = await fetch('/api/admin/instructors', {
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
        fetchInstructors();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error saving instructor:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (instructorId: string) => {
    if (!token) return;
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المدرب؟' : 'Are you sure you want to delete this instructor?')) {
      return;
    }

    setDeleting(instructorId);

    try {
      const response = await fetch(`/api/admin/instructors?id=${instructorId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setInstructors(instructors.filter(i => i.id !== instructorId));
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting instructor:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'avatar');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, avatar: result.data.url }));
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
        <Link
          href="/admin"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'إدارة المدربين' : 'Manage Instructors'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? `${instructors.length} مدرب` : `${instructors.length} instructors`}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إضافة مدرب' : 'Add Instructor'}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'البحث بالاسم أو البريد...' : 'Search by name or email...'}
            className="input-field ps-12"
          />
        </div>
      </div>

      {/* Instructors Grid */}
      {filteredInstructors.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => (
            <div
              key={instructor.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                    {instructor.avatar ? (
                      <img
                        src={ikUrl(instructor.avatar, { width: 200 })}
                        alt={instructor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-primary-600 text-2xl font-bold">
                        {instructor.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{instructor.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {instructor.email}
                    </p>
                  </div>
                </div>
              </div>

              {instructor.bio && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{instructor.bio}</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary-600 mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-bold">{instructor.coursesCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {language === 'ar' ? 'دورة' : 'Courses'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="font-bold">{instructor.studentsCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {language === 'ar' ? 'طالب' : 'Students'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold">{instructor.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {language === 'ar' ? 'التقييم' : 'Rating'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/courses?instructor=${instructor.id}`}
                  className="flex-1 px-4 py-2 text-center text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  {language === 'ar' ? 'عرض الدورات' : 'View Courses'}
                </Link>
                <button
                  onClick={() => handleOpenModal(instructor)}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(instructor.id)}
                  disabled={deleting === instructor.id}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {deleting === instructor.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {language === 'ar' ? 'لا يوجد مدربين' : 'No instructors found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'ar' ? 'ابدأ بإضافة مدرب جديد' : 'Start by adding a new instructor'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {language === 'ar' ? 'إضافة مدرب' : 'Add Instructor'}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingInstructor
                  ? (language === 'ar' ? 'تعديل المدرب' : 'Edit Instructor')
                  : (language === 'ar' ? 'إضافة مدرب جديد' : 'Add New Instructor')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الاسم' : 'Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder={language === 'ar' ? 'أدخل اسم المدرب' : 'Enter instructor name'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'} {!editingInstructor && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder={editingInstructor
                    ? (language === 'ar' ? 'اتركه فارغاً للإبقاء على الحالية' : 'Leave empty to keep current')
                    : (language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'نبذة عن المدرب' : 'Bio'}
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder={language === 'ar' ? 'نبذة مختصرة عن المدرب...' : 'Short bio about the instructor...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'صورة المدرب' : 'Avatar'}
                </label>
                {formData.avatar && (
                  <div className="mb-3 relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 mx-auto">
                    <img src={ikUrl(formData.avatar, { width: 200 })} alt="Avatar" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                      className="absolute top-0 end-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  ) : (
                    <Upload className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">
                    {uploading
                      ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                      : (language === 'ar' ? 'اختر صورة' : 'Choose Image')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
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
                disabled={saving || !formData.name || !formData.email || (!editingInstructor && !formData.password)}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
