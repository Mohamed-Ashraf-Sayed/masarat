'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  DollarSign, TrendingUp, Clock, CheckCircle, RefreshCw,
  Settings, Save, Loader2, Search, Filter, ChevronDown,
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
  instructor: { id: string; name: string; email: string };
  course: { id: string; title: { ar: string; en: string } };
  payment: { id: string; amount: number; currency: string };
}

interface RevenueSettings {
  instructorShare: number;
  platformShare: number;
  entityShare: number;
  minPayoutAmount: number;
  payoutCycleDays: number;
  refundBufferDays: number;
}

interface RevenueSummary {
  held: number;
  available: number;
  paid: number;
  refunded: number;
  total: number;
}

const STATUS_CONFIG: Record<RevenueStatus, { label: { ar: string; en: string }; color: string; icon: React.ReactNode }> = {
  HELD:      { label: { ar: 'محجوز', en: 'Held' },        color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  AVAILABLE: { label: { ar: 'متاح', en: 'Available' },    color: 'bg-blue-100 text-blue-700',    icon: <CheckCircle className="w-4 h-4" /> },
  PAID:      { label: { ar: 'مدفوع', en: 'Paid' },        color: 'bg-green-100 text-green-700',  icon: <DollarSign className="w-4 h-4" /> },
  REFUNDED:  { label: { ar: 'مسترجع', en: 'Refunded' },   color: 'bg-red-100 text-red-700',      icon: <RefreshCw className="w-4 h-4" /> },
};

export default function AdminRevenuePage() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const router = useRouter();
  const ar = language === 'ar';

  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [summary, setSummary] = useState<RevenueSummary>({ held: 0, available: 0, paid: 0, refunded: 0, total: 0 });
  const [settings, setSettings] = useState<RevenueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'settings'>('transactions');
  const [statusFilter, setStatusFilter] = useState<'all' | RevenueStatus>('all');
  const [search, setSearch] = useState('');

  // Settings form state
  const [instructorShare, setInstructorShare] = useState('70');
  const [platformShare, setPlatformShare] = useState('20');
  const [entityShare, setEntityShare] = useState('10');
  const [minPayoutAmount, setMinPayoutAmount] = useState('50');
  const [payoutCycleDays, setPayoutCycleDays] = useState('30');
  const [refundBufferDays, setRefundBufferDays] = useState('14');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/dashboard'); return; }
    fetchData();
  }, [user, token, router]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [txRes, settingsRes] = await Promise.all([
        fetch('/api/admin/revenue', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/revenue-settings', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [txData, settingsData] = await Promise.all([txRes.json(), settingsRes.json()]);

      if (txData.success) {
        setTransactions(txData.data.transactions || []);
        setSummary(txData.data.summary || { held: 0, available: 0, paid: 0, refunded: 0, total: 0 });
      }
      if (settingsData.success) {
        const s = settingsData.data;
        setSettings(s);
        setInstructorShare(String(Math.round(s.instructorShare * 100)));
        setPlatformShare(String(Math.round(s.platformShare * 100)));
        setEntityShare(String(Math.round(s.entityShare * 100)));
        setMinPayoutAmount(String(s.minPayoutAmount));
        setPayoutCycleDays(String(s.payoutCycleDays));
        setRefundBufferDays(String(s.refundBufferDays));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveSettings = async () => {
    if (!token) return;
    const ins = parseFloat(instructorShare) / 100;
    const plat = parseFloat(platformShare) / 100;
    const ent = parseFloat(entityShare) / 100;
    if (Math.abs(ins + plat + ent - 1) > 0.001) {
      alert(ar ? 'مجموع النسب يجب أن يساوي 100%' : 'Shares must add up to 100%');
      return;
    }
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/revenue-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          instructorShare: ins,
          platformShare: plat,
          entityShare: ent,
          minPayoutAmount: parseFloat(minPayoutAmount),
          payoutCycleDays: parseInt(payoutCycleDays),
          refundBufferDays: parseInt(refundBufferDays),
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSettings(result.data);
        alert(ar ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
      } else {
        alert(result.error || (ar ? 'فشل الحفظ' : 'Save failed'));
      }
    } catch (e) { console.error(e); }
    finally { setSavingSettings(false); }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || tx.instructor.name.toLowerCase().includes(q) ||
      tx.course.title.ar.toLowerCase().includes(q) || tx.course.title.en.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const summaryCards = [
    { label: { ar: 'إجمالي الإيرادات', en: 'Total Revenue' }, value: summary.total, color: 'from-primary-500 to-primary-700', icon: <TrendingUp className="w-6 h-6" /> },
    { label: { ar: 'محجوز (قيد الانتظار)', en: 'Held (Pending)' }, value: summary.held, color: 'from-yellow-400 to-yellow-600', icon: <Clock className="w-6 h-6" /> },
    { label: { ar: 'متاح للصرف', en: 'Available' }, value: summary.available, color: 'from-blue-400 to-blue-600', icon: <CheckCircle className="w-6 h-6" /> },
    { label: { ar: 'تم الصرف', en: 'Paid Out' }, value: summary.paid, color: 'from-green-400 to-green-600', icon: <DollarSign className="w-6 h-6" /> },
  ];

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{ar ? 'إدارة الإيرادات' : 'Revenue Management'}</h1>
          <p className="text-gray-500">{ar ? 'متابعة الإيرادات وإعدادات التوزيع' : 'Track revenue and distribution settings'}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} text-white rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 p-2 rounded-xl">{card.icon}</div>
            </div>
            <p className="text-sm text-white/80 mb-1">{card.label[language]}</p>
            <p className="text-2xl font-bold">${card.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'transactions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {ar ? 'المعاملات' : 'Transactions'}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Settings className="w-4 h-4" />
          {ar ? 'إعدادات التوزيع' : 'Distribution Settings'}
        </button>
      </div>

      {activeTab === 'transactions' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={ar ? 'بحث عن مدرب أو دورة...' : 'Search instructor or course...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field ps-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'HELD', 'AVAILABLE', 'PAID', 'REFUNDED'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {s === 'all' ? (ar ? 'الكل' : 'All') : STATUS_CONFIG[s].label[language]}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'المدرب' : 'Instructor'}</th>
                    <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'الدورة' : 'Course'}</th>
                    <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'الإجمالي' : 'Total'}</th>
                    <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'نصيب المدرب' : 'Instructor'}</th>
                    <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'المنصة' : 'Platform'}</th>
                    <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'الحالة' : 'Status'}</th>
                    <th className="text-start py-4 px-5 text-sm font-semibold text-gray-600">{ar ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">{ar ? 'لا توجد معاملات' : 'No transactions found'}</td>
                    </tr>
                  ) : filteredTransactions.map(tx => {
                    const cfg = STATUS_CONFIG[tx.status];
                    return (
                      <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-medium text-gray-900 text-sm">{tx.instructor.name}</div>
                          <div className="text-xs text-gray-400">{tx.instructor.email}</div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="text-sm text-gray-700 max-w-[180px] truncate">{tx.course.title[language]}</div>
                        </td>
                        <td className="py-4 px-5 font-semibold text-gray-900">${tx.totalAmount.toFixed(2)}</td>
                        <td className="py-4 px-5 text-green-600 font-medium">${tx.instructorAmount.toFixed(2)}</td>
                        <td className="py-4 px-5 text-primary-600 font-medium">${tx.platformAmount.toFixed(2)}</td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                            {cfg.icon}
                            {cfg.label[language]}
                          </span>
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
          </div>
        </>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">{ar ? 'إعدادات توزيع الإيرادات' : 'Revenue Distribution Settings'}</h2>

            {/* Share percentages */}
            <div className="space-y-5 mb-8">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'نصيب المدرب (%)' : 'Instructor Share (%)'}</label>
                  <input type="number" min="0" max="100" value={instructorShare} onChange={e => setInstructorShare(e.target.value)} className="input-field" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'نصيب المنصة (%)' : 'Platform Share (%)'}</label>
                  <input type="number" min="0" max="100" value={platformShare} onChange={e => setPlatformShare(e.target.value)} className="input-field" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'نصيب الجهة (%)' : 'Entity Share (%)'}</label>
                  <input type="number" min="0" max="100" value={entityShare} onChange={e => setEntityShare(e.target.value)} className="input-field" />
                </div>
              </div>

              {/* Visual share bar */}
              <div className="h-4 rounded-full overflow-hidden flex gap-0.5 bg-gray-100">
                <div className="bg-green-500 transition-all" style={{ width: `${instructorShare}%` }} title={`${ar ? 'المدرب' : 'Instructor'}: ${instructorShare}%`} />
                <div className="bg-primary-500 transition-all" style={{ width: `${platformShare}%` }} title={`${ar ? 'المنصة' : 'Platform'}: ${platformShare}%`} />
                <div className="bg-orange-500 transition-all" style={{ width: `${entityShare}%` }} title={`${ar ? 'الجهة' : 'Entity'}: ${entityShare}%`} />
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full" />{ar ? 'المدرب' : 'Instructor'} {instructorShare}%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary-500 rounded-full" />{ar ? 'المنصة' : 'Platform'} {platformShare}%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full" />{ar ? 'الجهة' : 'Entity'} {entityShare}%</span>
              </div>
              <p className={`text-sm font-medium ${Math.abs(parseFloat(instructorShare || '0') + parseFloat(platformShare || '0') + parseFloat(entityShare || '0') - 100) < 0.1 ? 'text-green-600' : 'text-red-500'}`}>
                {ar ? 'المجموع: ' : 'Total: '}{(parseFloat(instructorShare || '0') + parseFloat(platformShare || '0') + parseFloat(entityShare || '0')).toFixed(0)}%
              </p>
            </div>

            {/* Other settings */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'الحد الأدنى للصرف ($)' : 'Min Payout ($)'}</label>
                <input type="number" min="0" value={minPayoutAmount} onChange={e => setMinPayoutAmount(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'دورة الصرف (أيام)' : 'Payout Cycle (days)'}</label>
                <input type="number" min="1" value={payoutCycleDays} onChange={e => setPayoutCycleDays(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ar ? 'مدة الاحتجاز (أيام)' : 'Hold Period (days)'}</label>
                <input type="number" min="0" value={refundBufferDays} onChange={e => setRefundBufferDays(e.target.value)} className="input-field" />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="btn-primary flex items-center gap-2"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {ar ? 'حفظ الإعدادات' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
