'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Globe,
  BarChart3,
  GraduationCap,
  UserCheck,
  FolderTree,
  ShoppingCart,
  Shield,
  AlertTriangle,
  Ban,
  Activity,
  Eye,
  RefreshCw,
  Plus,
  CheckCircle,
  Lock,
  Server,
  Loader2,
  FileQuestion,
  CreditCard,
  BookMarked,
} from 'lucide-react';

interface SecurityStats {
  overview: {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    totalEvents24h: number;
    blockedRequests24h: number;
    authFailures24h: number;
    wafBlocks24h: number;
    botDetections24h: number;
  };
  blockedIPs: {
    active: number;
    total: number;
  };
  accountLockouts: {
    active: number;
  };
  topOffendingIPs: Array<{ ip: string; count: number }>;
  eventTypeDistribution: Array<{ eventType: string; count: number }>;
}

interface SecurityLog {
  id: string;
  eventType: string;
  severity: string;
  ip: string;
  endpoint: string;
  method: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface BlockedIP {
  id: string;
  ip: string;
  reason: string;
  blockedUntil?: string;
  isPermanent: boolean;
  createdAt: string;
}

export default function SecurityPage() {
  const { language, setLanguage } = useLanguage();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'blocked'>('overview');

  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newBlock, setNewBlock] = useState({ ip: '', reason: '', duration: 24, isPermanent: false });

  const [logFilter, setLogFilter] = useState({ eventType: '', severity: '' });

