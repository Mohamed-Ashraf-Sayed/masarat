'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, ArrowRight, Calendar } from 'lucide-react';

interface Initiative {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  status: string;
  startDate?: string;
  entity: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
}

export default function ActiveInitiativesSection() {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/initiatives?status=ACTIVE')
      .then(res => res.json())
      .then(data => {
        if (data.success) setInitiatives(data.data.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || initiatives.length === 0) return null;

  return (
    <section className="py-16 bg-white" dir={ar ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {ar ? 'المبادرات النشطة' : 'Active Initiatives'}
            </h2>
            <p className="text-gray-500 mt-2">
              {ar ? 'شارك في مبادراتنا وكن جزءاً من التغيير' : 'Join our initiatives and be part of the change'}
            </p>
          </div>
          <Link
            href="/union"
            className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            {ar ? 'عرض الكل' : 'View All'}
            <ArrowRight className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        {/* Initiatives Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initiatives.map(initiative => (
            <Link key={initiative.id} href="/union" className="group">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all hover:-translate-y-1 h-full flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {ar ? initiative.titleAr : initiative.titleEn}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ar ? initiative.entity.nameAr : initiative.entity.nameEn}
                    </p>
                  </div>
                </div>

                {(ar ? initiative.descriptionAr : initiative.descriptionEn) && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
                    {ar ? initiative.descriptionAr : initiative.descriptionEn}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-200">
                  {initiative.startDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(initiative.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  )}
                  <span className="ms-auto bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {ar ? 'نشطة' : 'Active'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link href="/union" className="inline-flex items-center gap-2 text-primary-600 font-medium">
            {ar ? 'عرض كل المبادرات' : 'View All Initiatives'}
            <ArrowRight className={`w-4 h-4 ${ar ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </div>
    </section>
  );
}
