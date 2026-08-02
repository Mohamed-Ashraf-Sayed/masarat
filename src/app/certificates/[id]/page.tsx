'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Award, Download, Calendar, BookOpen, User, CheckCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

interface Certificate {
  id: string;
  certificateId: string;
  issuedAt: string;
  user: { id: string; name: string };
  course: {
    id: string;
    titleAr: string;
    titleEn: string;
    thumbnail: string | null;
    instructor: { id: string; name: string };
  };
}

export default function CertificateViewPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { token } = useAuth();
  const ar = language === 'ar';

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/certificates/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setCertificate(data.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!token || !certificate) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/certificates/${certificate.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert(ar ? 'فشل التحميل' : 'Download failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.certificateId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setDownloading(false); }
  };

  const BackIcon = ar ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-gray-50" dir={ar ? 'rtl' : 'ltr'}>
      <Navbar variant="solid" />

      <div className="max-w-3xl mx-auto px-4 py-24">

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
        ) : notFound || !certificate ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {ar ? 'الشهادة غير موجودة' : 'Certificate Not Found'}
            </h2>
            <p className="text-gray-500 mb-6">
              {ar ? 'هذه الشهادة غير صالحة أو لا وجود لها.' : 'This certificate is invalid or does not exist.'}
            </p>
            <Link href="/" className="btn-primary inline-flex items-center gap-2">
              <BackIcon className="w-4 h-4" />
              {ar ? 'الرئيسية' : 'Home'}
            </Link>
          </div>
        ) : (
          <>
            {/* Certificate Card */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-6">

              {/* Top decorative section */}
              <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-8 py-12 text-white text-center overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")` }}
                />

                {/* Border frames */}
                <div className="absolute inset-3 border border-white/20 rounded-2xl pointer-events-none" />
                <div className="absolute inset-5 border border-white/10 rounded-xl pointer-events-none" />

                <div className="relative z-10">
                  <Award className="w-16 h-16 mx-auto mb-4 text-yellow-300 drop-shadow-lg" />
                  <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary-200 mb-2">
                    {ar ? 'مسارات للتدريب' : 'Masarat Training'}
                  </p>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {ar ? 'شهادة إتمام' : 'Certificate of Completion'}
                  </h1>
                  <p className="text-primary-200 text-sm">
                    {ar ? 'يُشهد بأن' : 'This is to certify that'}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mt-3 text-yellow-200">
                    {certificate.user.name}
                  </h2>
                  <p className="text-primary-200 text-sm mt-2">
                    {ar ? 'قد أتم بنجاح دورة' : 'has successfully completed the course'}
                  </p>
                  <h3 className="text-xl font-bold mt-3 px-4">
                    {ar ? certificate.course.titleAr : certificate.course.titleEn}
                  </h3>
                </div>
              </div>

              {/* Details */}
              <div className="px-8 py-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 mb-0.5">{ar ? 'المدرب' : 'Instructor'}</p>
                    <p className="font-semibold text-gray-900 text-sm">{certificate.course.instructor.name}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-primary-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 mb-0.5">{ar ? 'تاريخ الإصدار' : 'Issue Date'}</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Date(certificate.issuedAt).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 mb-0.5">{ar ? 'الحالة' : 'Status'}</p>
                    <p className="font-semibold text-green-600 text-sm">{ar ? 'معتمدة' : 'Verified'}</p>
                  </div>
                </div>

                {/* Certificate ID */}
                <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    <span className="font-medium">{ar ? 'رقم الشهادة: ' : 'Certificate ID: '}</span>
                    <span className="font-mono">{certificate.certificateId}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {token && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-60"
                >
                  {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {ar ? 'تحميل الشهادة PDF' : 'Download Certificate PDF'}
                </button>
              )}
              <Link
                href={`/courses/${certificate.course.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                <BookOpen className="w-5 h-5" />
                {ar ? 'عرض الدورة' : 'View Course'}
              </Link>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
