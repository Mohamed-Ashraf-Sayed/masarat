'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ikUrl } from '@/lib/imagekit';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  MessageCircle,
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Loader2,
  Plus,
  ArrowLeft,
  User,
  X,
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
  sender?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  }[];
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId?: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface UserToMessage {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export default function MessagesPage() {
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserToMessage[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [startingConversation, setStartingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const selectedConversationRef = useRef<string | null>(null);
  const pollIntervalRef = useRef(1000); // Start with 1 second
  const lastActivityRef = useRef(Date.now());

  // Keep selectedConversationRef in sync
  useEffect(() => {
    selectedConversationRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  // Get current user from API (not localStorage)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.data) {
          setCurrentUser(data.data);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Adaptive polling - faster when active, slower when idle
  useEffect(() => {
    if (!currentUser) return;

    let messagesPollTimer: NodeJS.Timeout;
    let conversationsPollTimer: NodeJS.Timeout;

    const pollMessages = async () => {
      if (selectedConversationRef.current) {
        const prevCount = lastMessageCountRef.current;
        await fetchMessages(selectedConversationRef.current, true);

        // If new messages arrived, speed up polling
        if (lastMessageCountRef.current > prevCount) {
          pollIntervalRef.current = 1000; // Fast: 1 second
          lastActivityRef.current = Date.now();
        } else {
          // Gradually slow down if no activity (max 5 seconds)
          const idleTime = Date.now() - lastActivityRef.current;
          if (idleTime > 30000) {
            pollIntervalRef.current = Math.min(pollIntervalRef.current + 500, 5000);
          }
        }
      }
      messagesPollTimer = setTimeout(pollMessages, pollIntervalRef.current);
    };

    const pollConversations = async () => {
      await fetchConversations(false);
      // Conversations poll every 3 seconds
      conversationsPollTimer = setTimeout(pollConversations, 3000);
    };

    // Start polling
    messagesPollTimer = setTimeout(pollMessages, pollIntervalRef.current);
    conversationsPollTimer = setTimeout(pollConversations, 3000);

    // Speed up polling when user is typing or active
    const handleActivity = () => {
      pollIntervalRef.current = 1000;
      lastActivityRef.current = Date.now();
    };

    // Listen for user activity
    window.addEventListener('focus', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);

    return () => {
      clearTimeout(messagesPollTimer);
      clearTimeout(conversationsPollTimer);
      window.removeEventListener('focus', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
    };
  }, [currentUser]);

  // Fetch conversations
  useEffect(() => {
    if (currentUser) {
      fetchConversations(true);
    }
  }, [currentUser]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (selectedConversation && currentUser) {
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation, currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      scrollToBottom();
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async (isInitial = false) => {
    try {
      const res = await fetch('/api/messages', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  const fetchMessages = async (conversationId: string, silent = false) => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const newMessages = data.data?.messages || [];
        setMessages(newMessages);
      }
    } catch (err) {
      if (!silent) console.error('Error fetching messages:', err);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/messages/${conversationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      // Update unread count locally
      setConversations(convs =>
        convs.map(c =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/users?limit=50&_t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        const allUsers = data.data?.users || data.data || [];
        const users = allUsers.filter(
          (u: any) => u.id !== currentUser?.id
        );
        setAvailableUsers(users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const startNewConversation = async (recipientId: string) => {
    setStartingConversation(true);
    setError(null);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientId,
          content: language === 'ar' ? 'مرحباً!' : 'Hello!',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewChatModal(false);
        setUserSearchQuery('');
        await fetchConversations();
        // Find and select the conversation
        setTimeout(() => {
          const conv = conversations.find(c =>
            c.participants.some(p => p.id === recipientId)
          );
          if (conv) {
            setSelectedConversation(conv);
            setShowMobileChat(true);
          }
        }, 500);
      } else {
        setError(data.error || (language === 'ar' ? 'حدث خطأ' : 'An error occurred'));
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(language === 'ar' ? 'فشل في بدء المحادثة' : 'Failed to start conversation');
    } finally {
      setStartingConversation(false);
    }
  };

  const openNewChatModal = () => {
    setShowNewChatModal(true);
    setError(null);
    setUserSearchQuery('');
    fetchAvailableUsers();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: currentUser.id,
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar || null,
      },
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const res = await fetch(`/api/messages/${selectedConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: messageContent }),
      });
      const data = await res.json();
      if (data.success) {
        // Replace temp message with real one
        setMessages(prev =>
          prev.map(m => m.id === tempMessage.id ? data.data : m)
        );
        // Update conversation
        setConversations(convs =>
          convs.map(c =>
            c.id === selectedConversation.id
              ? {
                  ...c,
                  lastMessage: {
                    id: data.data.id,
                    content: data.data.content,
                    createdAt: data.data.createdAt,
                    senderId: data.data.senderId,
                  },
                  updatedAt: new Date().toISOString()
                }
              : c
          )
        );
      } else {
        // Remove failed message
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setNewMessage(messageContent);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return language === 'ar' ? 'أمس' : 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredConversations = conversations.filter(c => {
    const participant = c.participants?.[0];
    return participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
  });

  // Sort conversations by last message time
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.updatedAt;
    const bTime = b.lastMessage?.createdAt || b.updatedAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  if (loading || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-180px)] flex">
        {/* Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-e border-gray-100 flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {currentUser.avatar ? (
                  <img src={ikUrl(currentUser.avatar, { width: 100 })} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {language === 'ar' ? 'الرسائل' : 'Messages'}
                  </h1>
                  <p className="text-xs text-gray-500">{currentUser.name}</p>
                </div>
              </div>
              <button
                onClick={openNewChatModal}
                className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'البحث في المحادثات...' : 'Search conversations...'}
                className="w-full ps-10 pe-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {sortedConversations.length > 0 ? (
              sortedConversations.map((conversation) => {
                const participant = conversation.participants?.[0];
                const isSelected = selectedConversation?.id === conversation.id;
                const hasUnread = conversation.unreadCount > 0;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      setShowMobileChat(true);
                    }}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      isSelected ? 'bg-primary-50 border-e-4 border-e-primary-600' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {participant?.avatar ? (
                        <img
                          src={ikUrl(participant.avatar, { width: 100 })}
                          alt={participant.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <span className="absolute bottom-0 end-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="flex-1 min-w-0 text-start">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {participant?.name || 'Unknown'}
                        </h3>
                        <span className={`text-xs ${hasUnread ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                          {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                          {conversation.lastMessage?.senderId === currentUser.id && (
                            <span className="text-gray-400 me-1">
                              {language === 'ar' ? 'أنت: ' : 'You: '}
                            </span>
                          )}
                          {conversation.lastMessage?.content || ''}
                        </p>
                        {hasUnread && (
                          <span className="ms-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full min-w-[20px] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <p className="font-medium">{language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}</p>
                <p className="text-sm mt-1">{language === 'ar' ? 'ابدأ محادثة جديدة' : 'Start a new conversation'}</p>
                <button
                  onClick={openNewChatModal}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  {language === 'ar' ? 'محادثة جديدة' : 'New Chat'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-gray-50 ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {selectedConversation.participants?.[0]?.avatar ? (
                    <img
                      src={ikUrl(selectedConversation.participants[0].avatar, { width: 100 })}
                      alt={selectedConversation.participants[0].name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.participants?.[0]?.name || 'Unknown'}
                    </h2>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {language === 'ar' ? 'متصل الآن' : 'Online'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-xl">
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-xl">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
                      <p className="text-sm">{language === 'ar' ? 'ابدأ المحادثة!' : 'Start the conversation!'}</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = message.senderId === currentUser.id;
                    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId);
                    const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.senderId !== message.senderId;

                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOwn && (
                          <div className="w-8 h-8 flex-shrink-0">
                            {showAvatar && (
                              message.sender?.avatar ? (
                                <img
                                  src={ikUrl(message.sender.avatar, { width: 100 })}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-gray-500" />
                                </div>
                              )
                            )}
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] px-4 py-2 shadow-sm ${
                            isOwn
                              ? `bg-primary-600 text-white ${isLastInGroup ? 'rounded-2xl rounded-ee-md' : 'rounded-2xl'}`
                              : `bg-white text-gray-900 ${isLastInGroup ? 'rounded-2xl rounded-es-md' : 'rounded-2xl'}`
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}>
                            <span className="text-[10px]">
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              message.isRead ? (
                                <CheckCheck className="w-4 h-4 text-blue-300" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                    <Smile className="w-6 h-6" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
                    <Paperclip className="w-6 h-6" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type a message...'}
                    className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'ar' ? 'مرحباً بك في الرسائل' : 'Welcome to Messages'}
                </h2>
                <p className="text-gray-500 mb-6">
                  {language === 'ar' ? 'اختر محادثة أو ابدأ محادثة جديدة' : 'Select a conversation or start a new one'}
                </p>
                <button
                  onClick={openNewChatModal}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {language === 'ar' ? 'محادثة جديدة' : 'New Conversation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col relative overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">
                {language === 'ar' ? 'محادثة جديدة' : 'New Conversation'}
              </h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Loading Overlay */}
            {startingConversation && (
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {language === 'ar' ? 'جاري بدء المحادثة...' : 'Starting conversation...'}
                  </p>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'ابحث عن مستخدم...' : 'Search for a user...'}
                  className="w-full ps-10 pe-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : availableUsers.length > 0 ? (
                availableUsers
                  .filter(u =>
                    u.name?.toLowerCase().includes(userSearchQuery.toLowerCase())
                  )
                  .map((availableUser) => (
                    <button
                      key={availableUser.id}
                      onClick={() => startNewConversation(availableUser.id)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50"
                    >
                      {availableUser.avatar ? (
                        <img
                          src={ikUrl(availableUser.avatar, { width: 100 })}
                          alt={availableUser.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 text-start">
                        <h3 className="font-semibold text-gray-900">{availableUser.name}</h3>
                        <p className="text-sm text-gray-500">
                          {availableUser.role === 'INSTRUCTOR'
                            ? (language === 'ar' ? 'مدرس' : 'Instructor')
                            : availableUser.role === 'ADMIN'
                            ? (language === 'ar' ? 'مدير' : 'Admin')
                            : (language === 'ar' ? 'طالب' : 'Student')
                          }
                        </p>
                      </div>
                    </button>
                  ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{language === 'ar' ? 'لا يوجد مستخدمين' : 'No users available'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
