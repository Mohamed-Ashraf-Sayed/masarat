'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CourseCard from '@/components/CourseCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Filter, X, ChevronDown, Loader2 } from 'lucide-react';

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
  category?: string;
  instructor: {
    id: string;
    name: string;
    avatar: string;
  };
  isFeatured: boolean;
  isNew: boolean;
}

interface Category {
  id: string;
  name: { ar: string; en: string };
  icon?: string;
  color?: string;
  coursesCount?: number;
}

export default function CoursesPage() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const instructorIdFromUrl = searchParams.get('instructor');

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(instructorIdFromUrl);
  const [instructorName, setInstructorName] = useState<string>('');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  const levels = [
    { id: 'all', name: { ar: 'جميع المستويات', en: 'All Levels' } },
    { id: 'BEGINNER', name: { ar: 'مبتدئ', en: 'Beginner' } },
    { id: 'INTERMEDIATE', name: { ar: 'متوسط', en: 'Intermediate' } },
    { id: 'ADVANCED', name: { ar: 'متقدم', en: 'Advanced' } },
  ];

  const sortOptions = [
    { id: 'popular', name: { ar: 'الأكثر شعبية', en: 'Most Popular' } },
    { id: 'newest', name: { ar: 'الأحدث', en: 'Newest' } },
    { id: 'rating', name: { ar: 'الأعلى تقييماً', en: 'Highest Rated' } },
    { id: 'price-low', name: { ar: 'السعر: من الأقل', en: 'Price: Low to High' } },
    { id: 'price-high', name: { ar: 'السعر: من الأعلى', en: 'Price: High to Low' } },
  ];

  // Update instructor filter when URL changes
  useEffect(() => {
    setSelectedInstructor(instructorIdFromUrl);
  }, [instructorIdFromUrl]);

  // Fetch courses and categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesRes, categoriesRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/categories'),
        ]);

        const coursesData = await coursesRes.json();
        const categoriesData = await categoriesRes.json();

        if (coursesData.success) {
          setCourses(coursesData.data);

          // Get instructor name if filtered
          if (selectedInstructor && coursesData.data.length > 0) {
            const instructorCourse = coursesData.data.find(
              (c: Course) => c.instructor.id === selectedInstructor
            );
            if (instructorCourse) {
              setInstructorName(instructorCourse.instructor.name);
            }
          }
        }

        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedInstructor]);

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Filter by instructor
    if (selectedInstructor) {
      result = result.filter((course) => course.instructor.id === selectedInstructor);
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (course) =>
          course.title[language].toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description[language].toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((course) => course.category === selectedCategory);
    }

    // Filter by level
    if (selectedLevel !== 'all') {
      result = result.filter((course) => course.level === selectedLevel);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.studentsCount - a.studentsCount);
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [courses, searchQuery, selectedCategory, selectedLevel, selectedInstructor, sortBy, language]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedInstructor(null);
    setInstructorName('');
    setSortBy('popular');
    // Clear URL params
    window.history.replaceState({}, '', '/courses');
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all' || selectedInstructor;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {selectedInstructor && instructorName
                ? (language === 'ar' ? `دورات ${instructorName}` : `Courses by ${instructorName}`)
                : (language === 'ar' ? 'استكشف دوراتنا' : 'Explore Our Courses')}
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              {selectedInstructor && instructorName
                ? (language === 'ar'
                    ? `تصفح جميع الدورات المقدمة من ${instructorName}`
                    : `Browse all courses offered by ${instructorName}`)
                : (language === 'ar'
                    ? 'اختر من بين مئات الدورات في مختلف المجالات واكتسب مهارات جديدة'
                    : 'Choose from hundreds of courses in various fields and acquire new skills')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full ps-12 pe-4 py-4 rounded-2xl border-0 shadow-lg focus:ring-4 focus:ring-primary-300 outline-none text-gray-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <Filter className="w-5 h-5" />
              {language === 'ar' ? 'الفلاتر' : 'Filters'}
            </button>

            {/* Desktop Filters */}
            <div
              className={`${
                showFilters ? 'flex' : 'hidden'
              } lg:flex flex-col lg:flex-row gap-4`}
            >
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white px-4 py-3 pe-10 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none cursor-pointer"
                >
                  <option value="all">
                    {language === 'ar' ? 'جميع التخصصات' : 'All Categories'}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name[language]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Level Filter */}
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="appearance-none bg-white px-4 py-3 pe-10 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none cursor-pointer"
                >
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name[language]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-3 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                  {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                </button>
              )}
            </div>

            {/* Sort & Results Count */}
            <div className="flex items-center gap-4">
              <span className="text-gray-500">
                {filteredCourses.length}{' '}
                {language === 'ar' ? 'دورة' : 'courses'}
              </span>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white px-4 py-3 pe-10 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name[language]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          )}

          {/* Courses Grid */}
          {!loading && filteredCourses.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredCourses.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('noResults')}
              </h3>
              <p className="text-gray-500 mb-6">
                {language === 'ar'
                  ? 'جرب تعديل الفلاتر أو البحث بكلمات مختلفة'
                  : 'Try adjusting the filters or search with different keywords'}
              </p>
              <button onClick={clearFilters} className="btn-primary">
                {language === 'ar' ? 'مسح جميع الفلاتر' : 'Clear All Filters'}
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
