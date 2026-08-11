'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Award, Download, Eye, Calendar, BookOpen, Loader2, Share2, CheckCircle } from 'lucide-react';

interface Certificate {
  id: string;
  certificateId: string;
  issuedAt: string;
  course: {
    titleAr: string;
    titleEn: string;
    instructor: { name: string };
  };
}

export default function CertificatesPage() {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/certificates')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCertificates(data.certificates);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (certId: string) => {
    window.open(`/api/certificates/${certId}/download`, '_blank');
  };

  const handleCopyLink = (cert: Certificate) => {
    const url = `${window.location.origin}/certificates/${cert.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(cert.id);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {ar ? 'شهاداتي' : 'My Certificates'}
        </h1>
        <p className="text-gray-500">
          {ar ? `${certificates.length} شهادة مكتسبة` : `${certificates.length} certificate(s) earned`}
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

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
                    {ar ? 'شهادة إتمام' : 'Certificate of Completion'}
                  </h3>
                  <p className="text-blue-100 text-sm mb-4">
                    {ar ? cert.course.titleAr : cert.course.titleEn}
                  </p>
                  <div className="text-xs text-blue-200">
                    ID: {cert.certificateId}
                  </div>
                </div>
              </div>

              {/* Certificate Info */}
              <div className="p-6">
                <h4 className="font-bold text-gray-900 mb-4">
                  {ar ? cert.course.titleAr : cert.course.titleEn}
                </h4>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-600 text-sm">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>
                      {ar ? 'المدرب: ' : 'Instructor: '}
                      {cert.course.instructor.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {ar ? 'تاريخ الإصدار: ' : 'Issue Date: '}
                      {new Date(cert.issuedAt).toLocaleDateString(
                        ar ? 'ar-SA' : 'en-US'
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(cert.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {ar ? 'تحميل الشهادة' : 'Download Certificate'}
                  </button>

                  <Link
                    href={`/certificates/${cert.id}`}
                    className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center"
                    title={ar ? 'عرض' : 'View'}
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleCopyLink(cert)}
                    className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    title={ar ? 'نسخ رابط المشاركة' : 'Copy share link'}
                  >
                    {copied === cert.id
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center">
            <Award className="w-10 h-10 text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {ar ? 'لا توجد شهادات بعد' : 'No Certificates Yet'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {ar
              ? 'أكمل 80% أو أكثر من دروس أي دورة للحصول على شهادة إتمام معتمدة.'
              : 'Complete 80% or more of any course lessons to earn a certificate of completion.'}
          </p>
          <Link href="/courses" className="btn-primary inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {ar ? 'استعرض الدورات' : 'Browse Courses'}
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
