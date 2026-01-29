'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Award, Download, Share2, Eye, Calendar, BookOpen } from 'lucide-react';

export default function CertificatesPage() {
  const { language, t } = useLanguage();

  const certificates = [
    {
      id: '1',
      courseName: { ar: 'دورة تطوير الويب الشاملة', en: 'Complete Web Development Bootcamp' },
      instructor: 'محمد أحمد',
      issueDate: '2024-01-10',
      certificateId: 'CERT-2024-001234',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
    },
    {
      id: '2',
      courseName: { ar: 'التصميم الجرافيكي باستخدام Photoshop', en: 'Graphic Design with Photoshop' },
      instructor: 'سارة علي',
      issueDate: '2023-12-25',
      certificateId: 'CERT-2023-005678',
      thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'ar' ? 'شهاداتي' : 'My Certificates'}
        </h1>
        <p className="text-gray-500">
          {language === 'ar'
            ? 'عرض وتحميل شهادات الدورات المكتملة'
            : 'View and download certificates for completed courses'}
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Certificate Preview */}
              <div className="relative aspect-[16/10] bg-gradient-to-br from-primary-600 to-primary-800 p-8">
                <div className="absolute inset-0 opacity-10">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  ></div>
                </div>
                <div className="relative text-center text-white">
                  <Award className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
                  <h3 className="text-lg font-bold mb-1">
                    {language === 'ar' ? 'شهادة إتمام' : 'Certificate of Completion'}
                  </h3>
                  <p className="text-blue-100 text-sm mb-4">
                    {cert.courseName[language]}
                  </p>
                  <div className="text-xs text-blue-200">
                    ID: {cert.certificateId}
                  </div>
                </div>
              </div>

              {/* Certificate Info */}
              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-4">
                  {cert.courseName[language]}
                </h4>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-600 text-sm">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>
                      {language === 'ar' ? 'المدرب: ' : 'Instructor: '}
                      {cert.instructor}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {language === 'ar' ? 'تاريخ الإصدار: ' : 'Issue Date: '}
                      {new Date(cert.issueDate).toLocaleDateString(
                        language === 'ar' ? 'ar-SA' : 'en-US'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
                    <Download className="w-4 h-4" />
                    {language === 'ar' ? 'تحميل' : 'Download'}
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Award className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد شهادات بعد' : 'No Certificates Yet'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {language === 'ar'
              ? 'أكمل دوراتك للحصول على شهادات معتمدة يمكنك مشاركتها مع أصحاب العمل.'
              : 'Complete your courses to earn certificates that you can share with employers.'}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
