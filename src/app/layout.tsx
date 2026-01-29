import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'مسارات | Masarat - برامج تحليل السلوك التطبيقي',
  description: 'منصة تعليمية متكاملة تقدم لك أفضل الدورات من خبراء متخصصين في مختلف المجالات. انضم إلى آلاف المتعلمين واكتسب مهارات جديدة.',
  keywords: ['تعليم', 'دورات', 'برمجة', 'تصميم', 'تسويق', 'education', 'courses', 'learning'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-cairo antialiased">
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
