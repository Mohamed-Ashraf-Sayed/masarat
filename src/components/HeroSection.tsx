'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ikUrl } from '@/lib/imagekit';

export default function HeroSection() {
  const { language } = useLanguage();
  // Admin-configured hero image (falls back to the SVG illustration when unset)
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/site-images')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.hero) {
          setHeroImage(data.data.hero);
        }
      })
      .catch(() => {});
  }, []);

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

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 mb-6">
              {[
                { num: '500+', label: { ar: 'دورة تدريبية', en: 'Courses' } },
                { num: '10K+', label: { ar: 'متعلم نشط', en: 'Active Learners' } },
                { num: '200+', label: { ar: 'مدرب خبير', en: 'Expert Instructors' } },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-[#4485b5]">{s.num}</div>
                  <div className="text-sm text-gray-500">{s.label[language]}</div>
                </div>
              ))}
            </div>

            <p className="text-gray-600 text-base leading-loose mb-4">
              {language === 'ar'
                ? 'منصة تعليمية متكاملة تجمع بين الدورات الاحترافية، والفعاليات التدريبية، والكتب المتخصصة، والمسابقات التعليمية — كل ما تحتاجه لتطوير مهاراتك في مكان واحد.'
                : 'An all-in-one learning platform combining professional courses, training events, specialized books, and educational competitions — everything you need to grow your skills in one place.'}
            </p>

            <p className="text-gray-600 text-base leading-loose mb-8">
              {language === 'ar'
                ? 'سواء كنت مبتدئاً تبحث عن أساسيات قوية، أو محترفاً يريد تطوير خبراته، أو مؤسسة تسعى لتدريب فريقها — مسارات هي وجهتك التعليمية الأولى.'
                : 'Whether you are a beginner building strong foundations, a professional looking to upgrade skills, or an organization training your team — Masarat is your first learning destination.'}
            </p>

            <div className="flex flex-wrap gap-4 justify-start">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-[#4485b5] text-white font-semibold rounded-full hover:bg-[#3a7299] transition-all shadow-md hover:shadow-lg"
              >
                {language === 'ar' ? 'ابدأ التعلم الآن' : 'Start Learning Now'}
              </Link>

              <Link
                href="/events"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-[#4485b5] font-semibold rounded-full border-2 border-[#4485b5] hover:bg-[#4485b5] hover:text-white transition-all"
              >
                {language === 'ar' ? 'الفعاليات القادمة' : 'Upcoming Events'}
              </Link>
            </div>
          </div>

          {/* Hero Image - Left side for Arabic */}
          <div className="order-1 lg:order-2 relative flex justify-center items-center">
            {heroImage ? (
            <img
              src={ikUrl(heroImage, { width: 600 })}
              alt="Masarat Training"
              className="w-full max-w-lg h-auto drop-shadow-2xl"
            />
            ) : (
            <svg viewBox="0 0 500 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-lg h-auto">

              {/* ── BACKGROUND CIRCLE ── */}
              <circle cx="255" cy="245" r="205" fill="#ddeef9"/>
              <circle cx="90" cy="155" r="10" fill="#4485b5" fillOpacity="0.15"/>
              <circle cx="432" cy="172" r="14" fill="#4485b5" fillOpacity="0.12"/>
              <circle cx="72" cy="372" r="7" fill="#ffd166" fillOpacity="0.4"/>
              <circle cx="448" cy="388" r="10" fill="#ffd166" fillOpacity="0.25"/>
              <circle cx="118" cy="430" r="6" fill="#06d6a0" fillOpacity="0.35"/>
              <circle cx="400" cy="68" r="5" fill="#ef476f" fillOpacity="0.3"/>

              {/* ── SMARTPHONE ── */}
              <rect x="183" y="101" width="145" height="285" rx="22" fill="#4485b5" fillOpacity="0.1"/>
              <rect x="180" y="98" width="145" height="285" rx="22" fill="white" stroke="#c5dff0" strokeWidth="2"/>
              <rect x="224" y="107" width="50" height="7" rx="3.5" fill="#e8e8e8"/>
              <circle cx="286" cy="110" r="4" fill="#e0e0e0"/>
              <circle cx="286" cy="110" r="2" fill="#ccc"/>
              <rect x="188" y="125" width="129" height="230" fill="#f5fbff"/>
              <rect x="228" y="368" width="48" height="5" rx="2.5" fill="#e8e8e8"/>

              {/* Phone header bar */}
              <rect x="188" y="125" width="129" height="30" fill="#4485b5"/>
              <circle cx="200" cy="140" r="2.5" fill="white" fillOpacity="0.7"/>
              <circle cx="208" cy="140" r="2.5" fill="white" fillOpacity="0.7"/>
              <circle cx="216" cy="140" r="2.5" fill="white" fillOpacity="0.7"/>
              <circle cx="308" cy="133" r="5" fill="#ef476f"/>

              {/* Search bar */}
              <rect x="194" y="162" width="117" height="18" rx="9" fill="white" stroke="#e0eef8" strokeWidth="1"/>
              <circle cx="206" cy="171" r="4" fill="none" stroke="#bbb" strokeWidth="1.5"/>
              <line x1="209" y1="174" x2="212" y2="177" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round"/>

              {/* Course card 1 – yellow */}
              <rect x="194" y="188" width="117" height="40" rx="7" fill="white" stroke="#e8f4fc" strokeWidth="1"/>
              <rect x="200" y="194" width="26" height="26" rx="5" fill="#fff3d4"/>
              <rect x="204" y="198" width="18" height="18" rx="2" fill="#ffd166"/>
              <line x1="208" y1="203" x2="218" y2="203" stroke="white" strokeWidth="1.5"/>
              <line x1="208" y1="207" x2="218" y2="207" stroke="white" strokeWidth="1.5"/>
              <line x1="208" y1="211" x2="215" y2="211" stroke="white" strokeWidth="1.5"/>
              <rect x="233" y="196" width="70" height="5" rx="2" fill="#4485b5"/>
              <rect x="233" y="205" width="52" height="4" rx="2" fill="#ddd"/>
              <rect x="233" y="213" width="40" height="4" rx="2" fill="#eee"/>

              {/* Course card 2 – green */}
              <rect x="194" y="234" width="117" height="40" rx="7" fill="white" stroke="#e8f4fc" strokeWidth="1"/>
              <rect x="200" y="240" width="26" height="26" rx="5" fill="#d4f4eb"/>
              <path d="M206 252 L210 248 L206 244" fill="none" stroke="#06d6a0" strokeWidth="2" strokeLinecap="round"/>
              <path d="M214 244 L218 248 L214 252" fill="none" stroke="#06d6a0" strokeWidth="2" strokeLinecap="round"/>
              <rect x="233" y="242" width="70" height="5" rx="2" fill="#4485b5"/>
              <rect x="233" y="251" width="52" height="4" rx="2" fill="#ddd"/>
              <rect x="233" y="259" width="40" height="4" rx="2" fill="#eee"/>

              {/* Course card 3 – red */}
              <rect x="194" y="280" width="117" height="40" rx="7" fill="white" stroke="#e8f4fc" strokeWidth="1"/>
              <rect x="200" y="286" width="26" height="26" rx="5" fill="#fde8ec"/>
              <path d="M207 288 L219 288 L219 298 Q219 304 213 306 Q207 304 207 298 Z" fill="#ef476f"/>
              <rect x="211" y="306" width="4" height="4" fill="#ef476f"/>
              <rect x="208" y="310" width="10" height="3" rx="1" fill="#ef476f"/>
              <rect x="233" y="288" width="70" height="5" rx="2" fill="#4485b5"/>
              <rect x="233" y="297" width="52" height="4" rx="2" fill="#ddd"/>
              <rect x="233" y="305" width="40" height="4" rx="2" fill="#eee"/>

              {/* Progress bar */}
              <rect x="194" y="328" width="117" height="22" rx="5" fill="#f0f8ff"/>
              <rect x="200" y="332" width="100" height="6" rx="3" fill="#e0eef8"/>
              <rect x="200" y="332" width="72" height="6" rx="3" fill="#4485b5"/>

              {/* ── GRADUATION CAP ── */}
              <g transform="translate(75, 88) rotate(-12)">
                <rect x="5" y="30" width="66" height="12" rx="3" fill="#2d6a96"/>
                <polygon points="38,4 68,30 8,30" fill="#4485b5"/>
                <line x1="62" y1="30" x2="67" y2="52" stroke="#4485b5" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="67" cy="57" r="6" fill="#ffd166"/>
              </g>

              {/* ── LIGHT BULB ── */}
              <g transform="translate(392, 75)">
                <circle cx="38" cy="32" r="36" fill="#ffd166" fillOpacity="0.18"/>
                <circle cx="38" cy="28" r="24" fill="#ffd166"/>
                <path d="M30 28 Q34 22 38 28 Q42 34 46 28" fill="none" stroke="#c88000" strokeWidth="2" strokeLinecap="round"/>
                <rect x="28" y="50" width="20" height="5" rx="2" fill="#c88000"/>
                <rect x="28" y="56" width="20" height="4" rx="2" fill="#c88000"/>
                <rect x="30" y="61" width="16" height="4" rx="2" fill="#a06000"/>
                <line x1="38" y1="0" x2="38" y2="-8" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="61" y1="7" x2="67" y2="1" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="70" y1="28" x2="78" y2="28" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="15" y1="7" x2="9" y2="1" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="6" y1="28" x2="-2" y2="28" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round"/>
              </g>

              {/* ── BOOK STACK ── */}
              <g transform="translate(42, 295)">
                <rect x="2" y="62" width="96" height="5" rx="2.5" fill="#4485b5" fillOpacity="0.15"/>
                <rect x="0" y="48" width="98" height="14" rx="3" fill="#4485b5"/>
                <rect x="5" y="48" width="4" height="14" fill="white" fillOpacity="0.2"/>
                <rect x="4" y="33" width="97" height="15" rx="3" fill="#ef476f"/>
                <rect x="9" y="33" width="4" height="15" fill="white" fillOpacity="0.2"/>
                <rect x="-2" y="18" width="97" height="15" rx="3" fill="#ffd166"/>
                <rect x="3" y="18" width="4" height="15" fill="white" fillOpacity="0.2"/>
                <rect x="3" y="3" width="97" height="15" rx="3" fill="#06d6a0"/>
                <rect x="8" y="3" width="4" height="15" fill="white" fillOpacity="0.2"/>
              </g>

              {/* ── OPEN BOOK ── */}
              <g transform="translate(340, 192)">
                <path d="M2 8 Q2 2 8 1 L58 2 L58 80 L8 82 Q2 82 2 76 Z" fill="white" stroke="#d5e8f5" strokeWidth="1.5"/>
                <path d="M58 2 L110 1 Q116 1 116 7 L116 75 Q116 81 110 82 L58 80 Z" fill="#f5fbff" stroke="#d5e8f5" strokeWidth="1.5"/>
                <line x1="58" y1="1" x2="58" y2="82" stroke="#c5dff0" strokeWidth="2"/>
                <line x1="10" y1="16" x2="52" y2="14" stroke="#e0e0e0" strokeWidth="1.5"/>
                <line x1="10" y1="24" x2="52" y2="22" stroke="#e0e0e0" strokeWidth="1.5"/>
                <line x1="10" y1="32" x2="52" y2="30" stroke="#e0e0e0" strokeWidth="1.5"/>
                <line x1="10" y1="40" x2="44" y2="38" stroke="#e0e0e0" strokeWidth="1.5"/>
                <line x1="10" y1="48" x2="52" y2="46" stroke="#e0e0e0" strokeWidth="1.5"/>
                <line x1="66" y1="14" x2="108" y2="16" stroke="#e0e0e0" strokeWidth="1.5"/>
                <line x1="66" y1="22" x2="108" y2="24" stroke="#e0e0e0" strokeWidth="1.5"/>
                <line x1="66" y1="30" x2="108" y2="32" stroke="#e0e0e0" strokeWidth="1.5"/>
                <line x1="66" y1="38" x2="94" y2="40" stroke="#e0e0e0" strokeWidth="1.5"/>
                <line x1="66" y1="46" x2="108" y2="48" stroke="#e0e0e0" strokeWidth="1.5"/>
                <path d="M104 1 L104 22 L110 16 L116 22 L116 1 Z" fill="#ef476f"/>
              </g>

              {/* ── GLOBE ── */}
              <defs>
                <clipPath id="globeClip">
                  <circle cx="414" cy="358" r="52"/>
                </clipPath>
              </defs>
              <circle cx="414" cy="358" r="52" fill="#e8f4fc"/>
              <circle cx="414" cy="358" r="52" fill="none" stroke="#4485b5" strokeWidth="2"/>
              <g clipPath="url(#globeClip)">
                <ellipse cx="414" cy="358" rx="52" ry="19" fill="none" stroke="#4485b5" strokeWidth="1" strokeOpacity="0.5"/>
                <ellipse cx="414" cy="358" rx="52" ry="37" fill="none" stroke="#4485b5" strokeWidth="1" strokeOpacity="0.3"/>
                <line x1="362" y1="358" x2="466" y2="358" stroke="#4485b5" strokeWidth="1.5" strokeOpacity="0.5"/>
                <ellipse cx="414" cy="358" rx="22" ry="52" fill="none" stroke="#4485b5" strokeWidth="1.5" strokeOpacity="0.4"/>
                <path d="M392 340 Q402 333 410 337 Q417 340 414 350 Q407 355 400 352 Q390 348 392 340Z" fill="#4485b5" fillOpacity="0.28"/>
                <path d="M421 350 Q429 345 434 353 Q436 360 429 363 Q422 363 421 357 Z" fill="#4485b5" fillOpacity="0.22"/>
              </g>

              {/* ── CERTIFICATE ── */}
              <g transform="translate(90, 370)">
                <rect x="0" y="0" width="80" height="62" rx="6" fill="white" stroke="#d5e8f5" strokeWidth="1.5"/>
                <rect x="0" y="0" width="80" height="16" rx="6" fill="#4485b5"/>
                <rect x="0" y="10" width="80" height="6" fill="#4485b5"/>
                <line x1="8" y1="26" x2="72" y2="26" stroke="#e0e0e0" strokeWidth="1"/>
                <line x1="8" y1="33" x2="62" y2="33" stroke="#e0e0e0" strokeWidth="1"/>
                <line x1="8" y1="40" x2="72" y2="40" stroke="#e0e0e0" strokeWidth="1"/>
                <line x1="8" y1="47" x2="50" y2="47" stroke="#e0e0e0" strokeWidth="1"/>
                <circle cx="40" cy="56" r="8" fill="#ffd166" stroke="#c88000" strokeWidth="1"/>
                <path d="M40 50 L41.2 53.5 L44.8 53.5 L42 55.8 L43.2 59.5 L40 57.2 L36.8 59.5 L38 55.8 L35.2 53.5 L38.8 53.5 Z" fill="white" fillOpacity="0.9"/>
              </g>

              {/* ── PENCIL ── */}
              <g transform="translate(70, 210) rotate(38)">
                <rect x="0" y="0" width="11" height="9" rx="2" fill="#ef476f"/>
                <rect x="0" y="6" width="11" height="3" fill="white" fillOpacity="0.3"/>
                <rect x="0" y="9" width="11" height="5" fill="#c0c0c0"/>
                <rect x="0" y="14" width="11" height="55" fill="#ffd166"/>
                <rect x="1" y="14" width="2" height="55" fill="white" fillOpacity="0.2"/>
                <polygon points="0,69 11,69 5.5,83" fill="#e8c870"/>
                <polygon points="3,76 8,76 5.5,83" fill="#666"/>
              </g>

              {/* ── STARS ── */}
              <path d="M64 232 L66.5 239 L74 239 L68 243.5 L70.5 251 L64 247 L57.5 251 L60 243.5 L54 239 L61.5 239 Z" fill="#ffd166" fillOpacity="0.85"/>
              <path d="M449 138 L451 143 L456 143 L452.2 146.2 L453.8 151 L449 148.2 L444.2 151 L445.8 146.2 L442 143 L447 143 Z" fill="#4485b5" fillOpacity="0.5"/>
              <path d="M153 407 L155 413 L161 413 L156.5 416.5 L158.5 423 L153 419.5 L147.5 423 L149.5 416.5 L145 413 L151 413 Z" fill="#ef476f" fillOpacity="0.55"/>

              {/* ── SPARKLE DOTS ── */}
              <circle cx="143" cy="162" r="4" fill="#4485b5" fillOpacity="0.3"/>
              <circle cx="375" cy="155" r="3" fill="#ffd166" fillOpacity="0.5"/>
              <circle cx="468" cy="272" r="4.5" fill="#06d6a0" fillOpacity="0.4"/>
              <circle cx="46" cy="256" r="3" fill="#ef476f" fillOpacity="0.4"/>
              <circle cx="162" cy="448" r="5" fill="#4485b5" fillOpacity="0.22"/>
              <circle cx="455" cy="412" r="4" fill="#ffd166" fillOpacity="0.35"/>

            </svg>
            )}
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
