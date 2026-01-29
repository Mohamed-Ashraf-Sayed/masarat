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
              <p className="text-gray-600 leading-relaxed mb-6">
                &ldquo;{testimonial.content[language]}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary-100"
                />
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-gray-500 text-sm">
                    {testimonial.role[language]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 bg-gradient-to-r from-primary-600 to-primary-400 rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">4.9</div>
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                ))}
              </div>
              <p className="text-blue-100 text-sm">
                {language === 'ar' ? 'متوسط التقييم' : 'Average Rating'}
              </p>
            </div>
            <div className="text-center text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
              <p className="text-blue-100">
                {language === 'ar' ? 'طالب سعيد' : 'Happy Students'}
              </p>
            </div>
            <div className="text-center text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">200+</div>
              <p className="text-blue-100">
                {language === 'ar' ? 'دورة متاحة' : 'Available Courses'}
              </p>
            </div>
            <div className="text-center text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <p className="text-blue-100">
                {language === 'ar' ? 'نسبة الرضا' : 'Satisfaction Rate'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
