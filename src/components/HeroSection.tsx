'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HeroSection() {
  const { language } = useLanguage();

  return (
    <section className="relative min-h-[85vh] flex items-center pt-24 overflow-hidden">
      {/* Background with wave pattern */}
      <div className="absolute inset-0 bg-[#f8f9fa]">
        {/* Top wave decoration */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#e8f4fc] to-transparent"></div>

        {/* Subtle curved line decoration */}
        <svg className="absolute top-20 left-0 w-full h-40 opacity-30" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path d="M0,100 Q360,150 720,100 T1440,100" stroke="#c5dff0" strokeWidth="2" fill="none"/>
        </svg>

        <svg className="absolute bottom-40 left-0 w-full h-40 opacity-20" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path d="M0,100 Q360,50 720,100 T1440,100" stroke="#c5dff0" strokeWidth="2" fill="none"/>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">

          {/* Content - Right side for Arabic */}
          <div className="order-2 lg:order-1 text-right" dir="rtl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-700 mb-2">
              {language === 'ar' ? 'أهلاً بكم في' : 'Welcome to'}
            </h1>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#4485b5] mb-8">
              {language === 'ar' ? 'منصة مسارات' : 'Masarat Platform'}
            </h2>

            <p className="text-gray-600 text-base leading-loose mb-4">
              {language === 'ar'
                ? 'تُعد مسارات لخدمات تحليل السلوك التطبيقي مزوداً رائداً لخدمات علم تحليل السلوك التطبيقي، توظف خبراتها ومعارفها لتقدم برامج تعليمية عالية الجودة، عبر مسارات التأهيل والتعليم التي يمر بها الإنسان، وتركز خدماتها على قطاعات الأشخاص ذوي الإعاقة والاضطرابات النمائية والخدمات الإنسانية، معتمدة على أحدث الممارسات القائمة على الأدلة العلمية.'
                : 'Masarat for Applied Behavior Analysis Services is a leading provider of ABA services, employing its expertise and knowledge to offer high-quality educational programs through rehabilitation and education pathways, focusing on serving individuals with disabilities, developmental disorders, and humanitarian services, based on the latest evidence-based practices.'}
            </p>

            <p className="text-gray-600 text-base leading-loose mb-8">
              {language === 'ar'
                ? 'بفضل خبراتنا وتركيزنا على اضطراب طيف التوحد، وتحليل السلوك التطبيقي، واحتياجات قطاع التربية الخاصة، نعتمد نهجاً قائماً على الأدلة العلمية في تطوير البرامج وتقديمها لجميع الفئات.'
                : 'Thanks to our expertise and focus on autism spectrum disorder, applied behavior analysis, and special education sector needs, we adopt an evidence-based approach in developing and delivering programs for all categories.'}
            </p>

            <div className="flex flex-wrap gap-4 justify-start">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-[#4485b5] text-white font-semibold rounded-full hover:bg-[#3a7299] transition-all shadow-md hover:shadow-lg"
              >
                {language === 'ar' ? 'استكشف مسارات' : 'Explore Courses'}
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-[#4485b5] font-semibold rounded-full border-2 border-[#4485b5] hover:bg-[#4485b5] hover:text-white transition-all"
              >
                {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </Link>
            </div>
          </div>

          {/* Hero Image - Left side for Arabic */}
          <div className="order-1 lg:order-2 relative flex justify-center items-center">
            <img
              src="/images/hero.png"
              alt="Masarat Training"
              className="w-full max-w-lg h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 Q360,80 720,40 T1440,40 L1440,100 L0,100 Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
