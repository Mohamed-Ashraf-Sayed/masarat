import { NextRequest, NextResponse } from 'next/server';
import {
  performComprehensiveSecurityCheck,
  logSecurityEvent,
  isHoneypotEndpoint,
  generateFingerprint,
  resetBruteForce,
} from './advanced-security';
import { getClientIP } from './security';

// =====================================================
// API Security Middleware Wrapper
// =====================================================

interface SecurityOptions {
  rateLimit?: boolean;
  waf?: boolean;
  botProtection?: boolean;
  anomalyDetection?: boolean;
  bruteForceProtection?: boolean;
  requireAuth?: boolean;
  allowedRoles?: string[];
  csrfProtection?: boolean;
  maxPayloadSize?: number;
}

const DEFAULT_OPTIONS: SecurityOptions = {
  rateLimit: true,
  waf: true,
  botProtection: true,
  anomalyDetection: true,
  bruteForceProtection: false,
  requireAuth: false,
  csrfProtection: false,
  maxPayloadSize: 10 * 1024 * 1024, // 10MB
};

type APIHandler = (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<NextResponse>;

export function withSecurity(handler: APIHandler, options: SecurityOptions = {}): APIHandler {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const ip = getClientIP(request);
    const endpoint = request.nextUrl.pathname;
    const method = request.method;

    // Check honeypot endpoints first
    if (isHoneypotEndpoint(endpoint)) {
      logSecurityEvent({
        eventType: 'suspicious_request',
        severity: 'critical',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        endpoint,
        method,
        details: { reason: 'Honeypot endpoint accessed' },
        fingerprint: generateFingerprint(request).hash,
      });

      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check payload size
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (opts.maxPayloadSize && contentLength > opts.maxPayloadSize) {
      return NextResponse.json(
        { success: false, error: 'Payload too large' },
        { status: 413 }
      );
    }

    // Get request body for WAF analysis (if applicable)
    let bodyText = '';
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const clonedRequest = request.clone();
        bodyText = await clonedRequest.text();
      } catch {
        // Ignore body read errors
      }
    }

    // Include URL params in security check
    const urlParams = request.nextUrl.search;
    const inputToAnalyze = `${endpoint}${urlParams}${bodyText}`;

    // Perform comprehensive security check
    if (opts.waf || opts.botProtection || opts.anomalyDetection) {
      const securityResult = performComprehensiveSecurityCheck(
        request,
        ip,
        inputToAnalyze,
        opts.bruteForceProtection
      );

      if (!securityResult.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: 'Request blocked by security system',
            code: 'SECURITY_BLOCK',
          },
          { status: 403 }
        );
      }
    }

    // CSRF Protection for state-changing methods
    if (opts.csrfProtection && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = request.headers.get('x-csrf-token');
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');

      // Check origin matches
      const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

      if (origin && !origin.startsWith(expectedOrigin)) {
        logSecurityEvent({
          eventType: 'suspicious_request',
          severity: 'warning',
          ip,
          endpoint,
          method,
          details: { reason: 'Origin mismatch', origin, expected: expectedOrigin },
        });

        return NextResponse.json(
          { success: false, error: 'Invalid request origin' },
          { status: 403 }
        );
      }
    }

    // Add security headers to response
    try {
      const response = await handler(request, context);

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
    } catch (error) {
      console.error('API Handler Error:', error);

      logSecurityEvent({
        eventType: 'suspicious_request',
        severity: 'info',
        ip,
        endpoint,
        method,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// =====================================================
// Authentication Security Wrapper
// =====================================================

interface AuthSecurityResult {
  allowed: boolean;
  remainingAttempts?: number;
  lockUntil?: Date;
  error?: string;
}

export async function handleAuthSecurity(
  request: NextRequest,
  identifier: string,
  action: 'check' | 'success' | 'failure'
): Promise<AuthSecurityResult> {
  const ip = getClientIP(request);
  const combinedIdentifier = `${ip}:${identifier}`;

  if (action === 'success') {
    // Reset brute force counter on successful login
    resetBruteForce(combinedIdentifier);
    resetBruteForce(ip);
    return { allowed: true };
  }

  if (action === 'failure') {
    // Log failed attempt
    logSecurityEvent({
      eventType: 'authentication_failure',
      severity: 'warning',
      ip,
      userAgent: request.headers.get('user-agent') || undefined,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      details: { identifier },
      fingerprint: generateFingerprint(request).hash,
    });
  }

  // Check brute force for both IP and identifier
  const { checkBruteForce } = await import('./advanced-security');

  const ipCheck = checkBruteForce(ip);
  const identifierCheck = checkBruteForce(combinedIdentifier);

  if (!ipCheck.allowed) {
    logSecurityEvent({
      eventType: 'account_locked',
      severity: 'critical',
      ip,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      details: { reason: 'IP locked due to multiple failed attempts', lockUntil: ipCheck.lockUntil },
    });

    return {
      allowed: false,
      remainingAttempts: 0,
      lockUntil: ipCheck.lockUntil,
      error: 'Too many failed attempts. Please try again later.',
    };
  }

  if (!identifierCheck.allowed) {
    logSecurityEvent({
      eventType: 'account_locked',
      severity: 'critical',
      ip,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      details: { reason: 'Account locked due to multiple failed attempts', lockUntil: identifierCheck.lockUntil },
    });

    return {
      allowed: false,
      remainingAttempts: 0,
      lockUntil: identifierCheck.lockUntil,
      error: 'Account temporarily locked. Please try again later.',
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.min(ipCheck.remainingAttempts, identifierCheck.remainingAttempts),
  };
}

// =====================================================
// Request Validation Helpers
// =====================================================

export function validateRequestBody<T>(
  body: unknown,
  schema: Record<string, { type: string; required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp }>
): { valid: boolean; data?: T; errors?: string[] } {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }

  const data = body as Record<string, unknown>;

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value !== undefined && value !== null) {
      // Type check
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
      } else if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${field} must be a number`);
      } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${field} must be a boolean`);
      } else if (rules.type === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field} must be a valid email`);
        }
      }

      // Length checks for strings
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} has invalid format`);
        }
      }
    }
  }

  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true, data: data as T };
}

// =====================================================
// Secure Response Helpers
// =====================================================

export function secureJsonResponse(
  data: Record<string, unknown>,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status });

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

export function secureErrorResponse(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  return secureJsonResponse(
    {
      success: false,
      error: message,
      ...(code && { code }),
    },
    status
  );
}

// =====================================================
// IP Reputation Check (placeholder for external service)
// =====================================================

interface IPReputationResult {
  safe: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high';
  categories: string[];
}

export async function checkIPReputation(ip: string): Promise<IPReputationResult> {
  // In production, integrate with services like:
  // - AbuseIPDB
  // - Project Honeypot
  // - Cloudflare
  // - MaxMind

  // Placeholder implementation
  const knownBadIPs: string[] = []; // Add known bad IPs

  if (knownBadIPs.includes(ip)) {
    return {
      safe: false,
      threatLevel: 'high',
      categories: ['known_attacker'],
    };
  }

  return {
    safe: true,
    threatLevel: 'none',
    categories: [],
  };
}
