'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import CourseCard from './CourseCard';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface Course {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  thumbnail: string;
  price: number;
  originalPrice?: number;
  duration: number;
  lessonsCount: number;
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  level: string;
  instructor: {
    id: string;
    name: string;
    avatar: string;
  };
  isFeatured: boolean;
  isNew: boolean;
}

export default function CoursesSection() {
  const { language, t, direction } = useLanguage();
  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // جلب كل الدورات المنشورة (الأحدث أولاً)
        const response = await fetch('/api/courses?limit=6');
        const data = await response.json();

        if (data.success) {
          setCourses(data.data);
        } else {
          setError(data.error || 'Failed to fetch courses');
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
              {language === 'ar' ? 'البرامج التدريبية' : 'Training Programs'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'برامجنا المعتمدة' : 'Our Accredited Programs'}
            </h2>
            <p className="text-gray-600">
              {language === 'ar'
                ? 'برامج تدريبية معتمدة دولياً في تحليل السلوك التطبيقي'
                : 'Internationally accredited training programs in Applied Behavior Analysis'}
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-[#4485b5] font-semibold hover:gap-3 transition-all"
          >
            {language === 'ar' ? 'عرض الكل' : 'View All'}
            <Arrow className="w-5 h-5" />
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && courses.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">
              {language === 'ar' ? 'لا توجد دورات متاحة حالياً' : 'No courses available at the moment'}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/courses" className="inline-flex items-center gap-2 px-8 py-4 bg-[#4485b5] text-white font-semibold rounded-full hover:bg-[#3a7299] transition-all shadow-lg hover:shadow-xl">
            {language === 'ar' ? 'استكشف جميع البرامج' : 'Explore All Programs'}
            <Arrow className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
