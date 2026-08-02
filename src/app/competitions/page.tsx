'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trophy, Users, Calendar, Search } from 'lucide-react';

interface Competition {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image?: string;
  mode: string;
  startDate: string;
  endDate: string;
  status: string;
  _count: { participants: number; teams: number };
}

const STATUS_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  OPEN: { ar: 'مفتوحة للتسجيل', en: 'Open', color: 'bg-green-100 text-green-800' },
  JUDGING: { ar: 'قيد التحكيم', en: 'Judging', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { ar: 'مكتملة', en: 'Completed', color: 'bg-blue-100 text-blue-800' },
};

export default function CompetitionsPage() {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/competitions?${params}`)
      .then(res => res.json())
      .then(data => { if (data.success) setCompetitions(data.data); })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = competitions.filter(c =>
    c.titleAr.includes(searchQuery) || c.titleEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" dir={ar ? 'rtl' : 'ltr'}>
      <Navbar variant="solid" />

      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-bold mb-4">{ar ? 'المسابقات' : 'Competitions'}</h1>
          <p className="text-xl opacity-80">{ar ? 'شارك في مسابقاتنا وأثبت مهاراتك' : 'Join our competitions and prove your skills'}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ar ? 'ابحث عن مسابقة...' : 'Search competitions...'}
              className="w-full ps-11 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">{ar ? 'كل المسابقات' : 'All Competitions'}</option>
            <option value="OPEN">{ar ? 'مفتوحة' : 'Open'}</option>
            <option value="JUDGING">{ar ? 'قيد التحكيم' : 'Judging'}</option>
            <option value="COMPLETED">{ar ? 'مكتملة' : 'Completed'}</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{ar ? 'لا توجد مسابقات حالياً' : 'No competitions available'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(comp => {
              const cfg = STATUS_CONFIG[comp.status];
              return (
                <Link key={comp.id} href={`/competitions/${comp.id}`} className="group">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="relative h-48 bg-gradient-to-br from-yellow-100 to-orange-200 flex-shrink-0">
                      {comp.image ? (
                        <img src={comp.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Trophy className="w-16 h-16 text-yellow-500" /></div>
                      )}
                      {cfg && <span className={`absolute top-3 start-3 text-xs font-bold px-3 py-1 rounded-full ${cfg.color}`}>{ar ? cfg.ar : cfg.en}</span>}
                      <span className="absolute top-3 end-3 bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                        {comp.mode === 'TEAM' ? (ar ? 'فرق' : 'Teams') : (ar ? 'فردي' : 'Individual')}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-3 group-hover:text-yellow-600 transition-colors line-clamp-2">{ar ? comp.titleAr : comp.titleEn}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4">{ar ? comp.descriptionAr : comp.descriptionEn}</p>
                      <div className="mt-auto space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(comp.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{comp._count.participants} {ar ? 'مشارك' : 'participants'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
