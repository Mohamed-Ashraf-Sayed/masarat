'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

function useCountUp(end: number, duration: number = 2000, startCounting: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startCounting) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startCounting]);

  return count;
}

export default function StatsSection() {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const trainersCount = useCountUp(50, 2000, isVisible);
  const hoursCount = useCountUp(500, 2500, isVisible);
  const institutionsCount = useCountUp(3, 1500, isVisible);
  const certificatesCount = useCountUp(200, 2000, isVisible);

  const stats = [
    {
      value: trainersCount,
      prefix: '+',
      label: language === 'ar' ? 'عدد المتدربين' : 'Trainees',
    },
    {
      value: hoursCount,
      prefix: '+',
      label: language === 'ar' ? 'عدد ساعات التدريب' : 'Training Hours',
    },
    {
      value: institutionsCount,
      prefix: '',
      label: language === 'ar' ? 'عدد المؤسسات' : 'Institutions',
    },
    {
      value: certificatesCount,
      prefix: '+',
      label: language === 'ar' ? 'عدد الشهادات المصدرة' : 'Certificates Issued',
    },
  ];

  return (
    <section ref={sectionRef} className="py-12 bg-[#f8f9fa] border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8" dir="rtl">

          {/* Title */}
          <div className="text-right lg:border-l lg:border-gray-300 lg:pl-12 lg:ml-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#4485b5]">
              {language === 'ar' ? 'مسارات' : 'Masarat'}
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold text-amber-500">
              {language === 'ar' ? 'في أرقام' : 'in Numbers'}
            </h3>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[#4485b5] mb-2">
                  {stat.prefix}{stat.value}
                </div>
                <div className="text-gray-600 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
