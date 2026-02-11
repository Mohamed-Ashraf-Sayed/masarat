'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Building2,
  Users,
  GraduationCap,
  Award,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Shield,
  Headphones,
  FileText,
  Target,
  Briefcase,
  Send,
  Phone,
  Mail,
  Clock,
  Star,
  Heart,
  Landmark,
} from 'lucide-react';

export default function InstitutionsPage() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    institutionName: '',
    contactName: '',
    email: '',
    phone: '',
    institutionType: '',
    employeeCount: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitted(true);
    setSubmitting(false);
  };

  const benefits = [
    {
      icon: Users,
      title: { ar: 'تدريب جماعي', en: 'Group Training' },
      description: {
        ar: 'تسجيل عدد غير محدود من الموظفين بأسعار مخفضة',
        en: 'Enroll unlimited employees at discounted rates',
      },
    },
    {
      icon: FileText,
      title: { ar: 'تقارير مفصلة', en: 'Detailed Reports' },
      description: {
        ar: 'متابعة تقدم الموظفين وإنجازاتهم بشكل مستمر',
        en: 'Track employee progress and achievements continuously',
      },
    },
    {
      icon: Award,
      title: { ar: 'شهادات معتمدة', en: 'Certified Credentials' },
      description: {
        ar: 'شهادات معترف بها دولياً لجميع المتدربين',
        en: 'Internationally recognized certificates for all trainees',
      },
    },
    {
      icon: Headphones,
      title: { ar: 'دعم مخصص', en: 'Dedicated Support' },
      description: {
        ar: 'فريق دعم مخصص لمؤسستك على مدار الساعة',
        en: '24/7 dedicated support team for your institution',
      },
    },
    {
      icon: Target,
      title: { ar: 'برامج مخصصة', en: 'Custom Programs' },
      description: {
        ar: 'تصميم برامج تدريبية تناسب احتياجات مؤسستك',
        en: 'Design training programs tailored to your needs',
      },
    },
    {
      icon: Shield,
      title: { ar: 'خصوصية وأمان', en: 'Privacy & Security' },
      description: {
        ar: 'حماية بيانات مؤسستك والمتدربين بأعلى المعايير',
        en: 'Protect your institution and trainee data with top standards',
      },
    },
  ];

  const collaborationSteps = [
    {
      step: 1,
      title: { ar: 'تواصل معنا', en: 'Contact Us' },
      description: {
        ar: 'أرسل لنا طلبك عبر النموذج أو اتصل بنا مباشرة لمناقشة احتياجاتك التدريبية',
        en: 'Submit your request via the form or call us directly to discuss your training needs',
      },
      icon: Phone,
    },
    {
      step: 2,
      title: { ar: 'تحليل الاحتياجات', en: 'Needs Analysis' },
      description: {
        ar: 'يقوم فريقنا بدراسة احتياجات مؤسستك وتحديد البرامج المناسبة',
        en: 'Our team analyzes your institution needs and identifies suitable programs',
      },
      icon: Target,
    },
    {
      step: 3,
      title: { ar: 'تصميم البرنامج', en: 'Program Design' },
      description: {
        ar: 'نصمم برنامجاً تدريبياً مخصصاً يناسب أهداف مؤسستك وميزانيتك',
        en: 'We design a customized training program that fits your goals and budget',
      },
      icon: FileText,
    },
    {
      step: 4,
      title: { ar: 'بدء التدريب', en: 'Start Training' },
      description: {
        ar: 'يبدأ فريقك بالتعلم مع متابعة مستمرة وتقارير دورية عن التقدم',
        en: 'Your team starts learning with continuous follow-up and progress reports',
      },
      icon: GraduationCap,
    },
  ];

  const institutionTypes = [
    {
      icon: Heart,
      name: { ar: 'المراكز الصحية', en: 'Healthcare Centers' },
      description: {
        ar: 'مستشفيات ومراكز تأهيل وعيادات',
        en: 'Hospitals, rehabilitation centers, and clinics',
      },
    },
    {
      icon: GraduationCap,
      name: { ar: 'المؤسسات التعليمية', en: 'Educational Institutions' },
      description: {
        ar: 'مدارس وجامعات ومراكز تدريب',
        en: 'Schools, universities, and training centers',
      },
    },
    {
      icon: Landmark,
      name: { ar: 'الجهات الحكومية', en: 'Government Agencies' },
      description: {
        ar: 'وزارات وهيئات ومؤسسات حكومية',
        en: 'Ministries, authorities, and government bodies',
      },
    },
    {
      icon: Briefcase,
      name: { ar: 'القطاع الخاص', en: 'Private Sector' },
      description: {
        ar: 'شركات ومؤسسات خاصة',
        en: 'Companies and private organizations',
      },
    },
  ];

  const stats = [
    { value: '3+', label: { ar: 'مؤسسة شريكة', en: 'Partner Institutions' } },
    { value: '50+', label: { ar: 'متدرب مؤسسي', en: 'Corporate Trainees' } },
    { value: '95%', label: { ar: 'نسبة الرضا', en: 'Satisfaction Rate' } },
    { value: '100%', label: { ar: 'شهادات معتمدة', en: 'Certified Courses' } },
  ];

  const testimonials = [
    {
      quote: {
        ar: 'تجربة رائعة مع أكاديمية سلوك. البرامج التدريبية ساعدت فريقنا على تطوير مهاراتهم بشكل ملحوظ.',
        en: 'Amazing experience with Sulook Academy. The training programs helped our team develop their skills remarkably.',
      },
      author: { ar: 'د. محمد الأحمد', en: 'Dr. Mohammed Al-Ahmed' },
      position: { ar: 'مدير مركز التأهيل', en: 'Rehabilitation Center Director' },
      institution: { ar: 'مركز الأمل للتأهيل', en: 'Al-Amal Rehabilitation Center' },
    },
    {
      quote: {
        ar: 'الدعم المخصص والتقارير المفصلة ساعدتنا على متابعة تقدم موظفينا بسهولة.',
        en: 'The dedicated support and detailed reports helped us easily track our employees progress.',
      },
      author: { ar: 'أ. سارة القحطاني', en: 'Ms. Sarah Al-Qahtani' },
      position: { ar: 'مديرة الموارد البشرية', en: 'HR Director' },
      institution: { ar: 'مستشفى الرياض', en: 'Riyadh Hospital' },
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4485b5] via-[#2d5a7b] to-[#1a3a52]" />
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />

        {/* Decorative Elements */}
        <div className="absolute top-20 start-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 end-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-start">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" />
                {language === 'ar' ? 'للمؤسسات والشركات' : 'For Institutions & Companies'}
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {language === 'ar' ? (
                  <>
                    طوّر فريقك مع
                    <span className="block text-blue-200">برامجنا المؤسسية</span>
                  </>
                ) : (
                  <>
                    Develop Your Team with
                    <span className="block text-blue-200">Our Institutional Programs</span>
                  </>
                )}
              </h1>

              <p className="text-xl text-white/80 mb-8 max-w-xl">
                {language === 'ar'
                  ? 'حلول تدريبية متكاملة في تحليل السلوك التطبيقي مصممة خصيصاً لاحتياجات مؤسستك'
                  : 'Comprehensive ABA training solutions designed specifically for your institution\'s needs'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#4485b5] rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
                >
                  {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                  {language === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </a>
                <a
                  href="#steps"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/20 transition-colors border border-white/20"
                >
                  {language === 'ar' ? 'كيف نعمل' : 'How We Work'}
                </a>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10 hover:bg-white/15 transition-colors"
                >
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white/70 text-sm">{stat.label[language]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Institution Types */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
              {language === 'ar' ? 'من نخدم' : 'Who We Serve'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'نخدم مختلف القطاعات' : 'Serving Various Sectors'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {language === 'ar'
                ? 'نقدم برامجنا التدريبية لمختلف أنواع المؤسسات والشركات'
                : 'We offer our training programs to various types of institutions and companies'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {institutionTypes.map((type, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group border border-gray-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#4485b5] to-[#2d5a7b] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <type.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {type.name[language]}
                </h3>
                <p className="text-gray-600 text-sm">
                  {type.description[language]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
              {language === 'ar' ? 'المميزات' : 'Benefits'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'لماذا تختارنا؟' : 'Why Choose Us?'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {language === 'ar'
                ? 'نقدم لمؤسستك حلولاً تدريبية متكاملة مع مميزات حصرية'
                : 'We offer your institution comprehensive training solutions with exclusive benefits'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#4485b5]/5 to-transparent rounded-2xl transform group-hover:scale-105 transition-transform" />
                <div className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#4485b5]/30 transition-colors">
                  <div className="w-12 h-12 bg-[#4485b5]/10 rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-[#4485b5]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {benefit.title[language]}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {benefit.description[language]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaboration Steps Section */}
      <section id="steps" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
              {language === 'ar' ? 'كيف نعمل' : 'How We Work'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'خطوات التعاون معنا' : 'Steps to Partner With Us'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {language === 'ar'
                ? 'أربع خطوات بسيطة لبدء رحلة التدريب المؤسسي مع فريقنا'
                : 'Four simple steps to start your institutional training journey with our team'}
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#4485b5] via-[#4485b5] to-[#4485b5] transform -translate-y-1/2 z-0" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {collaborationSteps.map((step, index) => (
                <div
                  key={index}
                  className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-4 start-6 w-8 h-8 bg-gradient-to-br from-[#4485b5] to-[#2d5a7b] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 bg-[#4485b5]/10 rounded-xl flex items-center justify-center mt-4 mb-4 group-hover:bg-[#4485b5] transition-colors">
                    <step.icon className="w-7 h-7 text-[#4485b5] group-hover:text-white transition-colors" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {step.title[language]}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description[language]}
                  </p>

                  {/* Arrow for desktop */}
                  {index < collaborationSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -end-4 transform -translate-y-1/2 z-20">
                      <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-[#4485b5]" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#4485b5] to-[#2d5a7b] text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
            >
              {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
              {language === 'ar' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
              {language === 'ar' ? 'آراء عملائنا' : 'Client Testimonials'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'ماذا يقول شركاؤنا' : 'What Our Partners Say'}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                  "{testimonial.quote[language]}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4485b5] to-[#2d5a7b] rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.author[language].charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author[language]}</p>
                    <p className="text-sm text-gray-500">{testimonial.position[language]}</p>
                    <p className="text-sm text-[#4485b5]">{testimonial.institution[language]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
                {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {language === 'ar' ? 'ابدأ رحلة التدريب المؤسسي' : 'Start Your Institutional Training Journey'}
              </h2>
              <p className="text-gray-600 mb-8">
                {language === 'ar'
                  ? 'تواصل معنا اليوم للحصول على عرض مخصص يناسب احتياجات مؤسستك'
                  : 'Contact us today to get a customized offer that fits your institution\'s needs'}
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#4485b5]/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[#4485b5]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{language === 'ar' ? 'اتصل بنا' : 'Call Us'}</p>
                    <p className="font-semibold text-gray-900" dir="ltr">+966 50 123 4567</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#4485b5]/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#4485b5]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="font-semibold text-gray-900">institutions@sulook.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#4485b5]/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#4485b5]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{language === 'ar' ? 'ساعات العمل' : 'Working Hours'}</p>
                    <p className="font-semibold text-gray-900">
                      {language === 'ar' ? 'الأحد - الخميس: 9 ص - 5 م' : 'Sun - Thu: 9 AM - 5 PM'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {language === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Your request has been sent!'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'ar'
                      ? 'سيتواصل معك فريقنا خلال 24 ساعة'
                      : 'Our team will contact you within 24 hours'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'اسم المؤسسة' : 'Institution Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.institutionName}
                        onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all"
                        placeholder={language === 'ar' ? 'مثال: مستشفى الرياض' : 'e.g., Riyadh Hospital'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'اسم المسؤول' : 'Contact Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all"
                        placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all"
                        placeholder="email@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all"
                        placeholder="+966 5X XXX XXXX"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'نوع المؤسسة' : 'Institution Type'} *
                      </label>
                      <select
                        required
                        value={formData.institutionType}
                        onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all bg-white"
                      >
                        <option value="">{language === 'ar' ? 'اختر النوع' : 'Select type'}</option>
                        <option value="healthcare">{language === 'ar' ? 'مركز صحي / مستشفى' : 'Healthcare / Hospital'}</option>
                        <option value="education">{language === 'ar' ? 'مؤسسة تعليمية' : 'Educational Institution'}</option>
                        <option value="government">{language === 'ar' ? 'جهة حكومية' : 'Government Agency'}</option>
                        <option value="private">{language === 'ar' ? 'شركة خاصة' : 'Private Company'}</option>
                        <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'عدد الموظفين المتوقع' : 'Expected Employees'} *
                      </label>
                      <select
                        required
                        value={formData.employeeCount}
                        onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all bg-white"
                      >
                        <option value="">{language === 'ar' ? 'اختر العدد' : 'Select count'}</option>
                        <option value="10-25">10-25</option>
                        <option value="26-50">26-50</option>
                        <option value="51-100">51-100</option>
                        <option value="100+">100+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'رسالتك (اختياري)' : 'Your Message (optional)'}
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all resize-none"
                      placeholder={language === 'ar' ? 'أخبرنا المزيد عن احتياجاتك التدريبية...' : 'Tell us more about your training needs...'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#4485b5] to-[#2d5a7b] text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
