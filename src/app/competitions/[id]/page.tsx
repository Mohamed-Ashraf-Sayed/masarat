'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Trophy, Users, Calendar, CheckCircle, ArrowLeft, Award, FileText } from 'lucide-react';

interface Competition {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image?: string;
  mode: string;
  maxTeamSize: number;
  startDate: string;
  endDate: string;
  status: string;
  prizes?: string;
  rules?: string;
  _count: { participants: number; teams: number };
  teams: { id: string; name: string; score?: number; rank?: number; leader: { id: string; name: string } }[];
}

const STATUS_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  DRAFT: { ar: 'مسودة', en: 'Draft', color: 'bg-gray-100 text-gray-800' },
  OPEN: { ar: 'مفتوحة للتسجيل', en: 'Open for Registration', color: 'bg-green-100 text-green-800' },
  JUDGING: { ar: 'قيد التحكيم', en: 'Under Judging', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { ar: 'مكتملة', en: 'Completed', color: 'bg-blue-100 text-blue-800' },
};

export default function CompetitionDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const ar = language === 'ar';

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetch(`/api/competitions/${id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setCompetition(data.data); else router.push('/competitions'); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !token || !competition) return;
    fetch('/api/dashboard/competitions', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setIsJoined(data.data.some((p: any) => p.competition.id === id)); });
  }, [user, token, competition]);

  const handleJoin = async () => {
    if (!user) { router.push('/login'); return; }
    setJoining(true);
    try {
      const res = await fetch(`/api/competitions/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setIsJoined(true);
        setCompetition(prev => prev ? { ...prev, _count: { ...prev._count, participants: prev._count.participants + 1 } } : prev);
      }
    } finally { setJoining(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div></div>;
  if (!competition) return null;

  const cfg = STATUS_CONFIG[competition.status];

  return (
    <div className="min-h-screen bg-gray-50" dir={ar ? 'rtl' : 'ltr'}>
      <Navbar variant="solid" />

      <div className="relative h-64 bg-gradient-to-br from-yellow-500 to-orange-600">
        {competition.image && <img src={competition.image} alt="" className="w-full h-full object-cover opacity-40" />}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 pb-8 w-full">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              {ar ? 'رجوع' : 'Back'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{ar ? competition.titleAr : competition.titleEn}</h1>
              {cfg && <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${cfg.color}`}>{ar ? cfg.ar : cfg.en}</span>}
              <div className="flex flex-wrap gap-4 mt-4 text-gray-600">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(competition.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US')} - {new Date(competition.endDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{competition._count.participants} {ar ? 'مشارك' : 'participants'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>{competition.mode === 'TEAM' ? `${ar ? 'فرق' : 'Teams'} (${ar ? 'حتى' : 'up to'} ${competition.maxTeamSize})` : (ar ? 'فردي' : 'Individual')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4">{ar ? 'نبذة عن المسابقة' : 'About'}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{ar ? competition.descriptionAr : competition.descriptionEn}</p>
            </div>

            {competition.prizes && (
              <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-lg font-bold text-yellow-800">{ar ? 'الجوائز' : 'Prizes'}</h2>
                </div>
                <p className="text-yellow-700 whitespace-pre-line">{competition.prizes}</p>
              </div>
            )}

            {competition.rules && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-bold">{ar ? 'قواعد المسابقة' : 'Rules'}</h2>
                </div>
                <p className="text-gray-600 whitespace-pre-line text-sm">{competition.rules}</p>
              </div>
            )}

            {competition.status === 'COMPLETED' && competition.teams.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold mb-4">{ar ? 'النتائج' : 'Results'}</h2>
                <div className="space-y-2">
                  {competition.teams.slice(0, 10).map((team, idx) => (
                    <div key={team.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {team.rank ?? idx + 1}
                      </span>
                      <span className="font-medium flex-1">{team.name}</span>
                      {team.score != null && <span className="text-gray-500 text-sm">{team.score} pts</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              {isJoined ? (
                <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 rounded-xl py-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{ar ? 'أنت مشارك' : 'You are participating'}</span>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining || competition.status !== 'OPEN'}
                  className="w-full py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? (ar ? 'جاري الانضمام...' : 'Joining...') : competition.status !== 'OPEN' ? (ar ? 'التسجيل مغلق' : 'Registration Closed') : (ar ? 'انضم للمسابقة' : 'Join Competition')}
                </button>
              )}

              {!user && <p className="text-center text-sm text-gray-500 mt-3">{ar ? 'يرجى تسجيل الدخول للمشاركة' : 'Please login to participate'}</p>}

              <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{ar ? 'المشاركون' : 'Participants'}</span>
                  <span className="font-medium">{competition._count.participants}</span>
                </div>
                {competition.mode === 'TEAM' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{ar ? 'الفرق' : 'Teams'}</span>
                    <span className="font-medium">{competition._count.teams}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
