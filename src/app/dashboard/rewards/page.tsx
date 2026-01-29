'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Trophy,
  Star,
  Flame,
  Target,
  Award,
  TrendingUp,
  Gift,
  Crown,
  Zap,
  BookOpen,
  Clock,
  Calendar,
  ChevronRight,
  Loader2,
  Lock,
} from 'lucide-react';

interface UserPoints {
  totalPoints: number;
  level: number;
  streak: number;
  nextLevelPoints: number;
  currentLevelProgress: number;
  recentTransactions: {
    id: string;
    points: number;
    type: string;
    description: string;
    createdAt: string;
  }[];
}

interface Badge {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  category: string;
  earnedAt?: string;
  isEarned: boolean;
}

interface Achievement {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  target: number;
  progress: number;
  isCompleted: boolean;
  completedAt?: string;
}

export default function RewardsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'achievements' | 'history'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pointsRes, badgesRes, achievementsRes] = await Promise.all([
        fetch('/api/gamification/points'),
        fetch('/api/gamification/badges'),
        fetch('/api/gamification/achievements'),
      ]);

      const pointsData = await pointsRes.json();
      const badgesData = await badgesRes.json();
      const achievementsData = await achievementsRes.json();

      if (pointsData.success) setUserPoints(pointsData.data);
      if (badgesData.success) {
        // API returns { badges, groupedBadges, earnedCount, totalCount }
        const badgesList = badgesData.data?.badges || [];
        setBadges(badgesList.map((b: any) => ({
          ...b,
          isEarned: b.earned || false,
        })));
      }
      if (achievementsData.success) {
        const achievementsList = achievementsData.data?.achievements || achievementsData.data || [];
        setAchievements(Array.isArray(achievementsList) ? achievementsList : []);
      }
    } catch (err) {
      console.error('Error fetching rewards data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (level: number) => {
    const levels = [
      { name: { ar: 'مبتدئ', en: 'Beginner' }, color: 'bg-gray-500', icon: Star },
      { name: { ar: 'متعلم', en: 'Learner' }, color: 'bg-green-500', icon: BookOpen },
      { name: { ar: 'متقدم', en: 'Advanced' }, color: 'bg-blue-500', icon: TrendingUp },
      { name: { ar: 'خبير', en: 'Expert' }, color: 'bg-purple-500', icon: Award },
      { name: { ar: 'أسطورة', en: 'Legend' }, color: 'bg-yellow-500', icon: Crown },
    ];
    return levels[Math.min(level - 1, levels.length - 1)] || levels[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'COURSE_COMPLETION': return BookOpen;
      case 'QUIZ_PASS': return Target;
      case 'DAILY_LOGIN': return Calendar;
      case 'STREAK_BONUS': return Flame;
      case 'FIRST_ENROLLMENT': return Star;
      default: return Gift;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  const levelInfo = getLevelInfo(userPoints?.level || 1);
  const LevelIcon = levelInfo.icon;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Level Card */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white col-span-2">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 ${levelInfo.color} rounded-2xl flex items-center justify-center`}>
                <LevelIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-primary-200 text-sm">
                  {language === 'ar' ? 'المستوى' : 'Level'} {userPoints?.level}
                </p>
                <h2 className="text-2xl font-bold">
                  {language === 'ar' ? levelInfo.name.ar : levelInfo.name.en}
                </h2>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>{userPoints?.totalPoints.toLocaleString()} XP</span>
                <span>{userPoints?.nextLevelPoints.toLocaleString()} XP</span>
              </div>
              <div className="h-3 bg-primary-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${userPoints?.currentLevelProgress || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">
                  {language === 'ar' ? 'التتابع' : 'Streak'}
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {userPoints?.streak || 0} {language === 'ar' ? 'يوم' : 'days'}
                </h3>
              </div>
            </div>
          </div>

          {/* Total Points */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">
                  {language === 'ar' ? 'إجمالي النقاط' : 'Total Points'}
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {userPoints?.totalPoints.toLocaleString() || 0}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="flex">
              {[
                { id: 'overview', label: { ar: 'نظرة عامة', en: 'Overview' }, icon: Trophy },
                { id: 'badges', label: { ar: 'الشارات', en: 'Badges' }, icon: Award },
                { id: 'achievements', label: { ar: 'الإنجازات', en: 'Achievements' }, icon: Target },
                { id: 'history', label: { ar: 'السجل', en: 'History' }, icon: Clock },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{language === 'ar' ? tab.label.ar : tab.label.en}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Badges */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                    {language === 'ar' ? 'آخر الشارات' : 'Recent Badges'}
                    <button
                      onClick={() => setActiveTab('badges')}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      {language === 'ar' ? 'عرض الكل' : 'View all'}
                    </button>
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {badges.filter(b => b.isEarned).slice(0, 4).map((badge) => (
                      <div
                        key={badge.id}
                        className="aspect-square bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl flex items-center justify-center relative group"
                      >
                        <span className="text-3xl">{badge.icon}</span>
                        <div className="absolute inset-0 bg-black/75 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                          <p className="text-white text-xs text-center">
                            {language === 'ar' ? badge.nameAr : badge.nameEn}
                          </p>
                        </div>
                      </div>
                    ))}
                    {badges.filter(b => b.isEarned).length === 0 && (
                      <p className="col-span-4 text-center text-gray-500 py-4">
                        {language === 'ar' ? 'لم تحصل على شارات بعد' : 'No badges earned yet'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Active Achievements */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                    {language === 'ar' ? 'الإنجازات الجارية' : 'Active Achievements'}
                    <button
                      onClick={() => setActiveTab('achievements')}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      {language === 'ar' ? 'عرض الكل' : 'View all'}
                    </button>
                  </h3>
                  <div className="space-y-3">
                    {achievements.filter(a => !a.isCompleted).slice(0, 3).map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {language === 'ar' ? achievement.titleAr : achievement.titleEn}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-600 rounded-full"
                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {achievement.progress}/{achievement.target}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`relative p-4 rounded-xl text-center transition-all ${
                      badge.isEarned
                        ? 'bg-gradient-to-br from-yellow-100 to-yellow-50 shadow-sm'
                        : 'bg-gray-100 opacity-50'
                    }`}
                  >
                    {!badge.isEarned && (
                      <div className="absolute top-2 end-2">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <span className="text-4xl block mb-2">{badge.icon}</span>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {language === 'ar' ? badge.nameAr : badge.nameEn}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'ar' ? badge.descriptionAr : badge.descriptionEn}
                    </p>
                    {badge.isEarned && badge.earnedAt && (
                      <p className="text-xs text-primary-600 mt-2">
                        {formatDate(badge.earnedAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      achievement.isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <span className="text-3xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {language === 'ar' ? achievement.titleAr : achievement.titleEn}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {language === 'ar' ? achievement.descriptionAr : achievement.descriptionEn}
                      </p>
                      {!achievement.isCompleted && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 rounded-full transition-all"
                              style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {achievement.progress}/{achievement.target}
                          </span>
                        </div>
                      )}
                    </div>
                    {achievement.isCompleted && (
                      <div className="text-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-green-600" />
                        </div>
                        {achievement.completedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            {formatDate(achievement.completedAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {userPoints?.recentTransactions?.map((transaction) => {
                  const TransactionIcon = getTransactionIcon(transaction.type);
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <TransactionIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                      <span className={`font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points} XP
                      </span>
                    </div>
                  );
                })}
                {(!userPoints?.recentTransactions || userPoints.recentTransactions.length === 0) && (
                  <p className="text-center text-gray-500 py-8">
                    {language === 'ar' ? 'لا يوجد سجل بعد' : 'No history yet'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
