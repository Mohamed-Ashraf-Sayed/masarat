'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  DollarSign, Clock, CheckCircle, RefreshCw, TrendingUp,
  BookOpen, Loader2, ArrowLeft, ArrowRight, Info,
} from 'lucide-react';

type RevenueStatus = 'HELD' | 'AVAILABLE' | 'PAID' | 'REFUNDED';

interface RevenueTransaction {
  id: string;
  totalAmount: number;
  instructorAmount: number;
  platformAmount: number;
  entityAmount: number;
  status: RevenueStatus;
  availableAt: string | null;
  payoutDate: string | null;
  createdAt: string;
  course: { id: string; title: { ar: string; en: string } };
  payment: { id: string; amount: number; currency: string };
}

interface RevenueSummary {
  held: number;
  available: number;
  paid: number;
  refunded: number;
  total: number;
}

const STATUS_CONFIG: Record<RevenueStatus, { label: { ar: string; en: string }; color: string; icon: React.ReactNode }> = {
  HELD:      { label: { ar: 'محجوز', en: 'Held' },        color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
  AVAILABLE: { label: { ar: 'متاح', en: 'Available' },    color: 'bg-blue-100 text-blue-700',    icon: <CheckCircle className="w-3.5 h-3.5" /> },
  PAID:      { label: { ar: 'مدفوع', en: 'Paid' },        color: 'bg-green-100 text-green-700',  icon: <DollarSign className="w-3.5 h-3.5" /> },
  REFUNDED:  { label: { ar: 'مسترجع', en: 'Refunded' },   color: 'bg-red-100 text-red-700',      icon: <RefreshCw className="w-3.5 h-3.5" /> },
};

export default function InstructorRevenuePage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const ar = language === 'ar';

  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [summary, setSummary] = useState<RevenueSummary>({ held: 0, available: 0, paid: 0, refunded: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | RevenueStatus>('all');
  const [instructorShare, setInstructorShare] = useState(70);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/dashboard'); return; }
    fetchRevenue();
  }, [user, token, router]);

  const fetchRevenue = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/instructor/revenue', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.transactions || []);
        setSummary(data.data.summary || { held: 0, available: 0, paid: 0, refunded: 0, total: 0 });
        if (data.data.instructorShare) setInstructorShare(Math.round(data.data.instructorShare * 100));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filteredTransactions = transactions.filter(tx =>
    statusFilter === 'all' || tx.status === statusFilter
  );

  const BackIcon = ar ? ArrowRight : ArrowLeft;

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/instructor/courses" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <BackIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{ar ? 'إيراداتي' : 'My Revenue'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {ar ? `نصيبك من كل بيع: ${instructorShare}%` : `Your share per sale: ${instructorShare}%`}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: { ar: 'إجمالي الأرباح', en: 'Total Earnings' }, value: summary.total, gradient: 'from-primary-500 to-primary-700', icon: <TrendingUp className="w-5 h-5" /> },
          { label: { ar: 'محجوز (قيد الانتظار)', en: 'Held (Pending)' }, value: summary.held, gradient: 'from-yellow-400 to-yellow-600', icon: <Clock className="w-5 h-5" />, tooltip: ar ? 'سيكون متاحاً بعد انتهاء فترة الاسترداد' : 'Available after refund period ends' },
          { label: { ar: 'متاح للصرف', en: 'Available' }, value: summary.available, gradient: 'from-blue-400 to-blue-600', icon: <CheckCircle className="w-5 h-5" /> },
          { label: { ar: 'تم الصرف', en: 'Paid Out' }, value: summary.paid, gradient: 'from-green-400 to-green-600', icon: <DollarSign className="w-5 h-5" /> },
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.gradient} text-white rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 p-2 rounded-xl">{card.icon}</div>
              {card.tooltip && (
                <div className="relative group">
                  <Info className="w-4 h-4 text-white/70 cursor-help" />
                  <div className="absolute end-0 top-6 w-48 bg-black/80 text-white text-xs rounded-lg p-2 hidden group-hover:block z-10">
                    {card.tooltip}
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-white/80 mb-1">{card.label[language]}</p>
            <p className="text-2xl font-bold">${card.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Refunded alert */}
      {summary.refunded > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-6 text-sm text-red-700">
          <RefreshCw className="w-4 h-4 flex-shrink-0" />
          {ar
            ? `تم استرداد مبلغ $${summary.refunded.toFixed(2)} من إيراداتك بسبب طلبات الاسترجاع.`
            : `$${summary.refunded.toFixed(2)} has been refunded from your earnings.`}
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-100 flex-wrap">
          {(['all', 'HELD', 'AVAILABLE', 'PAID', 'REFUNDED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-xs ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s === 'all' ? (ar ? 'الكل' : 'All') : STATUS_CONFIG[s].label[language]}
              {s !== 'all' && (
                <span className="ms-1 opacity-70">
                  ({transactions.filter(t => t.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-start py-3.5 px-5 text-sm font-semibold text-gray-600">{ar ? 'الدورة' : 'Course'}</th>
                <th className="text-start py-3.5 px-5 text-sm font-semibold text-gray-600">{ar ? 'سعر البيع' : 'Sale Price'}</th>
                <th className="text-start py-3.5 px-5 text-sm font-semibold text-gray-600">{ar ? 'نصيبك' : 'Your Earnings'}</th>
                <th className="text-start py-3.5 px-5 text-sm font-semibold text-gray-600">{ar ? 'الحالة' : 'Status'}</th>
                <th className="text-start py-3.5 px-5 text-sm font-semibold text-gray-600">{ar ? 'تاريخ الاستحقاق' : 'Available At'}</th>
                <th className="text-start py-3.5 px-5 text-sm font-semibold text-gray-600">{ar ? 'التاريخ' : 'Date'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">{ar ? 'لا توجد إيرادات بعد' : 'No revenue yet'}</p>
                  </td>
                </tr>
              ) : filteredTransactions.map(tx => {
                const cfg = STATUS_CONFIG[tx.status];
                return (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5">
                      <Link href={`/courses/${tx.course.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-1 max-w-[200px] block">
                        {tx.course.title[language]}
                      </Link>
                    </td>
                    <td className="py-4 px-5 text-sm text-gray-600">${tx.totalAmount.toFixed(2)}</td>
                    <td className="py-4 px-5 font-semibold text-green-600">${tx.instructorAmount.toFixed(2)}</td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label[language]}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-sm text-gray-500">
                      {tx.availableAt ? new Date(tx.availableAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US') : '—'}
                    </td>
                    <td className="py-4 px-5 text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-gray-100 text-sm text-gray-500 bg-gray-50">
            {ar
              ? `إجمالي ${filteredTransactions.length} معاملة • أرباح: $${filteredTransactions.reduce((s, t) => s + t.instructorAmount, 0).toFixed(2)}`
              : `${filteredTransactions.length} transactions • Total: $${filteredTransactions.reduce((s, t) => s + t.instructorAmount, 0).toFixed(2)}`}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
