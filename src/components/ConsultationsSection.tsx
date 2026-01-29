'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Users, UserPlus, ArrowLeft, ArrowRight } from 'lucide-react';

export default function ConsultationsSection() {
  const { language, direction } = useLanguage();

  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  const consultations = [
    {
      id: 1,
      icon: Building2,
      title: language === 'ar' ? 'للمؤسسات' : 'For Institutions',
      description: language === 'ar'
        ? 'نقدم للمؤسسات الحكومية والخاصة حلولاً علمية مبتكرة ومتخصصة قابلة للتطبيق، تضمن تقديم خدمات عالية الجودة تلبي اعتراف المجتمع بهذه المؤسسات.'
        : 'We provide government and private institutions with innovative, specialized scientific solutions that ensure high-quality services meeting community recognition standards.',
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      hoverBorder: 'hover:border-amber-400',
    },
    {
      id: 2,
      icon: Users,
      title: language === 'ar' ? 'للأسرة والطفل' : 'For Family & Child',
      description: language === 'ar'
        ? 'نساعد الأسر في تخطيط رحلة علاج أطفالهم واكتساب المعارف اللازمة لتطوير الوعي وتجاوز التحديات التي يواجهونها بالاستناد إلى القواعد العلمية والعلاجات ذات دليل علمي.'
        : 'We help families plan their children\'s treatment journey and acquire the knowledge needed to develop awareness and overcome challenges based on scientific rules and evidence-based treatments.',
      color: 'bg-[#4485b5]',
      lightBg: 'bg-blue-50',
      textColor: 'text-[#4485b5]',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-[#4485b5]',
    },
    {
      id: 3,
      icon: UserPlus,
      title: language === 'ar' ? 'للأخصائيين' : 'For Specialists',
      description: language === 'ar'
        ? 'نقدم استشارات علمية متخصصة من قبل خبرائنا. خدمات الإشراف والاستشارات العلمية التي تساهم في تحقيق الأهداف المنشودة والنمو المهني.'
        : 'We provide specialized scientific consultations by our experts. Supervision services and scientific consultations that contribute to achieving goals and professional growth.',
      color: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
            {language === 'ar' ? 'خدماتنا الاستشارية' : 'Our Consultation Services'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'الاستشارات' : 'Consultations'}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'نقدم خدمات استشارية متخصصة لمختلف الفئات لتحقيق أفضل النتائج'
              : 'We offer specialized consultation services for different categories to achieve the best results'}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {consultations.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-8 border-2 ${item.borderColor} ${item.hoverBorder} transition-all duration-300 hover:shadow-xl group`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 ${item.lightBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`w-8 h-8 ${item.textColor}`} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed mb-6 text-sm">
                {item.description}
              </p>

              {/* Button */}
              <Link
                href="/contact"
                className={`inline-flex items-center gap-2 ${item.textColor} font-semibold hover:gap-3 transition-all duration-300`}
              >
                {language === 'ar' ? 'احجز استشارتك' : 'Book Consultation'}
                <Arrow className="w-5 h-5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#4485b5] text-white font-semibold rounded-full hover:bg-[#3a7299] transition-all shadow-lg hover:shadow-xl"
          >
            {language === 'ar' ? 'تواصل معنا الآن' : 'Contact Us Now'}
            <Arrow className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
