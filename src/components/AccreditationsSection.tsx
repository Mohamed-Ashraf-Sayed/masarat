'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Award, CheckCircle2, Shield, BadgeCheck } from 'lucide-react';

export default function AccreditationsSection() {
  const { language } = useLanguage();

  const accreditations = [
    {
      id: 2,
      name: { ar: 'QABA', en: 'QABA' },
      fullName: {
        ar: 'مجلس اعتماد محللي السلوك المؤهلين',
        en: 'Qualified Applied Behavior Analysis Credentialing Board'
      },
      description: {
        ar: 'مزود معتمد لبرامج تدريب محللي السلوك',
        en: 'Approved training provider for behavior analyst programs'
      },
      logo: '/images/accreditations/qaba-logo.svg',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      id: 3,
      name: { ar: 'IBAO', en: 'IBAO' },
      fullName: {
        ar: 'المنظمة الدولية لمحللي السلوك',
        en: 'International Behavior Analysis Organization'
      },
      description: {
        ar: 'مزود معتمد في المنظمة الدولية لتحليل السلوك',
        en: 'Approved provider in the International Behavior Analysis Organization'
      },
      logo: '/images/accreditations/ibao-logo.svg',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  const benefits = [
    {
      icon: Award,
      title: { ar: 'شهادات معتمدة دولياً', en: 'Internationally Recognized Certificates' },
      description: {
        ar: 'جميع شهاداتنا معترف بها دولياً',
        en: 'All our certificates are internationally recognized'
      },
    },
    {
      icon: CheckCircle2,
      title: { ar: 'ساعات تعليم مستمر', en: 'Continuing Education Hours' },
      description: {
        ar: 'احصل على ساعات CEU معتمدة',
        en: 'Earn approved CEU hours'
      },
    },
    {
      icon: Shield,
      title: { ar: 'جودة مضمونة', en: 'Quality Guaranteed' },
      description: {
        ar: 'محتوى تدريبي عالي الجودة',
        en: 'High-quality training content'
      },
    },
    {
      icon: BadgeCheck,
      title: { ar: 'اعتراف مهني', en: 'Professional Recognition' },
      description: {
        ar: 'معترف به من الجهات المهنية',
        en: 'Recognized by professional bodies'
      },
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
            {language === 'ar' ? 'اعتماداتنا' : 'Our Accreditations'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'الاعتمادات والشهادات' : 'Accreditations & Certifications'}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'نفخر بحصولنا على اعتمادات من أبرز الجهات الدولية في مجال تحليل السلوك التطبيقي'
              : 'We are proud to be accredited by leading international bodies in Applied Behavior Analysis'}
          </p>
        </div>

        {/* Accreditations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
          {accreditations.map((accreditation) => (
            <div
              key={accreditation.id}
              className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${accreditation.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              {/* Logo/Icon Container */}
              <div className="w-16 h-16 rounded-xl overflow-hidden mb-4 shadow-lg">
                <img
                  src={accreditation.logo}
                  alt={accreditation.name[language]}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {accreditation.name[language]}
              </h3>
              <p className="text-sm text-[#4485b5] font-medium mb-2">
                {accreditation.fullName[language]}
              </p>
              <p className="text-gray-600 text-sm">
                {accreditation.description[language]}
              </p>

              {/* Verified Badge */}
              <div className="mt-4 flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {language === 'ar' ? 'معتمد' : 'Verified'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="bg-gradient-to-br from-[#4485b5] to-[#2d5a7b] rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            {language === 'ar' ? 'مميزات الاعتمادات' : 'Benefits of Our Accreditations'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center hover:bg-white/20 transition-colors"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">
                  {benefit.title[language]}
                </h4>
                <p className="text-white/80 text-sm">
                  {benefit.description[language]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">
            {language === 'ar' ? 'موثوق من قبل أكثر من 5000 متدرب' : 'Trusted by over 5,000 trainees'}
          </p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <div className="text-gray-400">
              <Shield className="w-8 h-8 mx-auto mb-1" />
              <span className="text-xs">QABA</span>
            </div>
            <div className="text-gray-400">
              <BadgeCheck className="w-8 h-8 mx-auto mb-1" />
              <span className="text-xs">IBAO</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
