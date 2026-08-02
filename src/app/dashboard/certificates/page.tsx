'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Award, Download, Eye, Calendar, BookOpen, Loader2, Share2, CheckCircle } from 'lucide-react';

interface Certificate {
  id: string;
  certificateId: string;
  issuedAt: string;
  course: {
    id: string;
    titleAr: string;
    titleEn: string;
    thumbnail: string | null;
    instructor: { id: string; name: string };
  };
}

export default function CertificatesPage() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const ar = language === 'ar';

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch('/api/certificates', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) setCertificates(data.data); })
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = async (cert: Certificate) => {
    if (!token) return;
    setDownloading(cert.id);
    try {
      const res = await fetch(`/api/certificates/${cert.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert(ar ? 'فشل تحميل الشهادة' : 'Failed to download certificate'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${cert.certificateId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setDownloading(null); }
  };

  const handleCopyLink = (cert: Certificate) => {
    const url = `${window.location.origin}/certificates/${cert.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(cert.id);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    </DashboardLayout>
  );

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
              <div className="relative h-48 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-6 flex flex-col items-center justify-center text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff'%3E%3Cpath d='M20 20.5V18H0v5h5v5H0v5h20v-9.5zm-2 5.5H4v-5h14v5zm4-15V1H0v5h5v5H0v5h20v-9.5zm-2 5.5H4V7h14v4z'/%3E%3C/g%3E%3C/svg%3E")` }}
                />
                <Award className="w-10 h-10 mb-2 text-yellow-300 relative z-10" />
                <p className="text-xs font-medium text-primary-200 uppercase tracking-widest mb-1 relative z-10">
                  {ar ? 'شهادة إتمام' : 'Certificate of Completion'}
                </p>
                <h3 className="text-sm font-bold text-center line-clamp-2 relative z-10 px-4">
                  {ar ? cert.course.titleAr : cert.course.titleEn}
                </h3>
                <p className="text-xs text-primary-300 mt-2 font-mono relative z-10">
                  {cert.certificateId}
                </p>
              </div>

              {/* Info */}
              <div className="p-5">
                <h4 className="font-bold text-gray-900 mb-3 line-clamp-2">
                  {ar ? cert.course.titleAr : cert.course.titleEn}
                </h4>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{ar ? 'المدرب: ' : 'Instructor: '}
                      <span className="text-gray-700">{cert.course.instructor.name}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{ar ? 'تاريخ الإصدار: ' : 'Issued: '}
                      <span className="text-gray-700">
                        {new Date(cert.issuedAt).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(cert)}
                    disabled={downloading === cert.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 text-sm font-medium"
                  >
                    {downloading === cert.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                    {ar ? 'تحميل PDF' : 'Download PDF'}
                  </button>

                  <Link
                    href={`/certificates/${cert.id}`}
                    className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    title={ar ? 'عرض' : 'View'}
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleCopyLink(cert)}
                    className="p-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
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
