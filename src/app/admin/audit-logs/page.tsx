'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  Search, Filter, Loader2, Shield, ChevronLeft, ChevronRight,
  User, Clock, Tag, Database,
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

const ACTION_COLORS: Record<string, string> = {
  COURSE_APPROVED:   'bg-green-100 text-green-700',
  COURSE_REJECTED:   'bg-red-100 text-red-700',
  COURSE_PUBLISHED:  'bg-blue-100 text-blue-700',
  COURSE_SUSPENDED:  'bg-orange-100 text-orange-700',
  USER_SUSPENDED:    'bg-red-100 text-red-700',
  USER_DELETED:      'bg-red-100 text-red-700',
  PAYMENT_APPROVED:  'bg-green-100 text-green-700',
  PAYMENT_REFUNDED:  'bg-yellow-100 text-yellow-700',
  REVENUE_SETTINGS_UPDATED: 'bg-purple-100 text-purple-700',
  REVENUE_SPLIT_STRIPE: 'bg-indigo-100 text-indigo-700',
  EVENT_STATUS_CHANGED: 'bg-cyan-100 text-cyan-700',
};

const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  COURSE_APPROVED:   { ar: 'اعتماد دورة', en: 'Course Approved' },
  COURSE_REJECTED:   { ar: 'رفض دورة', en: 'Course Rejected' },
  COURSE_PUBLISHED:  { ar: 'نشر دورة', en: 'Course Published' },
  COURSE_SUSPENDED:  { ar: 'تعليق دورة', en: 'Course Suspended' },
  USER_SUSPENDED:    { ar: 'تعليق مستخدم', en: 'User Suspended' },
  USER_DELETED:      { ar: 'حذف مستخدم', en: 'User Deleted' },
  PAYMENT_APPROVED:  { ar: 'قبول دفعة', en: 'Payment Approved' },
  PAYMENT_REFUNDED:  { ar: 'استرداد دفعة', en: 'Payment Refunded' },
  REVENUE_SETTINGS_UPDATED: { ar: 'تعديل إعدادات الإيرادات', en: 'Revenue Settings Updated' },
  REVENUE_SPLIT_STRIPE: { ar: 'توزيع إيراد Stripe', en: 'Stripe Revenue Split' },
  EVENT_STATUS_CHANGED: { ar: 'تغيير حالة فعالية', en: 'Event Status Changed' },
};

export default function AdminAuditLogsPage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const ar = language === 'ar';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableEntities, setAvailableEntities] = useState<string[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/dashboard'); return; }
  }, [user, router]);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        ...(search && { search }),
        ...(actionFilter && { action: actionFilter }),
        ...(entityFilter && { entity: entityFilter }),
      });
      const res = await fetch(`/api/admin/audit-logs?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setTotal(data.data.total);
        setPages(data.data.pages);
        if (data.data.actions?.length) setAvailableActions(data.data.actions);
        if (data.data.entities?.length) setAvailableEntities(data.data.entities);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token, page, search, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, actionFilter, entityFilter]);

  const formatDetails = (details: any): string => {
    if (!details) return '—';
    if (typeof details === 'string') {
      try { details = JSON.parse(details); } catch { return details; }
    }
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' • ');
  };

  const getActionLabel = (action: string) => {
    return ACTION_LABELS[action]?.[language] || action.replace(/_/g, ' ');
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || 'bg-gray-100 text-gray-700';
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{ar ? 'سجل العمليات' : 'Audit Logs'}</h1>
          <p className="text-gray-500">
            {ar ? `${total} عملية مسجلة` : `${total} logged actions`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
          <Shield className="w-4 h-4" />
          {ar ? 'للمسؤولين فقط' : 'Admins only'}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={ar ? 'بحث بالإجراء أو المستخدم...' : 'Search by action or user...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field ps-10"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="input-field"
          >
            <option value="">{ar ? 'كل الإجراءات' : 'All Actions'}</option>
            {availableActions.map(a => (
              <option key={a} value={a}>{getActionLabel(a)}</option>
            ))}
          </select>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="input-field"
          >
            <option value="">{ar ? 'كل الكيانات' : 'All Entities'}</option>
            {availableEntities.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">{ar ? 'لا توجد سجلات' : 'No logs found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'الإجراء' : 'Action'}</th>
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'المنفذ' : 'Actor'}</th>
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'الكيان' : 'Entity'}</th>
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'التفاصيل' : 'Details'}</th>
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'IP' : 'IP'}</th>
                  <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="py-3.5 px-5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        {log.actor ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{log.actor.name}</div>
                            <div className="text-xs text-gray-400">{log.actor.role}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">{ar ? 'النظام' : 'System'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {log.entity ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Database className="w-3.5 h-3.5 text-gray-400" />
                            <span>{log.entity}</span>
                            {log.entityId && <span className="text-gray-400 text-xs">#{log.entityId.slice(-6)}</span>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-5 max-w-[220px]">
                        <p className="text-sm text-gray-500 truncate">{formatDetails(log.details)}</p>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                      <td className="py-3.5 px-5 text-sm text-gray-500">
                        <div>{new Date(log.createdAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</div>
                        <div className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleTimeString(ar ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{ar ? 'معرف السجل' : 'Log ID'}</p>
                              <p className="font-mono text-gray-700 text-xs">{log.id}</p>
                            </div>
                            {log.actor && (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{ar ? 'البريد' : 'Email'}</p>
                                <p className="text-gray-700">{log.actor.email}</p>
                              </div>
                            )}
                            {log.entityId && (
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{ar ? 'معرف الكيان' : 'Entity ID'}</p>
                                <p className="font-mono text-gray-700 text-xs">{log.entityId}</p>
                              </div>
                            )}
                            {log.details && (
                              <div className="col-span-full">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{ar ? 'البيانات الكاملة' : 'Full Details'}</p>
                                <pre className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">
                                  {JSON.stringify(typeof log.details === 'string' ? JSON.parse(log.details) : log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {ar ? `صفحة ${page} من ${pages}` : `Page ${page} of ${pages}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, pages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                {ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
