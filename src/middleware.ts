import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

// الصفحات المحمية التي تتطلب تسجيل الدخول
const protectedRoutes = ['/dashboard', '/admin', '/instructor'];

// الصفحات التي لا يجب الوصول إليها إذا كان المستخدم مسجل دخول
const authRoutes = ['/login', '/register'];

// قائمة IPs المحظورة مؤقتاً (في الذاكرة - يمكن استخدام Redis في الإنتاج)
const blockedIPs = new Map<string, number>();
const BLOCK_DURATION = 15 * 60 * 1000; // 15 دقيقة

// Threat score tracking per IP
const threatScores = new Map<string, { score: number; timestamp: number }>();
const THREAT_DECAY_MS = 60 * 60 * 1000; // 1 hour decay
const MAX_THREAT_SCORE = 100;

// الحصول على IP العميل
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

// التحقق من IP محظور
function isIPBlocked(ip: string): boolean {
  const blockedUntil = blockedIPs.get(ip);
  if (!blockedUntil) return false;
  if (Date.now() > blockedUntil) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}

// إضافة Headers أمنية
function addSecurityHeaders(response: NextResponse): NextResponse {
  // منع تضمين الصفحة في iframe (حماية من Clickjacking)
  response.headers.set('X-Frame-Options', 'DENY');
  // منع تخمين نوع الملفات
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // حماية XSS
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // سياسة المُحيل
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // منع الوصول للكاميرا والميكروفون
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; frame-src https://js.stripe.com https://www.paypal.com https://www.youtube.com https://player.vimeo.com; connect-src 'self' https://api.stripe.com https://www.paypal.com"
    );
  }
  // Strict Transport Security
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

// Update threat score for an IP
function updateThreatScore(ip: string, points: number): number {
  const now = Date.now();
  const existing = threatScores.get(ip);

  let newScore = points;
  if (existing) {
    // Decay old score
    const elapsed = now - existing.timestamp;
    const decay = Math.floor(elapsed / (5 * 60 * 1000)); // Decay 1 point every 5 minutes
    const decayedScore = Math.max(0, existing.score - decay);
    newScore = Math.min(MAX_THREAT_SCORE, decayedScore + points);
  }

  threatScores.set(ip, { score: newScore, timestamp: now });
  return newScore;
}

// Check if IP should be blocked based on threat score
function shouldBlockByThreatScore(ip: string): boolean {
  const existing = threatScores.get(ip);
  if (!existing) return false;

  const now = Date.now();
  const elapsed = now - existing.timestamp;
  const decay = Math.floor(elapsed / (5 * 60 * 1000));
  const currentScore = Math.max(0, existing.score - decay);

  return currentScore >= 50;
}

