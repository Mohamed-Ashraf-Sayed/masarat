'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, MapPin, Users, ArrowRight, Clock } from 'lucide-react';

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
  _count: { registrations: number };
}

export default function UpcomingEventsSection() {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events?upcoming=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEvents(data.data.slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || events.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50" dir={ar ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {ar ? 'الفعاليات القادمة' : 'Upcoming Events'}
            </h2>
            <p className="text-gray-500 mt-2">
              {ar ? 'انضم إلى فعالياتنا ووسّع شبكتك المهنية' : 'Join our events and expand your network'}
            </p>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            {ar ? 'عرض الكل' : 'View All'}
            <ArrowRight className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map(event => {
            const isFree = Number(event.price) === 0;
            const isFull = event.capacity > 0 && event.registeredCount >= event.capacity;

            return (
              <Link key={event.id} href={`/events/${event.id}`} className="group">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 h-full flex flex-col">
                  <div className="relative h-44 bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0">
                    {event.image ? (
                      <img src={event.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-14 h-14 text-blue-400" />
                      </div>
                    )}
                    {isFree && (
                      <span className="absolute top-3 start-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {ar ? 'مجاني' : 'Free'}
                      </span>
                    )}
                    {isFull && (
                      <span className="absolute top-3 end-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {ar ? 'مكتمل' : 'Full'}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors mb-3">
                      {ar ? event.titleAr : event.titleEn}
                    </h3>

                    <div className="mt-auto space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{new Date(event.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{event.registeredCount}{event.capacity > 0 ? `/${event.capacity}` : ''} {ar ? 'مسجل' : 'registered'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link href="/events" className="inline-flex items-center gap-2 text-primary-600 font-medium">
            {ar ? 'عرض كل الفعاليات' : 'View All Events'}
            <ArrowRight className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </div>
    </section>
  );
}
