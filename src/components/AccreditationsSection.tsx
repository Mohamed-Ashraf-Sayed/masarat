'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Award, CheckCircle2, Shield, BadgeCheck } from 'lucide-react';

export default function AccreditationsSection() {
  const { language } = useLanguage();

  const accreditations = [
    {
      id: 1,
      name: { ar: 'QABA', en: 'QABA' },
      fullName: {
        ar: 'مزود معتمد للتعليم المستمر',
        en: 'Continuing Education Approved Provider'
      },
      description: {
        ar: 'مزود معتمد لبرامج التعليم المستمر من QABA',
        en: 'Approved provider for QABA continuing education programs'
      },
      logo: '/images/accreditations/qaba-ce.jpeg',
      color: 'from-blue-800 to-blue-900',
    },
    {
      id: 2,
      name: { ar: 'QABA', en: 'QABA' },
      fullName: {
        ar: 'مزود معتمد لبرامج الصحة السلوكية',
        en: 'Behavioral Health Credentialing Approved Coursework Provider'
      },
      description: {
        ar: 'مزود معتمد لبرامج اعتماد الصحة السلوكية',
        en: 'Approved coursework provider for behavioral health credentialing'
      },
      logo: '/images/accreditations/qaba-bh.jpeg',
      color: 'from-blue-800 to-blue-900',
    },
    {
      id: 3,
      name: { ar: 'IBAO', en: 'IBAO' },
      fullName: {
        ar: 'مزود محتوى معتمد - محلل سلوك دولي',
        en: 'Approved Content Provider - International Behavior Analyst'
      },
      description: {
        ar: 'مزود محتوى معتمد من المنظمة الدولية لتحليل السلوك',
        en: 'Approved content provider by International Behavior Analysis Organization'
      },
      logo: '/images/accreditations/ibao-acp.jpeg',
      color: 'from-green-700 to-green-800',
    },
    {
      id: 4,
      name: { ar: 'IBAO', en: 'IBAO' },
      fullName: {
        ar: 'مزود ساعات التعليم المستمر',
        en: 'CEU Provider - International Behavior Analysis Organization'
      },
      description: {
        ar: 'مزود معتمد لساعات التعليم المستمر من المنظمة الدولية لتحليل السلوك',
        en: 'Approved CEU provider by International Behavior Analysis Organization'
      },
      logo: '/images/accreditations/ibao-ceu.jpeg',
      color: 'from-purple-600 to-purple-700',
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
          {accreditations.map((accreditation) => (
            <div
              key={accreditation.id}
              className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${accreditation.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              {/* Logo */}
              <div className="w-full h-40 rounded-xl overflow-hidden mb-4 flex items-center justify-center bg-white p-2">
                <img
                  src={accreditation.logo}
                  alt={accreditation.name[language]}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Content */}
              <p className="text-sm text-[#4485b5] font-medium text-center">
                {accreditation.fullName[language]}
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

      </div>
    </section>
  );
}
