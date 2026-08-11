'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ikUrl } from '@/lib/imagekit';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function PopularProgramsSection() {
  const { language, direction } = useLanguage();

  const programs = [
    {
      id: 1,
      title: 'IBA®',
      subtitle: 'International Behavior Analyst',
      titleAr: 'محلل سلوك دولي',
      image: '/images/programs/IBA.jpg',
    },
    {
      id: 2,
      title: 'IBT®',
      subtitle: 'International Behavior Therapist',
      titleAr: 'معالج سلوك دولي',
      image: '/images/programs/IBT.jpg',
    },
    {
      id: 3,
      title: 'QBA®',
      subtitle: 'Qualified Behavior Analyst',
      titleAr: 'محلل سلوك مؤهل',
      image: '/images/programs/QBA.jpg',
    },
    {
      id: 4,
      title: 'QASP-S®',
      subtitle: 'Qualified Autism Services Practitioner – Supervisor',
      titleAr: 'ممارس خدمات التوحد المؤهل - مشرف',
      image: '/images/programs/QASP-S.jpg',
    },
    {
      id: 5,
      title: 'ABAT®',
      subtitle: 'Applied Behavior Analysis Technician',
      titleAr: 'فني تحليل السلوك التطبيقي',
      image: '/images/programs/ABAT.jpg',
    },
  ];

  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'البرامج التدريبية الأكثر طلباً' : 'Most Popular Training Programs'}
          </h2>
          <p className="text-gray-600 text-lg">
            {language === 'ar'
              ? 'دورات معتمدة دولياً في مختلف التخصصات'
              : 'Internationally accredited courses in various specializations'}
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {programs.map((program) => (
            <Link
              key={program.id}
              href={`/courses?program=${program.title}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Image Container */}
              <div className="bg-white p-4 flex items-center justify-center min-h-[200px]">
                <img
                  src={ikUrl(program.image, { width: 600 })}
                  alt={program.title}
                  className="max-w-full max-h-[180px] object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Content */}
              <div className="p-4 text-center border-t border-gray-100">
                <h3 className="text-lg font-bold text-[#4485b5] mb-1">
                  {program.title}
                </h3>
                <p className="text-sm text-gray-700 mb-1 line-clamp-2">
                  {program.subtitle}
                </p>
                <p className="text-xs text-gray-500">
                  {program.titleAr}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#4485b5] text-white font-semibold rounded-full hover:bg-[#3a7299] transition-all shadow-lg hover:shadow-xl"
          >
            {language === 'ar' ? 'عرض جميع البرامج' : 'View All Programs'}
            <Arrow className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
