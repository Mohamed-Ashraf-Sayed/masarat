'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, MapPin, Users, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface Event {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  capacity: number;
  registeredCount: number;
  price: number;
  refundPolicy?: string;
  organizer: { id: string; name: string; avatar?: string };
}

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; }

export default function EventDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const ar = language === 'ar';

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setEvent(data.data); else router.push('/events'); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !token || !event) return;
    fetch('/api/dashboard/events', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.success) setIsRegistered(data.data.some((r: any) => r.event.id === id && r.status !== 'CANCELLED'));
      });
  }, [user, token, event]);

  useEffect(() => {
    if (!event) return;
    const updateTimer = () => {
      const diff = new Date(event.startDate).getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        });
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [event]);

  const handleRegister = async () => {
    if (!user) { router.push('/login'); return; }
    setRegistering(true);
    try {
      const res = await fetch(`/api/events/${id}/register`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setIsRegistered(true); setEvent(prev => prev ? { ...prev, registeredCount: prev.registeredCount + 1 } : prev); }
    } finally { setRegistering(false); }
  };

  const handleCancel = async () => {
    setRegistering(true);
    try {
      const res = await fetch(`/api/events/${id}/register`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setIsRegistered(false); setEvent(prev => prev ? { ...prev, registeredCount: Math.max(0, prev.registeredCount - 1) } : prev); }
    } finally { setRegistering(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!event) return null;

  const isFull = event.capacity > 0 && event.registeredCount >= event.capacity;
  const isFree = Number(event.price) === 0;
  const hasStarted = new Date(event.startDate) <= new Date();

  return (
    <div className="min-h-screen bg-gray-50" dir={ar ? 'rtl' : 'ltr'}>
      <Navbar variant="solid" />

      <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-600 to-blue-800">
        {event.image && <img src={event.image} alt="" className="w-full h-full object-cover opacity-50" />}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 pb-8 w-full">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{ar ? event.titleAr : event.titleEn}</h1>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>{new Date(event.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{event.venue}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span>{event.registeredCount}{event.capacity > 0 ? `/${event.capacity}` : ''} {ar ? 'مسجل' : 'registered'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{ar ? 'عن الفعالية' : 'About the Event'}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{ar ? event.descriptionAr : event.descriptionEn}</p>
            </div>

            {event.refundPolicy && (
              <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
                <h2 className="text-lg font-bold text-yellow-800 mb-2">{ar ? 'سياسة الاسترداد' : 'Refund Policy'}</h2>
                <p className="text-yellow-700 text-sm">{event.refundPolicy}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!hasStarted && (
              <div className="bg-blue-600 text-white rounded-2xl p-5 text-center">
                <p className="text-blue-200 text-sm mb-3">{ar ? 'ينطلق خلال' : 'Starts in'}</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: timeLeft.days, label: ar ? 'يوم' : 'Days' },
                    { val: timeLeft.hours, label: ar ? 'ساعة' : 'Hours' },
                    { val: timeLeft.minutes, label: ar ? 'دقيقة' : 'Min' },
                    { val: timeLeft.seconds, label: ar ? 'ثانية' : 'Sec' },
                  ].map(({ val, label }) => (
                    <div key={label} className="bg-blue-700 rounded-xl p-2">
                      <div className="text-2xl font-bold">{String(val).padStart(2, '0')}</div>
                      <div className="text-xs text-blue-300">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="text-center mb-5">
                {isFree ? (
                  <div className="text-3xl font-bold text-green-600">{ar ? 'مجاني' : 'Free'}</div>
                ) : (
                  <div className="text-3xl font-bold text-gray-900">${Number(event.price).toFixed(2)}</div>
                )}
              </div>

              {isRegistered ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 rounded-xl py-3">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{ar ? 'أنت مسجل' : 'You are registered'}</span>
                  </div>
                  {!hasStarted && (
                    <button onClick={handleCancel} disabled={registering} className="w-full flex items-center justify-center gap-2 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                      <XCircle className="w-4 h-4" />
                      {registering ? (ar ? 'جاري الإلغاء...' : 'Cancelling...') : (ar ? 'إلغاء التسجيل' : 'Cancel Registration')}
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={handleRegister} disabled={registering || isFull || hasStarted} className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {registering ? (ar ? 'جاري التسجيل...' : 'Registering...') : isFull ? (ar ? 'المقاعد ممتلئة' : 'Event Full') : hasStarted ? (ar ? 'الفعالية بدأت' : 'Event Started') : (ar ? 'سجل الآن' : 'Register Now')}
                </button>
              )}

              {!user && <p className="text-center text-sm text-gray-500 mt-3">{ar ? 'يرجى تسجيل الدخول للتسجيل في الفعالية' : 'Please login to register'}</p>}

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{ar ? 'المسجلون' : 'Registered'}</span>
                  <span className="font-medium">{event.registeredCount}{event.capacity > 0 ? `/${event.capacity}` : ''}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-3">{ar ? 'المنظم' : 'Organizer'}</h3>
              <div className="flex items-center gap-3">
                {event.organizer.avatar ? (
                  <img src={event.organizer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {event.organizer.name[0]}
                  </div>
                )}
                <span className="font-medium text-gray-900">{event.organizer.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
