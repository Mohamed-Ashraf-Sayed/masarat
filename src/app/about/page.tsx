'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ikUrl } from '@/lib/imagekit';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Target,
  Eye,
  Heart,
  Users,
  BookOpen,
  Award,
  Globe,
  Zap,
  CheckCircle,
  ArrowLeft,
  Star,
  Sparkles,
  Shield,
  Clock,
  Headphones,
  GraduationCap,
  TrendingUp,
  Play,
} from 'lucide-react';

export default function AboutPage() {
  const { language, direction } = useLanguage();
  const Arrow = ArrowLeft;

  const stats = [
    {
      icon: Users,
      value: '50+',
      label: { ar: 'عدد المتدربين', en: 'Trainees' },
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: BookOpen,
      value: '500+',
      label: { ar: 'عدد ساعات التدريب', en: 'Training Hours' },
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Award,
      value: '200+',
      label: { ar: 'عدد الشهادات المصدرة', en: 'Certificates Issued' },
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Globe,
      value: '3',
      label: { ar: 'عدد المؤسسات', en: 'Institutions' },
      color: 'from-amber-500 to-amber-600',
    },
  ];

  const values = [
    {
      icon: Target,
      title: { ar: 'رسالتنا', en: 'Our Mission' },
      description: {
        ar: 'تمكين الأفراد والمؤسسات في مجال تحليل السلوك التطبيقي من خلال برامج تدريبية معتمدة دولياً، وتوفير بيئة تعليمية متميزة تساهم في بناء كوادر متخصصة.',
        en: 'Empowering individuals and organizations in Applied Behavior Analysis through internationally accredited training programs, providing an exceptional learning environment that contributes to building specialized professionals.',
      },
      color: 'bg-blue-500',
    },
    {
      icon: Eye,
      title: { ar: 'رؤيتنا', en: 'Our Vision' },
      description: {
        ar: 'أن نكون المنصة التدريبية الرائدة في العالم العربي في مجال تحليل السلوك التطبيقي، ونساهم في نشر الممارسات المبنية على الأدلة وتحسين جودة الخدمات المقدمة.',
        en: 'To be the leading training platform in the Arab world in Applied Behavior Analysis, contributing to spreading evidence-based practices and improving the quality of services provided.',
      },
      color: 'bg-emerald-500',
    },
    {
      icon: Heart,
      title: { ar: 'قيمنا', en: 'Our Values' },
      description: {
        ar: 'نؤمن بالجودة والتميز والنزاهة. نضع متدربينا في المقام الأول ونلتزم بأعلى معايير الأخلاقيات المهنية في جميع برامجنا التدريبية.',
        en: 'We believe in quality, excellence, and integrity. We put our trainees first and commit to the highest standards of professional ethics in all our training programs.',
      },
      color: 'bg-purple-500',
    },
  ];

  const features = [
    {
      icon: Award,
      title: { ar: 'شهادات معتمدة دولياً', en: 'Internationally Accredited Certificates' },
      description: { ar: 'معتمدون من   QABA و IBAO', en: 'Accredited by BACB, QABA & IBAO' },
    },
    {
      icon: GraduationCap,
      title: { ar: 'مدربون خبراء', en: 'Expert Instructors' },
      description: { ar: 'نخبة من الخبراء المعتمدين دولياً', en: 'Elite internationally certified experts' },
    },
    {
      icon: Clock,
      title: { ar: 'تعلم بمرونة', en: 'Flexible Learning' },
      description: { ar: 'تعلم في أي وقت ومن أي مكان', en: 'Learn anytime, anywhere' },
    },
    {
      icon: Headphones,
      title: { ar: 'دعم متواصل', en: 'Continuous Support' },
      description: { ar: 'فريق دعم فني متاح على مدار الساعة', en: '24/7 technical support team' },
    },
    {
      icon: Shield,
      title: { ar: 'جودة مضمونة', en: 'Quality Guaranteed' },
      description: { ar: 'محتوى تدريبي عالي الجودة', en: 'High-quality training content' },
    },
    {
      icon: TrendingUp,
      title: { ar: 'تطوير مستمر', en: 'Continuous Development' },
      description: { ar: 'ساعات تعليم مستمر CEU', en: 'Continuing Education Units (CEU)' },
    },
  ];

  const timeline = [
    {
      year: '2026',
      title: { ar: 'تأسيس المنصة', en: 'Platform Founded' },
      description: { ar: 'بدأنا رحلتنا لتقديم تدريب متميز في ABA', en: 'We started our journey to provide excellent ABA training' },
    },
    {
      year: '2025',
      title: { ar: 'الاعتماد الدولي', en: 'International Accreditation' },
      description: { ar: 'حصلنا على اعتماد IBA,QABA كمزود تعليم مستمر', en: 'Obtained IBA , QABA accreditation as a CE provider' },
    },
    {
      year: '2025',
      title: { ar: 'التوسع الإقليمي', en: 'Regional Expansion' },
      description: { ar: 'وصلنا إلى أكثر من 15 دولة عربية', en: 'Reached over 15 Arab countries' },
    },
    {
      year: '2025',
      title: { ar: '50 متدرب', en: '50 Trainees' },
      description: { ar: 'تجاوز عدد متدربينا 50  متدرب', en: 'Our trainees exceeded 10,000' },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="solid" />

      {/* Hero Section */}
      <section className="pt-28 pb-20 bg-gradient-to-br from-[#4485b5] via-[#3a7ca5] to-[#2d5a7b] relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6">
              {language === 'ar' ? 'تعرف علينا أكثر' : 'Get to Know Us'}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {language === 'ar' ? 'منصة مسارات للتدريب' : 'Masarat Training Platform'}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-8">
              {language === 'ar'
                ? 'منصة تدريبية رائدة متخصصة في تحليل السلوك التطبيقي (ABA)، نقدم برامج معتمدة دولياً من أفضل الخبراء والمتخصصين'
                : 'A leading training platform specialized in Applied Behavior Analysis (ABA), offering internationally accredited programs from the best experts and specialists'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/courses"
                className="px-8 py-4 bg-white text-[#4485b5] font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                {language === 'ar' ? 'استكشف الدورات' : 'Explore Courses'}
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500">{stat.label[language]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src={ikUrl('/images/hero.png', { width: 1200 })}
                alt="Our Story"
                className="rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -end-6 bg-gradient-to-br from-[#4485b5] to-[#2d5a7b] text-white p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8" />
                  <div>
                    <div className="text-2xl font-bold">+15</div>
                    <div className="text-sm text-white/80">
                      {language === 'ar' ? 'سنوات من الخبرة' : 'Years of Experience'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
                {language === 'ar' ? 'قصتنا' : 'Our Story'}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {language === 'ar'
                  ? 'رحلتنا في تطوير مجال تحليل السلوك'
                  : 'Our Journey in Developing Behavior Analysis'}
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {language === 'ar'
                  ? 'بدأت مسارات كحلم لتوفير تدريب متخصص وعالي الجودة في مجال تحليل السلوك التطبيقي باللغة العربية واللغة الإنجليزية. منذ تأسيسنا، سعينا لسد الفجوة في المحتوى التدريبي المتخصص وتمكين المهنيين العرب من الحصول على شهادات معتمدة دولياً.'
                  : 'Masarat started as a dream to provide specialized, high-quality training in Applied Behavior Analysis in Arabic and English. Since our founding, we have strived to bridge the gap in specialized training content and empower Arab professionals to obtain internationally accredited certifications.'}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                {language === 'ar'
                  ? 'اليوم، نفخر بكوننا شريك معتمد لأبرز الجهات الدولية في مجال ABA، ونواصل التزامنا بتقديم أفضل تجربة تدريبية لمتدربينا.'
                  : 'Today, we are proud to be an accredited partner of the leading international bodies in ABA, and we continue our commitment to providing the best training experience for our trainees.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
              {language === 'ar' ? 'رسالتنا ورؤيتنا' : 'Mission & Vision'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'ما الذي يميزنا' : 'What Makes Us Different'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {language === 'ar'
                ? 'نلتزم بأعلى معايير الجودة والتميز في جميع برامجنا التدريبية'
                : 'We commit to the highest standards of quality and excellence in all our training programs'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group"
              >
                <div className={`w-16 h-16 ${value.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {value.title[language]}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description[language]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
              {language === 'ar' ? 'مسيرتنا' : 'Our Journey'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'محطات في طريق النجاح' : 'Milestones on the Road to Success'}
            </h2>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#4485b5] to-[#2d5a7b] rounded-full" />

            <div className="grid md:grid-cols-4 gap-8">
              {timeline.map((item, index) => (
                <div key={index} className="relative text-center">
                  {/* Timeline Dot */}
                  <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#4485b5] rounded-full border-4 border-white shadow-lg" />

                  <div className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all mt-8 md:mt-12">
                    <div className="text-3xl font-bold text-[#4485b5] mb-2">{item.year}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title[language]}</h3>
                    <p className="text-gray-600 text-sm">{item.description[language]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-br from-[#4485b5] to-[#2d5a7b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-4">
              {language === 'ar' ? 'لماذا تختارنا' : 'Why Choose Us'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {language === 'ar' ? 'مميزات منصة مسارات' : 'Masarat Platform Features'}
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {language === 'ar'
                ? 'نقدم لك تجربة تدريبية فريدة تجمع بين الجودة والاعتماد الدولي'
                : 'We offer you a unique training experience that combines quality and international accreditation'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all group"
              >
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {feature.title[language]}
                </h3>
                <p className="text-white/80 text-sm">
                  {feature.description[language]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Quote */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-[#4485b5]/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Star className="w-10 h-10 text-[#4485b5]" />
          </div>
          <blockquote className="text-2xl md:text-3xl font-medium text-gray-900 mb-8 leading-relaxed">
            {language === 'ar'
              ? '"نسعى في مسارات لأن نكون الجسر الذي يربط المتخصصين العرب بأفضل الممارسات العالمية في تحليل السلوك التطبيقي"'
              : '"At Masarat, we strive to be the bridge that connects Arab professionals with the best global practices in Applied Behavior Analysis"'}
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <img
              src={ikUrl('/images/trainer.jpg', { width: 100 })}
              alt="Dr. Reda Gad"
              className="w-14 h-14 rounded-full object-cover"
            />
            <div className="text-start">
              <div className="font-bold text-gray-900">
                {language === 'ar' ? 'د. رضا جاد محمد طه كرامه' : 'Dr. Reda Gad Mohamed Taha Karama'}
              </div>
              <div className="text-[#4485b5] text-sm">
                {language === 'ar' ? 'المؤسس والرئيس التنفيذي' : 'Founder & CEO'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#4485b5] to-[#2d5a7b] rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                {language === 'ar'
                  ? 'ابدأ رحلتك التدريبية اليوم'
                  : 'Start Your Training Journey Today'}
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                {language === 'ar'
                  ? 'انضم إلى آلاف المتدربين الذين يطورون مهاراتهم معنا واحصل على شهادات معتمدة دولياً'
                  : 'Join thousands of trainees developing their skills with us and get internationally accredited certificates'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-[#4485b5] font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                >
                  {language === 'ar' ? 'سجل مجاناً' : 'Sign Up Free'}
                </Link>
                <Link
                  href="/courses"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  {language === 'ar' ? 'تصفح الدورات' : 'Browse Courses'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
