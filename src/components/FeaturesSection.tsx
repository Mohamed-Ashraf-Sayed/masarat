'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  GraduationCap,
  Award,
  Clock,
  Trophy,
  MonitorPlay,
  Users,
  BookOpen,
  Calendar,
  Globe,
  ShieldCheck,
} from 'lucide-react';

export default function FeaturesSection() {
  const { language } = useLanguage();

  const features = [
    {
      icon: MonitorPlay,
      title: { ar: 'دورات إلكترونية تفاعلية', en: 'Interactive Online Courses' },
      description: {
        ar: 'مئات الدورات في تخصصات متنوعة مع فيديوهات عالية الجودة وتمارين تفاعلية',
        en: 'Hundreds of courses in various specializations with high-quality videos and interactive exercises',
      },
      color: 'bg-blue-500',
    },
    {
      icon: Award,
      title: { ar: 'شهادات إتمام معتمدة', en: 'Accredited Completion Certificates' },
      description: {
        ar: 'احصل على شهادة رقمية قابلة للتحقق عند إتمام أي دورة بنجاح',
        en: 'Earn a verifiable digital certificate upon successful completion of any course',
      },
      color: 'bg-emerald-500',
    },
    {
      icon: Calendar,
      title: { ar: 'فعاليات ومؤتمرات', en: 'Events & Conferences' },
      description: {
        ar: 'شارك في فعاليات تدريبية حية، ندوات، ومؤتمرات متخصصة على مدار العام',
        en: 'Participate in live training events, webinars, and specialized conferences throughout the year',
      },
      color: 'bg-cyan-500',
    },
    {
      icon: BookOpen,
      title: { ar: 'مكتبة الكتب الرقمية', en: 'Digital Books Library' },
      description: {
        ar: 'تصفح مئات الكتب والمراجع المتخصصة — مجانية ومدفوعة — في متناول يدك',
        en: 'Browse hundreds of specialized books and references — free and paid — at your fingertips',
      },
      color: 'bg-amber-500',
    },
    {
      icon: Trophy,
      title: { ar: 'مسابقات تعليمية', en: 'Educational Competitions' },
      description: {
        ar: 'شارك في المسابقات التعليمية، تحدَّ نفسك، واحصل على جوائز قيّمة',
        en: 'Join educational competitions, challenge yourself, and win valuable prizes',
      },
      color: 'bg-yellow-500',
    },
    {
      icon: Users,
      title: { ar: 'مدربون خبراء', en: 'Expert Instructors' },
      description: {
        ar: 'تعلم على يد نخبة من المدربين المعتمدين ذوي الخبرة الميدانية والأكاديمية',
        en: 'Learn from elite certified trainers with field and academic expertise',
      },
      color: 'bg-teal-500',
    },
    {
      icon: Globe,
      title: { ar: 'ثنائي اللغة', en: 'Bilingual Platform' },
      description: {
        ar: 'المنصة والمحتوى متاحان بالكامل باللغتين العربية والإنجليزية',
        en: 'Platform and content fully available in both Arabic and English',
      },
      color: 'bg-rose-500',
    },
    {
      icon: Clock,
      title: { ar: 'تعلم في أي وقت ومكان', en: 'Learn Anytime, Anywhere' },
      description: {
        ar: 'وصول غير محدود على مدار الساعة من أي جهاز — هاتف، تابلت، أو كمبيوتر',
        en: 'Unlimited 24/7 access from any device — phone, tablet, or computer',
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
            {language === 'ar' ? 'كل ما تحتاجه في منصة واحدة' : 'Everything You Need in One Platform'}
          </h2>
          <p className="text-gray-600 text-lg">
            {language === 'ar'
              ? 'منصة مسارات تجمع التعليم، التدريب، والمحتوى المتخصص لتمنحك تجربة تعلم متكاملة'
              : 'Masarat platform combines education, training, and specialized content to give you a complete learning experience'}
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
