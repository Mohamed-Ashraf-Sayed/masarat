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

export default function MainTrainerSection() {
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

  const traineesCount = useCountUp(500, 2000, isVisible);
  const coursesCount = useCountUp(150, 2000, isVisible);
  const yearsCount = useCountUp(15, 1500, isVisible);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3a7299] via-[#4485b5] to-[#5a9bc7] relative py-12">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-10 w-20 h-20 bg-white/5 rounded-full"></div>
        <div className="absolute bottom-0 left-1/4 w-16 h-16 bg-white/5 rounded-full translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block px-4 py-1 bg-white/20 text-white rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
            {language === 'ar' ? 'تعرف على' : 'Meet'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {language === 'ar' ? 'المدرب الرئيسي' : 'Main Trainer'}
          </h2>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            {language === 'ar'
              ? 'خبرة عالية في التدريب والتعليم والتطوير والاستشارات'
              : 'High experience in training, education, development and consultations'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 items-center">

            {/* Text Content */}
            <div className="lg:col-span-2 text-right" dir="rtl">
              <h3 className="text-2xl md:text-3xl font-bold text-[#4485b5] mb-2">
                {language === 'ar' ? 'د. رضا جاد محمد طه كرامه' : 'Dr. Reda Gad Mohamed Taha Karama'}
              </h3>

              <p className="text-gray-700 font-semibold mb-1">
                {language === 'ar' ? 'محلل سلوك دولي معتمد' : 'Certified International Behavior Analyst'}
              </p>

              <p className="text-gray-500 text-sm mb-6">
                Ph.D, QBA, IBA, AC
              </p>

              <p className="text-gray-600 leading-loose mb-8">
                {language === 'ar'
                  ? 'أكثر من 15 عاماً من الخبرة الميدانية والتعليمية والتدريبية في مجال تعليم وتدريب وتأهيل العاملين بمجال الأشخاص ذوي الإعاقة وأسرهم ومجال الخدمات الإنسانية. حاصل على شهادات دولية معتمدة وخبرة في تصميم البرامج التأهيلية والسلوكية. له العديد من الأبحاث العلمية المنشورة في مجلات علمية محكمة ولديه العديد من المؤلفات العلمية.'
                  : 'More than 15 years of field, educational and training experience in the field of education, training and rehabilitation of workers in the field of people with disabilities and their families and the field of human services. Holder of internationally accredited certificates and experience in designing rehabilitation and behavioral programs. He has many scientific researches published in peer-reviewed scientific journals and has many scientific publications.'}
              </p>

              {/* Stats */}
              <div className="flex justify-center lg:justify-start gap-12">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-[#4485b5]">
                    +{traineesCount}
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {language === 'ar' ? 'متدرب' : 'Trainees'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-[#4485b5]">
                    +{coursesCount}
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {language === 'ar' ? 'دورة تدريبية' : 'Training Courses'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-[#4485b5]">
                    {yearsCount}
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {language === 'ar' ? 'سنوات الخبرة' : 'Years of Experience'}
                  </div>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="lg:col-span-1 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-64 h-80 md:w-72 md:h-96 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-b from-gray-100 to-gray-200">
                  <img
                    src="/images/trainer.jpg"
                    alt={language === 'ar' ? 'د. رضا جاد محمد طه كرامه' : 'Dr. Reda Gad Mohamed Taha Karama'}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#4485b5]/10 rounded-full -z-10"></div>
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-amber-400/20 rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="bg-white">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 0L60 5C120 10 240 20 360 25C480 30 600 30 720 25C840 20 960 10 1080 10C1200 10 1320 20 1380 25L1440 30V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z"
            fill="#f8f9fa"
          />
        </svg>
      </div>
    </section>
  );
}
