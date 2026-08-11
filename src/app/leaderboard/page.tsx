'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { ikUrl } from '@/lib/imagekit';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Flame,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Minus,
  Loader2,
  User,
} from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  totalPoints: number;
  level: number;
  streak: number;
  rank: number;
  previousRank?: number;
}

export default function LeaderboardPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gamification/leaderboard?timeframe=${timeframe}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.data.leaderboard || []);
        setUserRank(data.data.userRank || null);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const diff = previous - current;
    if (diff > 0) {
      return (
        <span className="flex items-center text-green-600 text-sm">
          <ChevronUp className="w-4 h-4" />
          {diff}
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center text-red-600 text-sm">
          <ChevronDown className="w-4 h-4" />
          {Math.abs(diff)}
        </span>
      );
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default:
        return 'bg-white border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="solid" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {language === 'ar' ? 'قائمة المتصدرين' : 'Leaderboard'}
          </h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            {language === 'ar'
              ? 'تنافس مع المتعلمين الآخرين واحصل على المرتبة الأولى'
              : 'Compete with other learners and reach the top'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Timeframe Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { id: 'all', label: { ar: 'الكل', en: 'All Time' } },
            { id: 'month', label: { ar: 'هذا الشهر', en: 'This Month' } },
            { id: 'week', label: { ar: 'هذا الأسبوع', en: 'This Week' } },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeframe(tab.id as any)}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                timeframe === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {language === 'ar' ? tab.label.ar : tab.label.en}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="flex justify-center items-end gap-4 mb-12">
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="relative mb-3">
                    {leaderboard[1].avatar ? (
                      <img
                        src={ikUrl(leaderboard[1].avatar, { width: 100 })}
                        alt={leaderboard[1].name}
                        className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-gray-300"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto border-4 border-gray-300">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                      2
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{leaderboard[1].name}</h3>
                  <p className="text-sm text-gray-500">{leaderboard[1].totalPoints.toLocaleString()} XP</p>
                  <div className="w-24 h-24 bg-gray-200 rounded-t-lg mx-auto mt-3"></div>
                </div>

                {/* 1st Place */}
                <div className="text-center -mb-8">
                  <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                  <div className="relative mb-3">
                    {leaderboard[0].avatar ? (
                      <img
                        src={ikUrl(leaderboard[0].avatar, { width: 100 })}
                        alt={leaderboard[0].name}
                        className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-yellow-400"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto border-4 border-yellow-400">
                        <User className="w-10 h-10 text-yellow-600" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                      1
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{leaderboard[0].name}</h3>
                  <p className="text-sm text-primary-600 font-medium">{leaderboard[0].totalPoints.toLocaleString()} XP</p>
                  <div className="w-24 h-32 bg-yellow-400 rounded-t-lg mx-auto mt-3"></div>
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <div className="relative mb-3">
                    {leaderboard[2].avatar ? (
                      <img
                        src={ikUrl(leaderboard[2].avatar, { width: 100 })}
                        alt={leaderboard[2].name}
                        className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-amber-500"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto border-4 border-amber-500">
                        <User className="w-8 h-8 text-amber-600" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                      3
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{leaderboard[2].name}</h3>
                  <p className="text-sm text-gray-500">{leaderboard[2].totalPoints.toLocaleString()} XP</p>
                  <div className="w-24 h-16 bg-amber-500 rounded-t-lg mx-auto mt-3"></div>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">
                  {language === 'ar' ? 'الترتيب الكامل' : 'Full Rankings'}
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 transition-colors ${getRankBgColor(entry.rank)} ${
                      user?.id === entry.id ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    <div className="w-8">{getRankChange(entry.rank, entry.previousRank)}</div>

                    {entry.avatar ? (
                      <img
                        src={ikUrl(entry.avatar, { width: 100 })}
                        alt={entry.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                      </div>
                    )}

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {entry.name}
                        {user?.id === entry.id && (
                          <span className="ms-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                            {language === 'ar' ? 'أنت' : 'You'}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {language === 'ar' ? 'المستوى' : 'Level'} {entry.level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          {entry.streak} {language === 'ar' ? 'يوم' : 'days'}
                        </span>
                      </div>
                    </div>

                    <div className="text-end">
                      <p className="font-bold text-primary-600">{entry.totalPoints.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User's Rank (if not in top 50) */}
            {userRank && !leaderboard.find((e) => e.id === user?.id) && (
              <div className="mt-6 bg-primary-50 rounded-2xl p-4 border border-primary-200">
                <p className="text-sm text-primary-600 mb-2">
                  {language === 'ar' ? 'ترتيبك' : 'Your Rank'}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-600">#{userRank.rank}</span>
                  </div>
                  {userRank.avatar ? (
                    <img
                      src={ikUrl(userRank.avatar, { width: 100 })}
                      alt={userRank.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{userRank.name}</h3>
                    <p className="text-sm text-gray-500">
                      {language === 'ar' ? 'المستوى' : 'Level'} {userRank.level}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-primary-600">{userRank.totalPoints.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">XP</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
