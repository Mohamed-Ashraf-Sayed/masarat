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
          <div className="order-1 lg:order-2 relative flex justify-center items-center min-h-[500px]">

            {/* Main Phone */}
            <div className="relative">
              {/* Graduation Cap - top right of phone */}
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
                alt=""
                className="absolute -top-12 -end-4 w-24 h-24 z-20 drop-shadow-xl"
              />

              {/* Phone Frame */}
              <div className="relative bg-gradient-to-b from-[#2a3f50] to-[#1a2530] rounded-[2.5rem] p-2 shadow-2xl transform rotate-2">
                {/* Phone notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full z-10"></div>

                {/* Phone screen */}
                <div className="bg-white rounded-[2rem] overflow-hidden w-56 sm:w-64">
                  {/* Status bar */}
                  <div className="bg-gradient-to-br from-[#5ba4d4] to-[#4485b5] px-4 py-6 text-white text-center">
                    <div className="text-xs font-medium opacity-90 tracking-wider">SUNDAY</div>
                    <div className="text-4xl font-bold tracking-tight">09:30</div>
                  </div>

                  {/* Bookshelf */}
                  <div className="bg-gradient-to-b from-[#faf6f0] to-[#f5efe6] p-4 h-80">
                    <div className="bg-[#8B4513]/90 rounded-xl p-3 shadow-lg h-full flex flex-col justify-between">
                      {/* Shelf 1 */}
                      <div>
                        <div className="flex gap-0.5 justify-center mb-1">
                          <div className="w-3 h-14 bg-red-400 rounded-t-sm"></div>
                          <div className="w-4 h-14 bg-emerald-500 rounded-t-sm"></div>
                          <div className="w-3 h-14 bg-blue-400 rounded-t-sm"></div>
                          <div className="w-4 h-14 bg-amber-400 rounded-t-sm"></div>
                          <div className="w-3 h-14 bg-purple-400 rounded-t-sm"></div>
                          <div className="w-4 h-14 bg-orange-400 rounded-t-sm"></div>
                          <div className="w-3 h-14 bg-pink-400 rounded-t-sm"></div>
                          <div className="w-4 h-14 bg-teal-400 rounded-t-sm"></div>
                          <div className="w-3 h-14 bg-indigo-400 rounded-t-sm"></div>
                        </div>
                        <div className="h-2 bg-[#5D3A1A] rounded shadow-inner"></div>
                      </div>

                      {/* Shelf 2 */}
                      <div>
                        <div className="flex gap-0.5 justify-center mb-1">
                          <div className="w-4 h-12 bg-rose-500 rounded-t-sm"></div>
                          <div className="w-3 h-12 bg-green-500 rounded-t-sm"></div>
                          <div className="w-4 h-12 bg-sky-500 rounded-t-sm"></div>
                          <div className="w-3 h-12 bg-yellow-500 rounded-t-sm"></div>
                          <div className="w-4 h-12 bg-violet-500 rounded-t-sm"></div>
                          <div className="w-3 h-12 bg-cyan-500 rounded-t-sm"></div>
                          <div className="w-4 h-12 bg-lime-500 rounded-t-sm"></div>
                        </div>
                        <div className="h-2 bg-[#5D3A1A] rounded shadow-inner"></div>
                      </div>

                      {/* Shelf 3 */}
                      <div>
                        <div className="flex gap-0.5 justify-center mb-1">
                          <div className="w-5 h-10 bg-fuchsia-400 rounded-t-sm"></div>
                          <div className="w-4 h-10 bg-blue-500 rounded-t-sm"></div>
                          <div className="w-5 h-10 bg-red-500 rounded-t-sm"></div>
                          <div className="w-4 h-10 bg-green-400 rounded-t-sm"></div>
                          <div className="w-5 h-10 bg-orange-500 rounded-t-sm"></div>
                        </div>
                        <div className="h-2 bg-[#5D3A1A] rounded shadow-inner"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Globe with stand - bottom left */}
              <div className="absolute -bottom-6 -start-24 z-10">
                <div className="relative">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3214/3214679.png"
                    alt=""
                    className="w-28 h-28 drop-shadow-xl"
                  />
                </div>
              </div>

              {/* Books stack - right side */}
              <div className="absolute bottom-20 -end-20 z-10">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png"
                  alt=""
                  className="w-24 h-24 drop-shadow-xl"
                />
              </div>

              {/* Single books - scattered */}
              <div className="absolute top-20 -start-20 z-0">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2702/2702154.png"
                  alt=""
                  className="w-16 h-16 drop-shadow-lg transform -rotate-12"
                />
              </div>

              {/* Microphone - bottom */}
              <div className="absolute -bottom-4 end-8 z-10">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2907/2907149.png"
                  alt=""
                  className="w-14 h-14 drop-shadow-xl"
                />
              </div>

              {/* Pencils/pen holder */}
              <div className="absolute bottom-0 -start-8 z-0">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2541/2541988.png"
                  alt=""
                  className="w-12 h-12 drop-shadow-lg opacity-80"
                />
              </div>
            </div>
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
