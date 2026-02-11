'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  Headphones,
  MessagesSquare,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

export default function ContactPage() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSuccess(true);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    setTimeout(() => setSuccess(false), 5000);
  };

  const contactMethods = [
    {
      icon: Phone,
      title: { ar: 'اتصل بنا', en: 'Call Us' },
      description: { ar: 'متاحون من الأحد للخميس', en: 'Available Sun-Thu' },
      value: '0096891366078',
      action: { ar: 'اتصل الآن', en: 'Call Now' },
      link: 'tel:0096891366078',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Mail,
      title: { ar: 'راسلنا', en: 'Email Us' },
      description: { ar: 'نرد خلال 24 ساعة', en: 'We reply within 24 hours' },
      value: 'info@sulook.com',
      action: { ar: 'أرسل بريد', en: 'Send Email' },
      link: 'mailto:info@sulook.com',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: MessagesSquare,
      title: { ar: 'واتساب', en: 'WhatsApp' },
      description: { ar: 'تواصل فوري ومباشر', en: 'Instant direct chat' },
      value: '00201140277208 - 0096891366078',
      action: { ar: 'ابدأ محادثة', en: 'Start Chat' },
      link: 'https://wa.me/201140277208',
      color: 'from-green-500 to-green-600',
    },
  ];

  const contactInfo = [
    {
      icon: MapPin,
      title: { ar: 'العنوان', en: 'Address' },
      value: { ar: 'الرياض، المملكة العربية السعودية', en: 'Riyadh, Saudi Arabia' },
    },
    {
      icon: Clock,
      title: { ar: 'ساعات العمل', en: 'Working Hours' },
      value: { ar: 'الأحد - الخميس: 9 ص - 5 م', en: 'Sun - Thu: 9 AM - 5 PM' },
    },
  ];

  const faqItems = [
    {
      question: { ar: 'كيف يمكنني التسجيل في الدورات؟', en: 'How can I register for courses?' },
      answer: { ar: 'يمكنك التسجيل مباشرة من صفحة الدورات واختيار الدورة المناسبة ثم إتمام عملية الدفع.', en: 'You can register directly from the courses page, select the appropriate course, then complete the payment process.' },
    },
    {
      question: { ar: 'هل الشهادات معتمدة؟', en: 'Are the certificates accredited?' },
      answer: { ar: 'نعم، جميع شهاداتنا معتمدة من BACB و QABA ومعترف بها دولياً.', en: 'Yes, all our certificates are accredited by BACB and QABA and internationally recognized.' },
    },
    {
      question: { ar: 'ما هي طرق الدفع المتاحة؟', en: 'What payment methods are available?' },
      answer: { ar: 'نقبل الدفع بالتحويل البنكي وبطاقات الائتمان (فيزا وماستركارد).', en: 'We accept bank transfer and credit cards (Visa and Mastercard).' },
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="solid" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4485b5] via-[#2d5a7b] to-[#1a3a52]" />
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />

        {/* Decorative Elements */}
        <div className="absolute top-20 start-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 end-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
            <Headphones className="w-4 h-4" />
            {language === 'ar' ? 'نحن هنا لمساعدتك' : 'We are here to help'}
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'فريقنا جاهز للإجابة على استفساراتك ومساعدتك في رحلتك التعليمية'
              : 'Our team is ready to answer your inquiries and help you in your educational journey'}
          </p>
        </div>
      </section>

      {/* Contact Methods Cards */}
      <section className="py-12 -mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.link}
                target={method.link.startsWith('http') ? '_blank' : undefined}
                rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="group bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all border border-gray-100 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <method.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {method.title[language]}
                </h3>
                <p className="text-gray-500 text-sm mb-2">
                  {method.description[language]}
                </p>
                <p className="text-[#4485b5] font-semibold mb-4" dir="ltr">
                  {method.value}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 group-hover:text-[#4485b5] transition-colors">
                  {method.action[language]}
                  {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-[#4485b5]/10 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-7 h-7 text-[#4485b5]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {language === 'ar' ? 'أرسل لنا رسالة' : 'Send Us a Message'}
                    </h2>
                    <p className="text-gray-500">
                      {language === 'ar' ? 'سنرد عليك في أقرب وقت ممكن' : 'We will get back to you ASAP'}
                    </p>
                  </div>
                </div>

                {success && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-emerald-800">
                        {language === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Message sent successfully!'}
                      </p>
                      <p className="text-sm text-emerald-600">
                        {language === 'ar' ? 'سنتواصل معك قريباً' : 'We will contact you soon'}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all"
                        placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all"
                        placeholder="+966 5X XXX XXXX"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'الموضوع' : 'Subject'} *
                      </label>
                      <select
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all"
                      >
                        <option value="">{language === 'ar' ? 'اختر الموضوع' : 'Select subject'}</option>
                        <option value="courses">{language === 'ar' ? 'استفسار عن الدورات' : 'Course inquiry'}</option>
                        <option value="certificates">{language === 'ar' ? 'استفسار عن الشهادات' : 'Certificate inquiry'}</option>
                        <option value="payment">{language === 'ar' ? 'مشكلة في الدفع' : 'Payment issue'}</option>
                        <option value="technical">{language === 'ar' ? 'دعم فني' : 'Technical support'}</option>
                        <option value="institutions">{language === 'ar' ? 'تدريب مؤسسي' : 'Institutional training'}</option>
                        <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'ar' ? 'رسالتك' : 'Your Message'} *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4485b5] focus:border-transparent outline-none transition-all resize-none"
                      placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#4485b5] to-[#2d5a7b] text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info Card */}
              <div className="bg-gradient-to-br from-[#4485b5] to-[#2d5a7b] rounded-2xl p-8 text-white">
                <h3 className="text-xl font-bold mb-6">
                  {language === 'ar' ? 'معلومات إضافية' : 'Additional Info'}
                </h3>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white/70 text-sm">{info.title[language]}</p>
                        <p className="font-medium">{info.value[language]}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Social Links */}
                <div className="mt-8 pt-6 border-t border-white/20">
                  <p className="text-white/70 text-sm mb-4">
                    {language === 'ar' ? 'تابعنا على' : 'Follow us on'}
                  </p>
                  <div className="flex gap-3">
                    {[
                      { name: 'twitter', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                      { name: 'instagram', path: 'M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z' },
                      { name: 'linkedin', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                      { name: 'youtube', path: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                    ].map((social) => (
                      <a
                        key={social.name}
                        href="#"
                        className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d={social.path} />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* FAQ Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {language === 'ar' ? 'أسئلة شائعة' : 'FAQ'}
                  </h3>
                </div>
                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <details key={index} className="group">
                      <summary className="flex items-center justify-between cursor-pointer text-gray-900 font-medium text-sm hover:text-[#4485b5] transition-colors">
                        {item.question[language]}
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </summary>
                      <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                        {item.answer[language]}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-[#4485b5]/10 text-[#4485b5] rounded-full text-sm font-medium mb-4">
              {language === 'ar' ? 'موقعنا' : 'Our Location'}
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'زورنا في مقرنا' : 'Visit Our Office'}
            </h2>
            <p className="text-gray-600">
              {language === 'ar' ? 'نرحب بزيارتكم في أي وقت خلال ساعات العمل' : 'We welcome your visit anytime during working hours'}
            </p>
          </div>
          <a
            href="https://maps.google.com/?q=24.7136,46.6753"
            target="_blank"
            rel="noopener noreferrer"
            className="block relative rounded-2xl overflow-hidden shadow-lg h-96 group"
          >
            {/* Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4485b5]/20 to-[#2d5a7b]/30" />
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/46.6753,24.7136,11,0/1200x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw')`,
              }}
            />

            {/* Fallback Design */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4">
                <div className="w-16 h-16 bg-[#4485b5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-[#4485b5]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {language === 'ar' ? 'طريق الملك فهد، حي العليا' : 'King Fahd Road, Al Olaya District'}
                </p>
                <span className="inline-flex items-center gap-2 text-[#4485b5] font-medium group-hover:gap-3 transition-all">
                  {language === 'ar' ? 'افتح في خرائط جوجل' : 'Open in Google Maps'}
                  {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </span>
              </div>
            </div>

            {/* Decorative pins */}
            <div className="absolute top-1/4 start-1/4 w-4 h-4 bg-[#4485b5] rounded-full animate-pulse opacity-50" />
            <div className="absolute top-1/3 end-1/3 w-3 h-3 bg-[#4485b5] rounded-full animate-pulse opacity-30" />
            <div className="absolute bottom-1/4 start-1/3 w-2 h-2 bg-[#4485b5] rounded-full animate-pulse opacity-40" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
