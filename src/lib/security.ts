import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// =====================================================
// Security Headers
// =====================================================

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

// =====================================================
// Input Sanitization
// =====================================================

// Remove potentially dangerous characters from strings
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// =====================================================
// File Upload Security
// =====================================================

// Magic numbers for file type validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'video/mp4': [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp
    [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70],
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
  ],
  'video/webm': [[0x1a, 0x45, 0xdf, 0xa3]],
};

// Validate file by checking magic numbers
export async function validateFileSignature(
  file: File,
  allowedTypes: string[]
): Promise<{ valid: boolean; detectedType: string | null }> {
  try {
    const buffer = await file.slice(0, 20).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    for (const type of allowedTypes) {
      const signatures = FILE_SIGNATURES[type];
      if (!signatures) continue;

      for (const signature of signatures) {
        let matches = true;
        for (let i = 0; i < signature.length; i++) {
          if (bytes[i] !== signature[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return { valid: true, detectedType: type };
        }
      }
    }

    return { valid: false, detectedType: null };
  } catch {
    return { valid: false, detectedType: null };
  }
}

// Sanitize filename to prevent path traversal
export function sanitizeFilename(filename: string): string {
  return filename
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Keep only safe characters
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Limit length
    .slice(0, 100);
}

// =====================================================
// JWT Security
// =====================================================

// Verify JWT secret is properly configured
export function verifyJWTSecretConfig(): void {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === 'your-secret-key') {
    console.error('SECURITY WARNING: JWT_SECRET is not properly configured!');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production');
    }
  }

  if (secret && secret.length < 32) {
    console.warn('SECURITY WARNING: JWT_SECRET should be at least 32 characters long');
  }
}

// Get secure JWT secret
export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret === 'your-secret-key') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production');
    }
    // Only allow default in development
    return 'development-secret-key-not-for-production-use';
  }

  return secret;
}

// =====================================================
// Request Validation
// =====================================================

// Validate content type
export function validateContentType(
  request: NextRequest,
  allowedTypes: string[]
): boolean {
  const contentType = request.headers.get('content-type');
  if (!contentType) return false;

  return allowedTypes.some((type) => contentType.includes(type));
}

// Check for suspicious patterns in request
export function checkSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /('|"|;|--)/,
    // NoSQL Injection patterns
    /(\$where|\$gt|\$lt|\$ne|\$regex)/i,
    // Command Injection patterns
    /(\||;|`|\$\()/,
    // Path Traversal patterns
    /(\.\.|\/etc\/|\/proc\/)/,
    // XSS patterns
    /<script|javascript:|on\w+\s*=/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

// =====================================================
// CSRF Protection
// =====================================================

// Generate CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Validate CSRF token
export function validateCSRFToken(request: NextRequest, expectedToken: string): boolean {
  const tokenFromHeader = request.headers.get('x-csrf-token');
  const tokenFromBody = request.headers.get('x-xsrf-token');

  const providedToken = tokenFromHeader || tokenFromBody;

  if (!providedToken || !expectedToken) {
    return false;
  }

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedToken),
      Buffer.from(expectedToken)
    );
  } catch {
    return false;
  }
}

// =====================================================
// IP Security
// =====================================================

// List of blocked IPs (can be extended to use database)
const blockedIPs = new Set<string>();

// Block an IP
export function blockIP(ip: string, duration: number = 3600000): void {
  blockedIPs.add(ip);
  setTimeout(() => blockedIPs.delete(ip), duration);
}

// Check if IP is blocked
export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

// Get client IP from request
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

// =====================================================
// Password Security
// =====================================================

// Check password strength
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password)) score++;
  else feedback.push('أضف حروف صغيرة');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('أضف حروف كبيرة');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('أضف أرقام');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('أضف رموز خاصة');

  // Check for common patterns
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123'];
  if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 2);
    feedback.push('تجنب الأنماط الشائعة');
  }

  return { score, feedback };
}

// =====================================================
// Logging Security Events
// =====================================================

export interface SecurityEvent {
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'blocked_request';
  ip: string;
  userId?: string;
  details: string;
  timestamp: Date;
}

// Log security event (can be extended to use database)
export function logSecurityEvent(event: SecurityEvent): void {
  console.log(`[SECURITY] ${event.type}: ${event.details} (IP: ${event.ip})`);

  // In production, this should be saved to a database or security logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Save to AuditLog table or external logging service
  }
}
