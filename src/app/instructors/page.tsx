'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ikUrl } from '@/lib/imagekit';
import {
  BookOpen,
  Users,
  Star,
  Loader2,
  Mail,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  coursesCount: number;
  studentsCount: number;
  rating: number;
}

export default function InstructorsPage() {
  const { language, direction } = useLanguage();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  const Arrow = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await fetch('/api/instructors');
        const result = await response.json();
        if (result.success) {
          setInstructors(result.data);
        }
      } catch (error) {
        console.error('Error fetching instructors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {language === 'ar' ? 'مدربونا المتميزون' : 'Our Expert Instructors'}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'تعلم من أفضل الخبراء والمتخصصين في مجالاتهم'
              : 'Learn from the best experts and specialists in their fields'}
          </p>
        </div>
      </section>

      {/* Instructors Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : instructors.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {instructors.map((instructor) => (
                <div
                  key={instructor.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow text-center"
                >
                  {/* Avatar */}
                  <div className="w-24 h-24 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                    {instructor.avatar ? (
                      <img
                        src={ikUrl(instructor.avatar, { width: 200 })}
                        alt={instructor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-primary-600 text-3xl font-bold">
                        {instructor.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {instructor.name}
                  </h3>

                  {/* Bio */}
                  {instructor.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {instructor.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-primary-600 mb-1">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-bold">{instructor.coursesCount}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {language === 'ar' ? 'دورة' : 'Courses'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="font-bold">{instructor.studentsCount}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {language === 'ar' ? 'طالب' : 'Students'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold">{instructor.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {language === 'ar' ? 'التقييم' : 'Rating'}
                      </p>
                    </div>
                  </div>

                  {/* View Courses Button */}
                  <Link
                    href={`/courses?instructor=${instructor.id}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors font-medium"
                  >
                    {language === 'ar' ? 'عرض الدورات' : 'View Courses'}
                    <Arrow className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'لا يوجد مدربين حالياً' : 'No instructors available'}
              </h3>
              <p className="text-gray-500">
                {language === 'ar'
                  ? 'سيتم إضافة المدربين قريباً'
                  : 'Instructors will be added soon'}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
