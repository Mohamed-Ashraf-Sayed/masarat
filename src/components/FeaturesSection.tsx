'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  GraduationCap,
  Award,
  Clock,
  HeadphonesIcon,
  MonitorPlay,
  Users,
  Globe,
  BookOpen,
} from 'lucide-react';

export default function FeaturesSection() {
  const { language } = useLanguage();

  const features = [
    {
      icon: MonitorPlay,
      title: { ar: 'محتوى علمي متخصص', en: 'Specialized Scientific Content' },
      description: {
        ar: 'دورات مبنية على أحدث الأبحاث في تحليل السلوك التطبيقي ABA',
        en: 'Courses based on the latest research in Applied Behavior Analysis ABA',
      },
      color: 'bg-blue-500',
    },
    {
      icon: Award,
      title: { ar: 'شهادات معتمدة دولياً', en: 'Internationally Accredited' },
      description: {
        ar: 'شهادات IBA® و IBT® و QBA® و QASP-S® معتمدة من IBAO,QABA',
        en: 'IBA®, IBT®, QBA®, QASP-S® certificates accredited by IBAO,QABA',
      },
      color: 'bg-emerald-500',
    },
    {
      icon: Clock,
      title: { ar: 'تعلم في أي وقت', en: 'Learn Anytime' },
      description: {
        ar: 'وصول غير محدود للمحتوى على مدار الساعة من أي مكان في العالم',
        en: 'Unlimited 24/7 access to content from anywhere in the world',
      },
      color: 'bg-cyan-500',
    },
    {
      icon: HeadphonesIcon,
      title: { ar: 'إشراف متخصص', en: 'Expert Supervision' },
      description: {
        ar: 'إشراف من محللي سلوك معتمدين  لدعم رحلتك المهنية',
        en: 'Supervision from certified  behavior analysts to support your career',
      },
      color: 'bg-amber-500',
    },
    {
      icon: Users,
      title: { ar: 'مجتمع الأخصائيين', en: 'Specialists Community' },
      description: {
        ar: 'انضم لمجتمع من الأخصائيين وتبادل الخبرات في مجال تحليل السلوك',
        en: 'Join a community of specialists and share experiences in behavior analysis',
      },
      color: 'bg-teal-500',
    },
    {
      icon: BookOpen,
      title: { ar: 'تدريب عملي', en: 'Practical Training' },
      description: {
        ar: 'حالات دراسية وتطبيقات عملية لتعزيز مهاراتك العلاجية',
        en: 'Case studies and practical applications to enhance your therapeutic skills',
      },
      color: 'bg-yellow-500',
    },
    {
      icon: Globe,
      title: { ar: 'عربي وإنجليزي', en: 'Arabic & English' },
      description: {
        ar: 'جميع البرامج متاحة باللغتين العربية والإنجليزية',
        en: 'All programs available in both Arabic and English languages',
      },
      color: 'bg-rose-500',
    },
    {
      icon: GraduationCap,
      title: { ar: 'مسارات مهنية', en: 'Career Paths' },
      description: {
        ar: 'مسارات متكاملة من بناء مسيرتك المهنية',
        en: 'Complete paths  to build your professional career',
      },
      color: 'bg-indigo-500',
    },
  ];

  return (
    <section className="py-20 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
            {language === 'ar' ? 'مميزاتنا' : 'Our Features'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'لماذا تختار مسارات؟' : 'Why Choose Masarat?'}
          </h2>
          <p className="text-gray-600 text-lg">
            {language === 'ar'
              ? 'نقدم لك تجربة تعليمية متخصصة في تحليل السلوك التطبيقي بمعايير عالمية'
              : 'We offer you a specialized learning experience in Applied Behavior Analysis with global standards'}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 group"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-5 transform group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {feature.title[language]}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description[language]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
