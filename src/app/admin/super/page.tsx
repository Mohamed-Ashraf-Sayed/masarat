'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  Users,
  DollarSign,
  Settings,
  FileText,
  Lock,
  Crown,
  Loader2,
  ChevronRight,
  UserCog,
  Percent,
  Activity,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { language } = useLanguage();
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [revenueSettings, setRevenueSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!token || !user || user.role !== 'SUPER_ADMIN') return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, revenueRes, auditRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats', { headers }),
          fetch('/api/admin/revenue-settings', { headers }),
          fetch('/api/admin/audit-logs?limit=5', { headers }),
          fetch('/api/admin/users?limit=8', { headers }),
        ]);
        const [statsData, revenueData, auditData, usersData] = await Promise.all([
          statsRes.json(), revenueRes.json(), auditRes.json(), usersRes.json(),
        ]);
        if (statsData.success) setStats(statsData.data);
        if (revenueData.success) setRevenueSettings(revenueData.data);
        if (auditData.success) setAuditLogs(auditData.data?.logs || auditData.data || []);
        if (usersData.success) setUsers(usersData.data?.users || usersData.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token, user]);

  const ar = (a: string, e: string) => (language === 'ar' ? a : e);

  const roleLabel = (role: string) => {
    const map: Record<string, { ar: string; en: string; color: string }> = {
      SUPER_ADMIN: { ar: 'سوبر أدمن', en: 'Super Admin', color: 'bg-yellow-100 text-yellow-800' },
      ADMIN: { ar: 'مدير', en: 'Admin', color: 'bg-purple-100 text-purple-800' },
      INSTRUCTOR: { ar: 'مدرب', en: 'Instructor', color: 'bg-blue-100 text-blue-800' },
      ENTITY_OWNER: { ar: 'مالك جهة', en: 'Entity Owner', color: 'bg-green-100 text-green-800' },
      STUDENT: { ar: 'طالب', en: 'Student', color: 'bg-gray-100 text-gray-700' },
    };
    return map[role] || { ar: role, en: role, color: 'bg-gray-100 text-gray-700' };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-4 lg:p-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {ar('لوحة السوبر أدمن', 'Super Admin Panel')}
              </h1>
              <p className="text-gray-500 text-sm">
                {ar('صلاحيات كاملة على النظام', 'Full system privileges')}
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            {ar('لوحة الإدارة العادية', 'Regular Admin Panel')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: ar('المستخدمين', 'Users'), value: stats?.overview?.totalUsers || 0, color: 'bg-blue-500' },
            { icon: BookOpen, label: ar('الدورات', 'Courses'), value: stats?.overview?.totalCourses || 0, color: 'bg-green-500' },
            { icon: DollarSign, label: ar('الإيرادات', 'Revenue'), value: `$${(stats?.overview?.totalRevenue || 0).toLocaleString()}`, color: 'bg-purple-500' },
            { icon: TrendingUp, label: ar('التسجيلات', 'Enrollments'), value: stats?.overview?.totalEnrollments || 0, color: 'bg-orange-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Exclusive Actions */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">
              {ar('صلاحيات حصرية', 'Exclusive Privileges')}
            </h2>
            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
              SUPER ADMIN ONLY
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: '/admin/users',
                icon: UserCog,
                title: ar('إدارة الأدوار', 'Role Management'),
                desc: ar('تغيير أدوار المستخدمين وحذف الحسابات', 'Change user roles & delete accounts'),
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600',
                badge: ar('حذف / تغيير دور', 'Delete / Change Role'),
                badgeColor: 'bg-red-50 text-red-600',
              },
              {
                href: '/admin/revenue-settings',
                icon: Percent,
                title: ar('توزيع الإيرادات', 'Revenue Split'),
                desc: ar(
                  `${Math.round((revenueSettings?.instructorShare || 0.7) * 100)}% مدرب — ${Math.round((revenueSettings?.platformShare || 0.2) * 100)}% منصة — ${Math.round((revenueSettings?.entityShare || 0.1) * 100)}% جهة`,
                  `${Math.round((revenueSettings?.instructorShare || 0.7) * 100)}% Instr — ${Math.round((revenueSettings?.platformShare || 0.2) * 100)}% Platform — ${Math.round((revenueSettings?.entityShare || 0.1) * 100)}% Entity`
                ),
                iconBg: 'bg-yellow-100',
                iconColor: 'text-yellow-600',
                badge: ar('قابل للتعديل', 'Configurable'),
                badgeColor: 'bg-yellow-50 text-yellow-600',
              },
              {
                href: '/admin/security',
                icon: Lock,
                title: ar('إعدادات الأمان', 'Security Settings'),
                desc: ar('حماية النظام وإدارة الأمان', 'System protection & security management'),
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
                badge: ar('حماية النظام', 'System Protection'),
                badgeColor: 'bg-orange-50 text-orange-600',
              },
              {
                href: '/admin/audit-logs',
                icon: FileText,
                title: ar('سجلات التدقيق', 'Audit Logs'),
                desc: ar('مراجعة جميع العمليات على النظام', 'Review all system operations'),
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                badge: ar('مراقبة كاملة', 'Full Monitoring'),
                badgeColor: 'bg-blue-50 text-blue-600',
              },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${action.iconBg} rounded-xl flex items-center justify-center`}>
                    <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-gray-500 text-xs mb-3 leading-relaxed">{action.desc}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${action.badgeColor}`}>
                  {action.badge}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-yellow-500" />
                {ar('توزيع الإيرادات الحالي', 'Current Revenue Split')}
              </h3>
              <Link href="/admin/revenue-settings" className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
                {ar('تعديل', 'Edit')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-6 space-y-4">
              {revenueSettings ? (
                <>
                  {[
                    { label: ar('المدرب', 'Instructor'), value: revenueSettings.instructorShare, color: 'bg-blue-500' },
                    { label: ar('المنصة', 'Platform'), value: revenueSettings.platformShare, color: 'bg-purple-500' },
                    { label: ar('الجهة', 'Entity'), value: revenueSettings.entityShare, color: 'bg-green-500' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">{item.label}</span>
                        <span className="font-bold text-gray-900">{Math.round(item.value * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-gray-400 text-xs mb-1">{ar('الحد الأدنى للدفع', 'Min Payout')}</div>
                      <div className="text-gray-900 font-bold">${revenueSettings.minPayoutAmount}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-gray-400 text-xs mb-1">{ar('دورة الدفع', 'Payout Cycle')}</div>
                      <div className="text-gray-900 font-bold">{revenueSettings.payoutCycleDays} {ar('يوم', 'days')}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-6">{ar('لا توجد بيانات', 'No data')}</div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                {ar('المستخدمون الأخيرون', 'Recent Users')}
              </h3>
              <Link href="/admin/users" className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
                {ar('عرض الكل', 'View All')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {users.length > 0 ? users.slice(0, 6).map((u: any, i: number) => {
                const rl = roleLabel(u.role);
                return (
                  <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rl.color}`}>
                      {rl[language as 'ar' | 'en']}
                    </span>
                  </div>
                );
              }) : (
                <div className="p-6 text-center text-gray-400">{ar('لا يوجد مستخدمين', 'No users')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              {ar('آخر سجلات التدقيق', 'Recent Audit Logs')}
            </h3>
            <Link href="/admin/audit-logs" className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
              {ar('عرض الكل', 'View All')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {auditLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-start p-4 font-semibold">{ar('الإجراء', 'Action')}</th>
                    <th className="text-start p-4 font-semibold">{ar('المستخدم', 'User')}</th>
                    <th className="text-start p-4 font-semibold">{ar('الوقت', 'Time')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.slice(0, 5).map((log: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{log.user?.name || log.userId || '—'}</td>
                      <td className="p-4 text-sm text-gray-400">
                        {new Date(log.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-gray-300" />
              {ar('لا توجد سجلات بعد', 'No audit logs yet')}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
