'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/lib/data';
import {
  Code,
  Palette,
  TrendingUp,
  Briefcase,
  Globe,
  BarChart,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Code,
  Palette,
  TrendingUp,
  Briefcase,
  Globe,
  BarChart,
};

export default function CategoriesSection() {
  const { language, t, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="inline-block px-4 py-2 bg-primary-100 text-primary-600 rounded-full text-sm font-semibold mb-4">
              {language === 'ar' ? 'التخصصات' : 'Categories'}
            </span>
            <h2 className="section-title">
              {t('categoriesTitle')}
            </h2>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:gap-3 transition-all"
          >
            {language === 'ar' ? 'عرض جميع التخصصات' : 'View All Categories'}
            <Arrow className="w-5 h-5" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon] || Code;
            return (
              <Link
                key={category.id}
                href={`/courses?category=${category.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-xl border-2 border-gray-100 hover:border-primary-200">
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  ></div>

                  <div className="relative flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}
                    >
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {category.name[language]}
                      </h3>
                      <p className="text-gray-500 mt-1">
                        {category.coursesCount} {t('coursesCount')}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                      <Arrow className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
