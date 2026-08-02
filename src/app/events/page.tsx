'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, MapPin, Users, Search, Filter, Clock } from 'lucide-react';

interface Event {
  id: string;
  titleAr: string;
  titleEn: string;
  image?: string;
  venue?: string;
  startDate: string;
  capacity: number;
  registeredCount: number;
  price: number;
}

export default function EventsPage() {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (upcomingOnly) params.set('upcoming', 'true');
    setLoading(true);
    fetch(`/api/events?${params}`)
      .then(res => res.json())
      .then(data => { if (data.success) setEvents(data.data); })
      .finally(() => setLoading(false));
  }, [searchQuery, upcomingOnly]);

  return (
    <div className="min-h-screen bg-gray-50" dir={ar ? 'rtl' : 'ltr'}>
      <Navbar variant="solid" />

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl font-bold mb-4">{ar ? 'الفعاليات' : 'Events'}</h1>
          <p className="text-xl opacity-80">{ar ? 'انضم إلى فعالياتنا وتوسع في شبكتك المهنية' : 'Join our events and expand your network'}</p>
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
              placeholder={ar ? 'ابحث عن فعالية...' : 'Search events...'}
              className="w-full ps-11 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <button
            onClick={() => setUpcomingOnly(!upcomingOnly)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-colors ${upcomingOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
          >
            <Filter className="w-4 h-4" />
            {ar ? 'القادمة فقط' : 'Upcoming Only'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{ar ? 'لا توجد فعاليات حالياً' : 'No events available'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => {
              const isFull = event.capacity > 0 && event.registeredCount >= event.capacity;
              const isFree = Number(event.price) === 0;
              return (
                <Link key={event.id} href={`/events/${event.id}`} className="group">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0">
                      {event.image ? (
                        <img src={event.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Calendar className="w-16 h-16 text-blue-400" /></div>
                      )}
                      {isFree && <span className="absolute top-3 start-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">{ar ? 'مجاني' : 'Free'}</span>}
                      {isFull && <span className="absolute top-3 end-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">{ar ? 'مكتمل' : 'Full'}</span>}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{ar ? event.titleAr : event.titleEn}</h3>
                      <div className="space-y-2 mt-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{new Date(event.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        {event.venue && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>{event.registeredCount}{event.capacity > 0 ? `/${event.capacity}` : ''}</span>
                          </div>
                          {!isFree && <span className="font-bold text-blue-600">${Number(event.price).toFixed(2)}</span>}
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
