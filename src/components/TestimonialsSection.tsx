'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { testimonials } from '@/lib/data';
import { Star, Quote } from 'lucide-react';

export default function TestimonialsSection() {
  const { language, t } = useLanguage();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mb-4">
            {language === 'ar' ? 'آراء الطلاب' : 'Student Reviews'}
          </span>
          <h2 className="section-title">
            {t('testimonialsTitle')}
          </h2>
          <p className="section-subtitle">
            {language === 'ar'
              ? 'اكتشف ما يقوله طلابنا عن تجربتهم في التعلم معنا'
              : 'Discover what our students say about their learning experience with us'}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 end-6 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Quote className="w-6 h-6 text-primary-600" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < testimonial.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-600 leading-relaxed">
                &ldquo;{testimonial.content[language]}&rdquo;
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
