'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  MessageSquare,
  Users,
  TrendingUp,
  Search,
  Plus,
  Clock,
  Eye,
  MessageCircle,
  ThumbsUp,
  Loader2,
  ChevronRight,
  User,
  Pin,
  Lock,
} from 'lucide-react';

interface Forum {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string | null;
  color: string | null;
  _count: {
    threads: number;
  };
}

interface Thread {
  id: string;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  viewsCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  _count: {
    posts: number;
  };
}

export default function CommunityPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchForums();
  }, []);

  useEffect(() => {
    if (selectedForum) {
      fetchThreads(selectedForum.id);
    }
  }, [selectedForum]);

  const fetchForums = async () => {
    try {
      const res = await fetch('/api/forums');
      const data = await res.json();
      if (data.success) {
        setForums(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching forums:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async (forumId: string) => {
    try {
      const res = await fetch(`/api/forums/${forumId}/threads`);
      const data = await res.json();
      if (data.success) {
        setThreads(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching threads:', err);
    }
  };

  const createThread = async () => {
    if (!selectedForum || !newThread.title.trim() || !newThread.content.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`/api/forums/${selectedForum.id}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThread),
      });
      const data = await res.json();
      if (data.success) {
        setThreads([data.data, ...threads]);
        setShowNewThreadModal(false);
        setNewThread({ title: '', content: '' });
      }
    } catch (err) {
      console.error('Error creating thread:', err);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getForumColor = (color: string | null) => {
    return color || 'bg-primary-100 text-primary-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="flex items-center justify-center min-h-[600px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="solid" />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {language === 'ar' ? 'مجتمع المتعلمين' : 'Learning Community'}
          </h1>
          <p className="text-primary-100 text-lg max-w-2xl mx-auto">
            {language === 'ar'
              ? 'تواصل مع المتعلمين والمدربين، اطرح أسئلتك، وشارك معرفتك'
              : 'Connect with learners and instructors, ask questions, and share your knowledge'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Forums List */}
          <div className="lg:w-80">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">
                  {language === 'ar' ? 'المنتديات' : 'Forums'}
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {forums.map((forum) => (
                  <button
                    key={forum.id}
                    onClick={() => setSelectedForum(forum)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-start ${
                      selectedForum?.id === forum.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getForumColor(forum.color)}`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">
                        {language === 'ar' ? forum.nameAr : forum.nameEn}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {forum._count.threads} {language === 'ar' ? 'موضوع' : 'threads'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {selectedForum ? (
              <>
                {/* Forum Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {language === 'ar' ? selectedForum.nameAr : selectedForum.nameEn}
                      </h1>
                      <p className="text-gray-500 mt-1">
                        {language === 'ar' ? selectedForum.descriptionAr : selectedForum.descriptionEn}
                      </p>
                    </div>
                    {user && (
                      <button
                        onClick={() => setShowNewThreadModal(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        {language === 'ar' ? 'موضوع جديد' : 'New Thread'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? 'البحث في المواضيع...' : 'Search threads...'}
                    className="w-full ps-12 pe-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Threads List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {threads.length > 0 ? (
                      threads
                        .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((thread) => (
                          <Link
                            key={thread.id}
                            href={`/community/thread/${thread.id}`}
                            className="block p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              {thread.author.avatar ? (
                                <img
                                  src={thread.author.avatar}
                                  alt={thread.author.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-gray-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {thread.isPinned && (
                                    <Pin className="w-4 h-4 text-primary-600" />
                                  )}
                                  {thread.isLocked && (
                                    <Lock className="w-4 h-4 text-gray-400" />
                                  )}
                                  <h3 className="font-semibold text-gray-900 truncate">
                                    {thread.title}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                  <span>{thread.author.name}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatDate(thread.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  {thread._count.posts}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {thread.viewsCount}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))
                    ) : (
                      <div className="p-12 text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>{language === 'ar' ? 'لا توجد مواضيع بعد' : 'No threads yet'}</p>
                        {user && (
                          <button
                            onClick={() => setShowNewThreadModal(true)}
                            className="mt-4 text-primary-600 hover:text-primary-700"
                          >
                            {language === 'ar' ? 'كن أول من يبدأ النقاش' : 'Be the first to start a discussion'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Forums Overview */
              <div className="grid md:grid-cols-2 gap-6">
                {forums.map((forum) => (
                  <button
                    key={forum.id}
                    onClick={() => setSelectedForum(forum)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all text-start"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getForumColor(forum.color)}`}>
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {language === 'ar' ? forum.nameAr : forum.nameEn}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {language === 'ar' ? forum.descriptionAr : forum.descriptionEn}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {forum._count.threads} {language === 'ar' ? 'موضوع' : 'threads'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'موضوع جديد' : 'New Thread'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={language === 'ar' ? 'عنوان الموضوع...' : 'Thread title...'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'المحتوى' : 'Content'}
                </label>
                <textarea
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder={language === 'ar' ? 'اكتب محتوى الموضوع...' : 'Write your post content...'}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={createThread}
                disabled={creating || !newThread.title.trim() || !newThread.content.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-5 h-5 animate-spin" />}
                {language === 'ar' ? 'نشر' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
