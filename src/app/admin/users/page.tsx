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
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  BookOpen,
  X,
  Save,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  enrollmentsCount: number;
  coursesCount: number;
}

export default function AdminUsersPage() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    isActive: true,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || !['ADMIN','SUPER_ADMIN'].includes(user.role)) {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [user, token, router, authLoading, roleFilter]);

  const fetchUsers = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleOpenModal = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        password: '',
        role: userToEdit.role,
        isActive: userToEdit.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!token || !formData.name || !formData.email) return;
    if (!editingUser && !formData.password) return;

    setSaving(true);

    try {
      const url = '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
      };

      if (editingUser) {
        body.id = editingUser.id;
      }

      if (formData.password) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
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
        fetchUsers();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!token) return;
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      return;
    }

    setDeleting(userId);

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    if (!token) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId, isActive: !isActive }),
      });

      const result = await response.json();

      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, isActive: !isActive } : u
        ));
      }
    } catch (error) {
      console.error('Error toggling user active:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'INSTRUCTOR':
        return <BookOpen className="w-4 h-4 text-green-500" />;
      default:
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { bg: string; text: string; label: { ar: string; en: string } }> = {
      ADMIN: { bg: 'bg-red-100', text: 'text-red-700', label: { ar: 'مدير', en: 'Admin' } },
      INSTRUCTOR: { bg: 'bg-green-100', text: 'text-green-700', label: { ar: 'مدرب', en: 'Instructor' } },
      STUDENT: { bg: 'bg-blue-100', text: 'text-blue-700', label: { ar: 'طالب', en: 'Student' } },
    };
    const badge = badges[role] || badges.STUDENT;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label[language]}
      </span>
    );
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
            {language === 'ar' ? 'إدارة المستخدمين' : 'Manage Users'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? `${users.length} مستخدم` : `${users.length} users`}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
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
          </form>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field w-full sm:w-48"
          >
            <option value="all">{language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
            <option value="STUDENT">{language === 'ar' ? 'طلاب' : 'Students'}</option>
            <option value="INSTRUCTOR">{language === 'ar' ? 'مدربين' : 'Instructors'}</option>
            <option value="ADMIN">{language === 'ar' ? 'مديرين' : 'Admins'}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'المستخدم' : 'User'}
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'الدور' : 'Role'}
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'الإحصائيات' : 'Stats'}
                  </th>
                  <th className="text-start p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'تاريخ التسجيل' : 'Joined'}
                  </th>
                  <th className="text-end p-4 text-sm font-medium text-gray-500">
                    {language === 'ar' ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          {u.avatar ? (
                            <img src={ikUrl(u.avatar, { width: 100 })} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-primary-600 font-semibold">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(u.role)}
                        {getRoleBadge(u.role)}
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                          u.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserCheck className="w-4 h-4" />
                            {language === 'ar' ? 'نشط' : 'Active'}
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4" />
                            {language === 'ar' ? 'معطل' : 'Inactive'}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-500">
                        <p>{u.enrollmentsCount} {language === 'ar' ? 'تسجيل' : 'enrollments'}</p>
                        {u.role === 'INSTRUCTOR' && (
                          <p>{u.coursesCount} {language === 'ar' ? 'دورة' : 'courses'}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deleting === u.id}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            {deleting === u.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'ar' ? 'لا يوجد مستخدمين' : 'No users found'}
            </h3>
            <p className="text-gray-500">
              {language === 'ar' ? 'جرب تغيير معايير البحث' : 'Try changing your search criteria'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUser
                  ? (language === 'ar' ? 'تعديل المستخدم' : 'Edit User')
                  : (language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User')}
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
                  placeholder={language === 'ar' ? 'أدخل الاسم' : 'Enter name'}
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
                  {language === 'ar' ? 'كلمة المرور' : 'Password'} {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder={editingUser
                    ? (language === 'ar' ? 'اتركه فارغاً للإبقاء على الحالية' : 'Leave empty to keep current')
                    : (language === 'ar' ? 'أدخل كلمة المرور' : 'Enter password')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الدور' : 'Role'}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="STUDENT">{language === 'ar' ? 'طالب' : 'Student'}</option>
                  <option value="INSTRUCTOR">{language === 'ar' ? 'مدرب' : 'Instructor'}</option>
                  <option value="ADMIN">{language === 'ar' ? 'مدير' : 'Admin'}</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">
                    {language === 'ar' ? 'حساب نشط' : 'Active account'}
                  </span>
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
                disabled={saving || !formData.name || !formData.email || (!editingUser && !formData.password)}
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