  // التحقق من صلاحية الأدمن
  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [user, router, authLoading]);

  // جلب البيانات
  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchLogs(), fetchBlockedIPs()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/security/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (logFilter.eventType) params.append('eventType', logFilter.eventType);
      if (logFilter.severity) params.append('severity', logFilter.severity);

      const res = await fetch(`/api/admin/security/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setLogs(data.data?.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchBlockedIPs = async () => {
    try {
      const res = await fetch('/api/admin/security/blocked-ips', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setBlockedIPs(data.data?.blockedIPs || []);
      }
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
    }
  };

  const handleBlockIP = async () => {
    try {
      const res = await fetch('/api/admin/security/blocked-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newBlock),
      });
      if (res.ok) {
        setShowBlockModal(false);
        setNewBlock({ ip: '', reason: '', duration: 24, isPermanent: false });
        fetchBlockedIPs();
      }
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      const res = await fetch(`/api/admin/security/blocked-ips?ip=${ip}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchBlockedIPs();
      }
    } catch (error) {
      console.error('Error unblocking IP:', error);
    }
  };

  const adminMenuItems = [
    { href: '/admin', icon: LayoutDashboard, label: { ar: 'لوحة التحكم', en: 'Dashboard' } },
    { href: '/admin/courses', icon: BookOpen, label: { ar: 'الدورات', en: 'Courses' } },
    { href: '/admin/books', icon: BookMarked, label: { ar: 'الكتب', en: 'Books' } },
    { href: '/admin/quizzes', icon: FileQuestion, label: { ar: 'الاختبارات', en: 'Quizzes' } },
    { href: '/admin/quiz-results', icon: BarChart3, label: { ar: 'نتائج الاختبارات', en: 'Quiz Results' } },
    { href: '/admin/categories', icon: FolderTree, label: { ar: 'التصنيفات', en: 'Categories' } },
    { href: '/admin/orders', icon: ShoppingCart, label: { ar: 'طلبات الدورات', en: 'Course Orders' } },
    { href: '/admin/book-orders', icon: BookMarked, label: { ar: 'طلبات الكتب', en: 'Book Orders' } },
    { href: '/admin/payment-settings', icon: CreditCard, label: { ar: 'إعدادات الدفع', en: 'Payment Settings' } },
    { href: '/admin/users', icon: Users, label: { ar: 'المستخدمين', en: 'Users' } },
    { href: '/admin/instructors', icon: GraduationCap, label: { ar: 'المدربين', en: 'Instructors' } },
    { href: '/admin/enrollments', icon: UserCheck, label: { ar: 'التسجيلات', en: 'Enrollments' } },
    { href: '/admin/security', icon: Shield, label: { ar: 'الأمان', en: 'Security' } },
    { href: '/admin/settings', icon: Settings, label: { ar: 'الإعدادات', en: 'Settings' } },
  ];

  const isActive = (href: string) => pathname === href;

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getEventLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      waf_block: { ar: 'حظر WAF', en: 'WAF Block' },
      authentication_failure: { ar: 'فشل تسجيل الدخول', en: 'Auth Failure' },
      bot_detected: { ar: 'بوت مكتشف', en: 'Bot Detected' },
      rate_limit_exceeded: { ar: 'تجاوز الحد', en: 'Rate Limited' },
      account_locked: { ar: 'حساب مقفل', en: 'Account Locked' },
      anomaly_detected: { ar: 'نشاط مشبوه', en: 'Anomaly' },
    };
    return labels[type]?.[language] || type;
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
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 start-0 z-50 h-full w-72 bg-gray-900 transform transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-xl text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
          {adminMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.href)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label[language]}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 start-0 end-0 p-4 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <Globe className="w-5 h-5" />
            <span className="font-medium">
              {language === 'ar' ? 'العودة للموقع' : 'Back to Site'}
            </span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-900/20 transition-all mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ms-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <Globe className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2 ps-2 ms-2 border-s border-gray-200">
                <img
                  src={user?.avatar || 'https://via.placeholder.com/40'}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'مركز الأمان' : 'Security Center'}
                </h1>
                <p className="text-gray-500">
                  {language === 'ar' ? 'مراقبة وحماية النظام' : 'Monitor and protect the system'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
            >
              <RefreshCw className="w-4 h-4" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
          </div>

          {/* Threat Level Banner */}
          {stats && (
            <div className={`${getThreatColor(stats.overview.threatLevel)} rounded-2xl p-6 text-white mb-8`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="w-8 h-8" />
                  <div>
                    <h3 className="text-lg font-bold">
                      {language === 'ar' ? 'مستوى التهديد:' : 'Threat Level:'}{' '}
                      {stats.overview.threatLevel.toUpperCase()}
                    </h3>
                    <p className="opacity-90">
                      {stats.overview.blockedRequests24h} {language === 'ar' ? 'طلب محظور في آخر 24 ساعة' : 'blocked requests in last 24h'}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-3xl font-bold">{stats.overview.totalEvents24h}</p>
                  <p className="opacity-90">{language === 'ar' ? 'إجمالي الأحداث' : 'Total Events'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Activity className="w-4 h-4 inline-block ml-2" />
              {language === 'ar' ? 'نظرة عامة' : 'Overview'}
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Eye className="w-4 h-4 inline-block ml-2" />
              {language === 'ar' ? 'السجلات' : 'Logs'}
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'blocked'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Ban className="w-4 h-4 inline-block ml-2" />
              {language === 'ar' ? 'المحظورين' : 'Blocked'}
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Ban className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.overview.blockedRequests24h}</div>
                  <div className="text-sm text-gray-500">{language === 'ar' ? 'طلبات محظورة' : 'Blocked Requests'}</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Lock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.overview.authFailures24h}</div>
                  <div className="text-sm text-gray-500">{language === 'ar' ? 'فشل دخول' : 'Auth Failures'}</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.overview.wafBlocks24h}</div>
                  <div className="text-sm text-gray-500">WAF Blocks</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Server className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.overview.botDetections24h}</div>
                  <div className="text-sm text-gray-500">{language === 'ar' ? 'بوتات مكتشفة' : 'Bots Detected'}</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Top Offending IPs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">
                      {language === 'ar' ? 'أكثر IPs نشاطاً مشبوهاً' : 'Top Suspicious IPs'}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {stats.topOffendingIPs?.length > 0 ? (
                      stats.topOffendingIPs.slice(0, 5).map((item, index) => (
                        <div key={item.ip} className="flex items-center justify-between p-4 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold">
                              {index + 1}
                            </span>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.ip}</code>
                          </div>
                          <span className="text-sm font-medium text-red-600">{item.count} {language === 'ar' ? 'حدث' : 'events'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">
                      {language === 'ar' ? 'توزيع الأحداث' : 'Event Distribution'}
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {stats.eventTypeDistribution?.length > 0 ? (
                      stats.eventTypeDistribution.map((item) => (
                        <div key={item.eventType} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{getEventLabel(item.eventType)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, (item.count / (stats.overview.totalEvents24h || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-10 text-end">{item.count}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500">
                        {language === 'ar' ? 'لا توجد بيانات' : 'No data'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4">
                <select
                  value={logFilter.eventType}
                  onChange={(e) => setLogFilter({ ...logFilter, eventType: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-xl"
                >
                  <option value="">{language === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
                  <option value="waf_block">WAF Block</option>
                  <option value="authentication_failure">Auth Failure</option>
                  <option value="bot_detected">Bot Detected</option>
                  <option value="rate_limit_exceeded">Rate Limited</option>
                </select>
                <select
                  value={logFilter.severity}
                  onChange={(e) => setLogFilter({ ...logFilter, severity: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-xl"
                >
                  <option value="">{language === 'ar' ? 'كل الخطورة' : 'All Severity'}</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                <button
                  onClick={fetchLogs}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                >
                  <Search className="w-4 h-4 inline-block ml-1" />
                  {language === 'ar' ? 'بحث' : 'Search'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-gray-600 text-sm">
                    <tr>
                      <th className="text-start p-4 font-semibold">{language === 'ar' ? 'الوقت' : 'Time'}</th>
                      <th className="text-start p-4 font-semibold">{language === 'ar' ? 'النوع' : 'Type'}</th>
                      <th className="text-start p-4 font-semibold">{language === 'ar' ? 'الخطورة' : 'Severity'}</th>
                      <th className="text-start p-4 font-semibold">IP</th>
                      <th className="text-start p-4 font-semibold">Endpoint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="p-4 text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                          </td>
                          <td className="p-4 text-sm font-medium">{getEventLabel(log.eventType)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getSeverityBadge(log.severity)}`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="p-4">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{log.ip}</code>
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                            <span className="font-mono">{log.method}</span> {log.endpoint}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          {language === 'ar' ? 'لا توجد سجلات' : 'No logs found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Blocked IPs Tab */}
          {activeTab === 'blocked' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">
                  {language === 'ar' ? 'عناوين IP المحظورة' : 'Blocked IP Addresses'} ({blockedIPs.length})
                </h3>
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'حظر IP' : 'Block IP'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-gray-600 text-sm">
                    <tr>
                      <th className="text-start p-4 font-semibold">IP</th>
                      <th className="text-start p-4 font-semibold">{language === 'ar' ? 'السبب' : 'Reason'}</th>
                      <th className="text-start p-4 font-semibold">{language === 'ar' ? 'النوع' : 'Type'}</th>
                      <th className="text-start p-4 font-semibold">{language === 'ar' ? 'تاريخ الحظر' : 'Blocked At'}</th>
                      <th className="text-center p-4 font-semibold">{language === 'ar' ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {blockedIPs.length > 0 ? (
                      blockedIPs.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <code className="text-sm bg-red-50 text-red-700 px-2 py-1 rounded">{item.ip}</code>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{item.reason}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${item.isPermanent ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {item.isPermanent ? (language === 'ar' ? 'دائم' : 'Permanent') : (language === 'ar' ? 'مؤقت' : 'Temporary')}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleUnblockIP(item.ip)}
                              className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1 mx-auto"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {language === 'ar' ? 'إلغاء' : 'Unblock'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          {language === 'ar' ? 'لا توجد عناوين محظورة' : 'No blocked IPs'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Block IP Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{language === 'ar' ? 'حظر عنوان IP' : 'Block IP Address'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP</label>
                <input
                  type="text"
                  value={newBlock.ip}
                  onChange={(e) => setNewBlock({ ...newBlock, ip: e.target.value })}
                  placeholder="192.168.1.1"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'السبب' : 'Reason'}
                </label>
                <input
                  type="text"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="permanent"
                  checked={newBlock.isPermanent}
                  onChange={(e) => setNewBlock({ ...newBlock, isPermanent: e.target.checked })}
                />
                <label htmlFor="permanent" className="text-sm">{language === 'ar' ? 'حظر دائم' : 'Permanent block'}</label>
              </div>
              {!newBlock.isPermanent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'ar' ? 'المدة (ساعات)' : 'Duration (hours)'}
                  </label>
                  <input
                    type="number"
                    value={newBlock.duration}
                    onChange={(e) => setNewBlock({ ...newBlock, duration: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleBlockIP}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                {language === 'ar' ? 'حظر' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