// التحقق من أنماط مشبوهة في URL
function checkSuspiciousURL(pathname: string): { suspicious: boolean; threatPoints: number } {
  const suspiciousPatterns: Array<{ pattern: RegExp; points: number }> = [
    { pattern: /\.\.\//, points: 30 }, // Path traversal
    { pattern: /<script/i, points: 40 }, // XSS
    { pattern: /\0/, points: 50 }, // Null byte
    { pattern: /%00/, points: 50 }, // URL encoded null
    { pattern: /\/etc\/passwd/, points: 50 }, // Unix file access
    { pattern: /\/proc\//, points: 40 }, // Process info
    { pattern: /admin\.php/i, points: 20 }, // Common attack targets
    { pattern: /wp-admin/i, points: 15 }, // WordPress attacks
    { pattern: /phpmyadmin/i, points: 20 }, // phpMyAdmin attacks
    { pattern: /\.env/, points: 30 }, // Environment file access
    { pattern: /\.git/, points: 25 }, // Git access
    // كلمات كاملة فقط — الـ IDs العشوائية (cuid) ممكن تحتوي cmd/exec بالصدفة وتتحظر بالغلط
    { pattern: /(?<![a-z0-9])(shell|cmd|exec)(?![a-z0-9])/i, points: 35 }, // Shell commands
    { pattern: /\bunion\b.*\bselect\b/i, points: 50 }, // SQL injection
    { pattern: /\bselect\b.*\bfrom\b/i, points: 40 }, // SQL injection
    { pattern: /\binsert\b.*\binto\b/i, points: 45 }, // SQL injection
    { pattern: /\bdelete\b.*\bfrom\b/i, points: 45 }, // SQL injection
    { pattern: /\bdrop\b.*\btable\b/i, points: 50 }, // SQL injection
    { pattern: /\$\{.*\}/, points: 30 }, // Template injection
    { pattern: /\{\{.*\}\}/, points: 25 }, // Template injection
  ];

  let totalPoints = 0;
  let isSuspicious = false;

  for (const { pattern, points } of suspiciousPatterns) {
    if (pattern.test(pathname)) {
      totalPoints += points;
      isSuspicious = true;
    }
  }

  return { suspicious: isSuspicious, threatPoints: totalPoints };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';

  // التحقق من IP محظور
  if (isIPBlocked(clientIP)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Access denied' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check threat score
  if (shouldBlockByThreatScore(clientIP)) {
    // Block IP temporarily
    blockedIPs.set(clientIP, Date.now() + BLOCK_DURATION);
    console.warn(`[SECURITY] IP blocked due to high threat score: ${clientIP}`);
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Access denied' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // التحقق من URL مشبوه
  const urlCheck = checkSuspiciousURL(pathname);
  if (urlCheck.suspicious) {
    // Update threat score
    const newScore = updateThreatScore(clientIP, urlCheck.threatPoints);

    // If score is very high, block immediately
    if (urlCheck.threatPoints >= 30 || newScore >= 50) {
      blockedIPs.set(clientIP, Date.now() + BLOCK_DURATION);
      console.warn(`[SECURITY] Suspicious request blocked from IP: ${clientIP}, Path: ${pathname}, ThreatScore: ${newScore}`);
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Check for suspicious user agents (automated scanners)
  const suspiciousUserAgents = [
    /sqlmap/i, /nikto/i, /nmap/i, /acunetix/i, /burp/i,
    /nessus/i, /dirbuster/i, /gobuster/i, /wfuzz/i,
  ];

  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    updateThreatScore(clientIP, 40);
    blockedIPs.set(clientIP, Date.now() + BLOCK_DURATION * 4); // Block for 1 hour
    console.warn(`[SECURITY] Scanner detected and blocked: ${clientIP}, UA: ${userAgent}`);
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Access denied' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = request.cookies.get('token')?.value;

  // التحقق من صحة التوكن
  let isAuthenticated = false;
  let userRole: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
      userRole = payload.role as string;
    } catch {
      // التوكن غير صالح - حذفه
      isAuthenticated = false;
      const response = NextResponse.next();
      response.cookies.delete('token');
      return addSecurityHeaders(response);
    }
  }

  // حماية صفحات dashboard
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // حماية صفحات admin (فقط للأدمن والسوبر أدمن)
  if (pathname.startsWith('/admin') && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // حماية صفحات instructor
  if (
    pathname.startsWith('/instructor') &&
    userRole !== 'INSTRUCTOR' &&
    userRole !== 'ADMIN' &&
    userRole !== 'SUPER_ADMIN'
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // حماية صفحات entity-owner (فقط لأصحاب الجهات والأدمن)
  if (
    pathname.startsWith('/entity-owner') &&
    userRole !== 'ENTITY_OWNER' &&
    userRole !== 'ADMIN' &&
    userRole !== 'SUPER_ADMIN'
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // إعادة توجيه المستخدم المسجل من صفحات تسجيل الدخول
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // إضافة Headers أمنية لجميع الردود
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/instructor/:path*',
    '/entity-owner/:path*',
    '/login',
    '/register',
    '/api/:path*',
    '/courses/:path*',
  ],
};
