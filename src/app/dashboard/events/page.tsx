'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ikUrl } from '@/lib/imagekit';
import { Calendar, MapPin, Clock, XCircle } from 'lucide-react';

interface EventRegistration {
  id: string;
  status: string;
  createdAt: string;
  event: {
    id: string;
    titleAr: string;
    titleEn: string;
    image?: string;
    startDate: string;
    endDate: string;
    venue?: string;
    status: string;
    price: number;
  };
}

export default function DashboardEventsPage() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/dashboard/events', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setRegistrations(data.data); })
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async (eventId: string) => {
    try {
      await fetch(`/api/events/${eventId}/register`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(prev => prev.filter(r => r.event.id !== eventId));
    } catch (error) {
      console.error('Error cancelling registration:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={ar ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <Calendar className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">{ar ? 'فعالياتي' : 'My Events'}</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{ar ? 'لم تسجل في أي فعالية بعد' : 'No events registered yet'}</h3>
            <Link href="/events" className="text-blue-600 hover:underline text-sm">{ar ? 'تصفح الفعاليات' : 'Browse Events'}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {registrations.map(reg => {
              const hasStarted = new Date(reg.event.startDate) <= new Date();
              const isUpcoming = !hasStarted;
              return (
                <div key={reg.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-36 bg-gradient-to-br from-blue-100 to-blue-200 relative">
                    {reg.event.image ? (
                      <img src={ikUrl(reg.event.image, { width: 600 })} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-blue-400" />
                      </div>
                    )}
                    <span className={`absolute top-3 start-3 text-xs font-bold px-3 py-1 rounded-full ${
                      reg.status === 'ATTENDED' ? 'bg-green-500 text-white'
                        : isUpcoming ? 'bg-blue-600 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {reg.status === 'ATTENDED'
                        ? (ar ? 'حضرت' : 'Attended')
                        : isUpcoming ? (ar ? 'قادمة' : 'Upcoming') : (ar ? 'انتهت' : 'Ended')}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{ar ? reg.event.titleAr : reg.event.titleEn}</h3>
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(reg.event.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      {reg.event.venue && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{reg.event.venue}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/events/${reg.event.id}`} className="flex-1 text-center text-sm py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        {ar ? 'عرض' : 'View'}
                      </Link>
                      {isUpcoming && reg.status !== 'ATTENDED' && (
                        <button
                          onClick={() => handleCancel(reg.event.id)}
                          className="flex items-center gap-1 text-sm py-2 px-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          {ar ? 'إلغاء' : 'Cancel'}
                        </button>
                      )}
                    </div>
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
