/** @type {import('next').NextConfig} */
const nextConfig = {
  // تجاهل أخطاء ESLint أثناء البناء
  eslint: {
    ignoreDuringBuilds: true,
  },
  // تجاهل أخطاء TypeScript أثناء البناء
  typescript: {
    ignoreBuildErrors: true,
  },
  // Standalone output for better production performance
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
    ],
    // لتجنب مشاكل الصور على Hostinger
    unoptimized: process.env.NODE_ENV === 'production',
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
    ];
  },
};

module.exports = nextConfig;
