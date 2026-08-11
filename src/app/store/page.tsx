'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ikUrl } from '@/lib/imagekit';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  BookOpen,
  Search,
  Filter,
  Star,
  ShoppingCart,
  Download,
  User,
  FileText,
  Loader2,
  ChevronDown,
  BookMarked,
  Tag,
} from 'lucide-react';

interface Book {
  id: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  author: { ar: string; en: string };
  cover: string | null;
  price: number;
  originalPrice: number | null;
  pages: number | null;
  language: string;
  isbn: string | null;
  publishedYear: number | null;
  isFeatured: boolean;
  downloads: number;
  purchaseCount: number;
  category: {
    id: string;
    name: { ar: string; en: string };
  } | null;
}

interface Category {
  id: string;
  name: { ar: string; en: string };
  icon: string | null;
  bookCount: number;
}

export default function StorePage() {
  const { language } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory, sortBy]);

  const fetchData = async () => {
    try {
      const [booksRes, categoriesRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/books/categories'),
      ]);

      const booksResult = await booksRes.json();
      const categoriesResult = await categoriesRes.json();

      if (booksResult.success) {
        setBooks(booksResult.data);
      }
      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (sortBy) params.append('sort', sortBy);

      const response = await fetch(`/api/books?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setBooks(result.data);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const filteredBooks = books.filter((book) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      book.title.ar.toLowerCase().includes(query) ||
      book.title.en.toLowerCase().includes(query) ||
      book.author.ar.toLowerCase().includes(query) ||
      book.author.en.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar variant="solid" />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="solid" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <BookMarked className="w-5 h-5" />
              <span className="text-sm font-medium">
                {language === 'ar' ? 'مكتبة الكتب الإلكترونية' : 'Digital Bookstore'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {language === 'ar' ? 'متجر الكتب' : 'Book Store'}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              {language === 'ar'
                ? 'اكتشف مجموعة واسعة من الكتب المتخصصة في تحليل السلوك التطبيقي'
                : 'Discover a wide collection of specialized books in Applied Behavior Analysis'}
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'ابحث عن كتاب...' : 'Search for a book...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-12 pe-4 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                !selectedCategory
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {language === 'ar' ? 'جميع الكتب' : 'All Books'}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.icon && <span>{category.icon}</span>}
                {category.name[language]}
                <span className="text-xs opacity-75">({category.bookCount})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-gray-600">
              {filteredBooks.length} {language === 'ar' ? 'كتاب' : 'books'}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-2 px-4 py-2 border rounded-lg"
              >
                <Filter className="w-4 h-4" />
                {language === 'ar' ? 'فلترة' : 'Filter'}
              </button>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pe-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="newest">{language === 'ar' ? 'الأحدث' : 'Newest'}</option>
                  <option value="popular">{language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}</option>
                  <option value="price-low">{language === 'ar' ? 'السعر: من الأقل' : 'Price: Low to High'}</option>
                  <option value="price-high">{language === 'ar' ? 'السعر: من الأعلى' : 'Price: High to Low'}</option>
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Books Grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} language={language} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'ar' ? 'لا توجد كتب' : 'No books found'}
              </h3>
              <p className="text-gray-500">
                {language === 'ar'
                  ? 'جرب البحث بكلمات مختلفة أو تصفح جميع الكتب'
                  : 'Try different search terms or browse all books'}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Book Card Component
function BookCard({
  book,
  language,
  featured = false,
}: {
  book: Book;
  language: 'ar' | 'en';
  featured?: boolean;
}) {
  const hasDiscount = book.originalPrice && book.originalPrice > book.price;
  const discountPercent = hasDiscount
    ? Math.round(((book.originalPrice! - book.price) / book.originalPrice!) * 100)
    : 0;

  return (
    <Link href={`/store/${book.id}`}>
      <div
        className={`group bg-white rounded-3xl overflow-hidden h-full border border-gray-100 hover:border-blue-200 transition-all duration-500 hover:-translate-y-2 ${
          featured
            ? 'shadow-lg shadow-blue-100 ring-2 ring-blue-400/50'
            : 'shadow-sm hover:shadow-2xl hover:shadow-blue-100'
        }`}
      >
        {/* Cover Image */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 via-gray-50 to-gray-100 overflow-hidden">
          {book.cover ? (
            <img
              src={ikUrl(book.cover, { width: 600 })}
              alt={book.title[language]}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center shadow-sm">
                <BookOpen className="w-10 h-10 text-blue-300" />
              </div>
              <span className="text-sm text-gray-400 font-medium">
                {language === 'ar' ? 'لا توجد صورة' : 'No Cover'}
              </span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-4 start-4 flex flex-col gap-2">
            {featured && (
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-blue-500/30">
                <Star className="w-3.5 h-3.5 fill-current" />
                {language === 'ar' ? 'مميز' : 'Featured'}
              </span>
            )}
            {hasDiscount && (
              <span className="bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/30">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Price Badge (Top Right) */}
          <div className="absolute top-4 end-4">
            {book.price > 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  ${book.price.toFixed(0)}
                </span>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl px-3 py-2 shadow-lg shadow-emerald-500/30">
                <span className="text-sm font-bold text-white">
                  {language === 'ar' ? 'مجاني' : 'FREE'}
                </span>
              </div>
            )}
          </div>

          {/* Quick Action */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <span className="flex items-center justify-center gap-2 bg-white text-gray-900 w-full py-3 rounded-xl font-semibold shadow-xl hover:bg-blue-600 hover:text-white transition-colors">
              <ShoppingCart className="w-4 h-4" />
              {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          {book.category && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full mb-3 border border-blue-100">
              <Tag className="w-3 h-3" />
              {book.category.name[language]}
            </span>
          )}

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
            {book.title[language]}
          </h3>

          {/* Author */}
          <p className="text-sm text-gray-500 flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-gray-400" />
            </span>
            <span className="font-medium">{book.author[language]}</span>
          </p>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-4">
            {/* Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {book.pages && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">{book.pages}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                  <Download className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium">{book.downloads}</span>
                </span>
              </div>

              {/* Original Price (if discount) */}
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through font-medium">
                  ${book.originalPrice!.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
