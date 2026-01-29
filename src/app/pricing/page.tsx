'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { pricingPlans } from '@/lib/data';
import { Check, Sparkles, Zap, Building2 } from 'lucide-react';

export default function PricingPage() {
  const { language, t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const planIcons = [Zap, Sparkles, Building2];

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6">
            {language === 'ar' ? 'خطط مرنة تناسب الجميع' : 'Flexible plans for everyone'}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('pricingTitle')}
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-10">
            {language === 'ar'
              ? 'اختر الخطة المناسبة لك وابدأ رحلة التعلم. جميع الخطط تشمل ضمان استرداد المال لمدة 30 يوم.'
              : 'Choose the plan that suits you and start your learning journey. All plans include a 30-day money-back guarantee.'}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-primary-600'
                  : 'text-white hover:text-blue-100'
              }`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-primary-600'
                  : 'text-white hover:text-blue-100'
              }`}
            >
              {t('yearly')}
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {language === 'ar' ? 'وفر 20%' : 'Save 20%'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 -mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => {
              const Icon = planIcons[index];
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transition-transform hover:-translate-y-2 ${
                    plan.isPopular ? 'ring-4 ring-primary-500 ring-opacity-50' : ''
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 start-0 end-0 bg-primary-600 text-white text-center py-2 text-sm font-medium">
                      {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                    </div>
                  )}

                  <div className={`p-8 ${plan.isPopular ? 'pt-14' : ''}`}>
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                        plan.isPopular
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-100 text-primary-600'
                      }`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name[language]}
                    </h3>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">
                          ${plan.price[billingCycle]}
                        </span>
                        <span className="text-gray-500">
                          /{billingCycle === 'monthly'
                            ? language === 'ar'
                              ? 'شهر'
                              : 'month'
                            : language === 'ar'
                            ? 'سنة'
                            : 'year'}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-sm text-green-600 mt-1">
                          {language === 'ar'
                            ? `وفر $${(plan.price.monthly * 12 - plan.price.yearly).toFixed(0)} سنوياً`
                            : `Save $${(plan.price.monthly * 12 - plan.price.yearly).toFixed(0)} yearly`}
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      className={`w-full py-4 rounded-xl font-semibold transition-all ${
                        plan.isPopular
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {t('subscribe')}
                    </button>

                    {/* Features */}
                    <ul className="mt-8 space-y-4">
                      {plan.features[language].map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              plan.isPopular
                                ? 'bg-primary-100 text-primary-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </div>
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">{t('faq')}</h2>
            <p className="section-subtitle">
              {language === 'ar'
                ? 'إجابات على الأسئلة الأكثر شيوعاً'
                : 'Answers to frequently asked questions'}
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: {
                  ar: 'هل يمكنني تغيير خطتي لاحقاً؟',
                  en: 'Can I change my plan later?',
                },
                a: {
                  ar: 'نعم، يمكنك الترقية أو تخفيض خطتك في أي وقت. سيتم احتساب الفرق بشكل تناسبي.',
                  en: 'Yes, you can upgrade or downgrade your plan at any time. The difference will be prorated.',
                },
              },
              {
                q: {
                  ar: 'ما هي طرق الدفع المتاحة؟',
                  en: 'What payment methods are available?',
                },
                a: {
                  ar: 'نقبل جميع بطاقات الائتمان الرئيسية، PayPal، وApple Pay.',
                  en: 'We accept all major credit cards, PayPal, and Apple Pay.',
                },
              },
              {
                q: {
                  ar: 'هل هناك ضمان لاسترداد المال؟',
                  en: 'Is there a money-back guarantee?',
                },
                a: {
                  ar: 'نعم، نقدم ضمان استرداد كامل المبلغ خلال 30 يوم من تاريخ الاشتراك.',
                  en: 'Yes, we offer a full refund within 30 days of subscription.',
                },
              },
              {
                q: {
                  ar: 'هل يمكنني إلغاء اشتراكي؟',
                  en: 'Can I cancel my subscription?',
                },
                a: {
                  ar: 'نعم، يمكنك إلغاء اشتراكك في أي وقت من لوحة التحكم الخاصة بك.',
                  en: 'Yes, you can cancel your subscription at any time from your dashboard.',
                },
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-gray-50 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                  {faq.q[language]}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-600">
                  {faq.a[language]}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'ar'
              ? 'لا تزال لديك أسئلة؟'
              : 'Still have questions?'}
          </h2>
          <p className="text-gray-600 mb-8">
            {language === 'ar'
              ? 'تواصل مع فريق الدعم الخاص بنا وسنساعدك في اختيار الخطة المناسبة.'
              : 'Contact our support team and we will help you choose the right plan.'}
          </p>
          <button className="btn-primary">
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
