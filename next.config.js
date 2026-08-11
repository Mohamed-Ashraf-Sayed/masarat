const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack configuration for path aliases
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
  // Increase body size limit for file uploads (100MB for videos)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    // pdfkit needs to run as native Node module (not webpack bundled)
    serverComponentsExternalPackages: ['pdfkit', 'arabic-reshaper', 'puppeteer-core'],
  },
  // تجاهل أخطاء ESLint أثناء البناء
  eslint: {
    ignoreDuringBuilds: true,
  },
  // تجاهل أخطاء TypeScript أثناء البناء
  typescript: {
    ignoreBuildErrors: true,
  },
  // Standalone output for production
  output: 'standalone',
  // إعدادات الصور
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '**.hstgr.io', // لصور Hostinger
      },
      {
        protocol: 'https',
        hostname: 'image2url.com',
      },
      {
        protocol: 'https',
        hostname: '**.image2url.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io', // ImageKit CDN
      },
    ],
    // لو ImageKit متظبط: كل صور next/image بتتحوّل لروابط CDN عن طريق الـ custom loader
    // لو مش متظبط: نرجع للسلوك القديم (unoptimized على production لتجنب مشاكل Hostinger)
    ...(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
      ? { loader: 'custom', loaderFile: './src/lib/imagekit.js' }
      : { unoptimized: process.env.NODE_ENV === 'production' }),
    // كاش صور الـ optimizer (بيشتغل في التطوير / لو الـ optimization اتفعّل)
    minimumCacheTTL: 86400,
  },

  // إعدادات الإنتاج
  poweredByHeader: false,
  reactStrictMode: true,

  // إعدادات الأمان و CORS
  async headers() {
    // قائمة الدومينات المسموح بها
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean);

    // Security headers for all routes
    const securityHeaders = [
      // Prevents clickjacking attacks
      { key: 'X-Frame-Options', value: 'DENY' },
      // Prevents MIME type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Enables XSS filter
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      // Controls referrer information
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Permissions policy
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
      },
      // Content Security Policy
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://accounts.google.com https://www.paypal.com https://www.youtube.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https: http:",
          "font-src 'self' https://fonts.gstatic.com",
          "frame-src 'self' https://js.stripe.com https://accounts.google.com https://www.youtube.com https://youtube.com https://player.vimeo.com https://www.paypal.com",
          "connect-src 'self' https://api.stripe.com https://accounts.google.com https://www.paypal.com https://*.paypal.com",
        ].join('; ')
      },
    ];

    // HSTS - only in production
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
      });
    }

    return [
      // Apply security headers to all routes
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // CORS headers for API routes
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigins[0] },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      // Cache layer للصور الثابتة (slider, logos, ...) — أسماؤها ثابتة فالكاش يوم + أسبوع stale
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|gif|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // الملفات المرفوعة أسماؤها فريدة (timestamp) فآمن نكيّشها سنة كاملة
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // إيصالات الدفع بيانات شخصية — آخر قاعدة عشان تكسب على قواعد الكاش اللي فوق
      {
        source: '/uploads/:folder(receipts|book-receipts)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
