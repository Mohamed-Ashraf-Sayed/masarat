'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ikUrl } from '@/lib/imagekit';
import { Trophy, Calendar, Users } from 'lucide-react';

interface CompetitionParticipation {
  id: string;
  score?: number;
  rank?: number;
  competition: {
    id: string;
    titleAr: string;
    titleEn: string;
    image?: string;
    startDate: string;
    endDate: string;
    status: string;
    mode: string;
  };
  team?: { id: string; name: string };
}

const STATUS_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  OPEN: { ar: 'مفتوحة', en: 'Open', color: 'bg-green-100 text-green-800' },
  JUDGING: { ar: 'قيد التحكيم', en: 'Judging', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { ar: 'مكتملة', en: 'Completed', color: 'bg-blue-100 text-blue-800' },
  DRAFT: { ar: 'مسودة', en: 'Draft', color: 'bg-gray-100 text-gray-800' },
};

export default function DashboardCompetitionsPage() {
  const { token } = useAuth();
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [participations, setParticipations] = useState<CompetitionParticipation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/dashboard/competitions', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setParticipations(data.data); })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={ar ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <Trophy className="w-7 h-7 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900">{ar ? 'مسابقاتي' : 'My Competitions'}</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto"></div>
          </div>
        ) : participations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{ar ? 'لم تشارك في أي مسابقة بعد' : 'No competitions joined yet'}</h3>
            <Link href="/competitions" className="text-yellow-600 hover:underline text-sm">{ar ? 'تصفح المسابقات' : 'Browse Competitions'}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {participations.map(p => {
              const cfg = STATUS_CONFIG[p.competition.status];
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-36 bg-gradient-to-br from-yellow-100 to-orange-200 relative">
                    {p.competition.image ? (
                      <img src={ikUrl(p.competition.image, { width: 600 })} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="w-12 h-12 text-yellow-500" />
                      </div>
                    )}
                    {cfg && (
                      <span className={`absolute top-3 start-3 text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {ar ? cfg.ar : cfg.en}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{ar ? p.competition.titleAr : p.competition.titleEn}</h3>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(p.competition.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{p.competition.mode === 'TEAM' ? (ar ? 'فرق' : 'Team') : (ar ? 'فردي' : 'Individual')}</span>
                      </div>
                      {p.team && (
                        <div className="text-xs text-purple-600 font-medium">{ar ? 'الفريق:' : 'Team:'} {p.team.name}</div>
                      )}
                    </div>

                    {p.rank && (
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${p.rank === 1 ? 'bg-yellow-400 text-white' : p.rank === 2 ? 'bg-gray-400 text-white' : p.rank === 3 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-700'}`}>
                          #{p.rank}
                        </span>
                        {p.score != null && <span className="text-sm text-gray-500">{p.score} pts</span>}
                      </div>
                    )}

                    <Link href={`/competitions/${p.competition.id}`} className="block text-center text-sm py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      {ar ? 'عرض المسابقة' : 'View Competition'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
