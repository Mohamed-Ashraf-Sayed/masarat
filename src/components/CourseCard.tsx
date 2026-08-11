'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ikUrl } from '@/lib/imagekit';
import { Clock, BookOpen, Users, Star, Play } from 'lucide-react';

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
  isFeatured?: boolean;
  isNew?: boolean;
}

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const { language, t } = useLanguage();

  const getLevelText = (level: string) => {
    const levels: { [key: string]: { ar: string; en: string } } = {
      beginner: { ar: 'مبتدئ', en: 'Beginner' },
      BEGINNER: { ar: 'مبتدئ', en: 'Beginner' },
      intermediate: { ar: 'متوسط', en: 'Intermediate' },
      INTERMEDIATE: { ar: 'متوسط', en: 'Intermediate' },
      advanced: { ar: 'متقدم', en: 'Advanced' },
      ADVANCED: { ar: 'متقدم', en: 'Advanced' },
    };
    return levels[level]?.[language] || level;
  };

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      beginner: 'bg-green-100 text-green-700',
      BEGINNER: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700',
      ADVANCED: 'bg-red-100 text-red-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  const defaultThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
  const defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150';

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="card card-hover group">
        {/* Thumbnail */}
        <div className="relative overflow-hidden">
          <img
            src={ikUrl(course.thumbnail || defaultThumbnail, { width: 600 })}
            alt={course.title[language]}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultThumbnail;
            }}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-6 h-6 text-primary-600 ms-1" />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-4 start-4 flex flex-col gap-2">
            {course.isNew && (
              <span className="badge bg-primary-600 text-white">
                {language === 'ar' ? 'جديد' : 'New'}
              </span>
            )}
            {course.isFeatured && (
              <span className="badge bg-yellow-500 text-white">
                {language === 'ar' ? 'مميز' : 'Featured'}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="absolute top-4 end-4">
            <div className="bg-white rounded-xl px-3 py-1.5 shadow-lg">
              {course.price === 0 ? (
                <span className="text-green-600 font-bold">{t('free')}</span>
              ) : (
                <div className="flex items-center gap-2">
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="text-gray-400 text-sm line-through">
                      ${course.originalPrice}
                    </span>
                  )}
                  <span className="text-primary-600 font-bold">${course.price}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Level Badge */}
          <span className={`badge ${getLevelColor(course.level)} mb-3`}>
            {getLevelText(course.level)}
          </span>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {course.title[language]}
          </h3>

          {/* Description */}
          <p className="text-gray-500 text-sm mb-4 line-clamp-2">
            {course.description[language]}
          </p>

          {/* Instructor */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={ikUrl(course.instructor?.avatar || defaultAvatar, { width: 100 })}
              alt={course.instructor?.name || 'Instructor'}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultAvatar;
              }}
            />
            <span className="text-sm text-gray-600">{course.instructor?.name || 'Unknown'}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration} {t('hours')}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{course.lessonsCount} {t('lessons')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{course.studentsCount?.toLocaleString() || 0}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-gray-900">{course.rating?.toFixed(1) || '0.0'}</span>
            </div>
            <span className="text-gray-400">
              ({course.reviewsCount?.toLocaleString() || 0} {t('reviews')})
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
