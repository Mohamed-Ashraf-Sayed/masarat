import { NextRequest } from 'next/server';
import crypto from 'crypto';

// =====================================================
// Advanced WAF (Web Application Firewall) Rules
// =====================================================

interface WAFRule {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'log' | 'block' | 'challenge';
}

const WAF_RULES: WAFRule[] = [
  // SQL Injection - Critical
  { name: 'sql_union', pattern: /\bUNION\s+(ALL\s+)?SELECT\b/i, severity: 'critical', action: 'block' },
  { name: 'sql_select', pattern: /\bSELECT\s+.*\s+FROM\s+/i, severity: 'high', action: 'block' },
  { name: 'sql_insert', pattern: /\bINSERT\s+INTO\s+/i, severity: 'critical', action: 'block' },
  { name: 'sql_update', pattern: /\bUPDATE\s+.*\s+SET\s+/i, severity: 'critical', action: 'block' },
  { name: 'sql_delete', pattern: /\bDELETE\s+FROM\s+/i, severity: 'critical', action: 'block' },
  { name: 'sql_drop', pattern: /\bDROP\s+(TABLE|DATABASE|INDEX)\b/i, severity: 'critical', action: 'block' },
  { name: 'sql_comment', pattern: /(--)|(\/\*.*\*\/)|#/g, severity: 'medium', action: 'log' },
  { name: 'sql_hex', pattern: /0x[0-9a-fA-F]+/g, severity: 'medium', action: 'log' },

  // NoSQL Injection
  { name: 'nosql_operator', pattern: /\$((where|gt|gte|lt|lte|ne|in|nin|or|and|not|regex|exists|type|mod|text|expr|jsonSchema))\b/i, severity: 'critical', action: 'block' },
  { name: 'nosql_eval', pattern: /\$function|\$accumulator/i, severity: 'critical', action: 'block' },

  // XSS (Cross-Site Scripting)
  { name: 'xss_script', pattern: /<script[^>]*>[\s\S]*?<\/script>/gi, severity: 'critical', action: 'block' },
  { name: 'xss_event', pattern: /\s+on\w+\s*=/gi, severity: 'high', action: 'block' },
  { name: 'xss_javascript', pattern: /javascript\s*:/gi, severity: 'critical', action: 'block' },
  { name: 'xss_data', pattern: /data\s*:\s*text\/html/gi, severity: 'high', action: 'block' },
  { name: 'xss_vbscript', pattern: /vbscript\s*:/gi, severity: 'critical', action: 'block' },
  { name: 'xss_expression', pattern: /expression\s*\(/gi, severity: 'high', action: 'block' },
  { name: 'xss_iframe', pattern: /<iframe[^>]*>/gi, severity: 'medium', action: 'log' },
  { name: 'xss_object', pattern: /<object[^>]*>/gi, severity: 'medium', action: 'log' },
  { name: 'xss_embed', pattern: /<embed[^>]*>/gi, severity: 'medium', action: 'log' },

  // Command Injection
  { name: 'cmd_pipe', pattern: /\|[^|]/g, severity: 'high', action: 'block' },
  { name: 'cmd_semicolon', pattern: /;\s*(ls|cat|rm|wget|curl|bash|sh|python|perl|ruby|nc|netcat)/gi, severity: 'critical', action: 'block' },
  { name: 'cmd_backtick', pattern: /`[^`]+`/g, severity: 'critical', action: 'block' },
  { name: 'cmd_dollar', pattern: /\$\([^)]+\)/g, severity: 'critical', action: 'block' },

  // Path Traversal
  { name: 'path_traversal', pattern: /\.\.[\/\\]/g, severity: 'critical', action: 'block' },
  { name: 'path_etc', pattern: /\/etc\/(passwd|shadow|hosts)/gi, severity: 'critical', action: 'block' },
  { name: 'path_proc', pattern: /\/proc\/(self|version|cmdline)/gi, severity: 'critical', action: 'block' },
  { name: 'path_windows', pattern: /[a-zA-Z]:\\(windows|system32)/gi, severity: 'critical', action: 'block' },

  // SSRF (Server-Side Request Forgery)
  { name: 'ssrf_localhost', pattern: /(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)/gi, severity: 'high', action: 'block' },
  { name: 'ssrf_internal', pattern: /(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)/g, severity: 'high', action: 'block' },
  { name: 'ssrf_metadata', pattern: /169\.254\.169\.254/g, severity: 'critical', action: 'block' },

  // LFI/RFI (Local/Remote File Inclusion)
  { name: 'lfi_php', pattern: /php:\/\/(filter|input|data)/gi, severity: 'critical', action: 'block' },
  { name: 'lfi_expect', pattern: /expect:\/\//gi, severity: 'critical', action: 'block' },
  { name: 'rfi_http', pattern: /(https?|ftp):\/\/[^\s]+\.(php|asp|jsp)/gi, severity: 'high', action: 'block' },

  // XXE (XML External Entity)
  { name: 'xxe_entity', pattern: /<!ENTITY/gi, severity: 'critical', action: 'block' },
  { name: 'xxe_doctype', pattern: /<!DOCTYPE[^>]*\[/gi, severity: 'high', action: 'block' },

  // LDAP Injection
  { name: 'ldap_injection', pattern: /[()|\*\\]/g, severity: 'medium', action: 'log' },

  // Log Injection
  { name: 'log_newline', pattern: /[\r\n]/g, severity: 'low', action: 'log' },

  // Scanner Detection
  { name: 'scanner_nikto', pattern: /nikto/gi, severity: 'high', action: 'block' },
  { name: 'scanner_sqlmap', pattern: /sqlmap/gi, severity: 'critical', action: 'block' },
  { name: 'scanner_nmap', pattern: /nmap/gi, severity: 'high', action: 'block' },
  { name: 'scanner_acunetix', pattern: /acunetix/gi, severity: 'high', action: 'block' },
  { name: 'scanner_burp', pattern: /burp/gi, severity: 'high', action: 'block' },
];

export interface WAFResult {
  blocked: boolean;
  matchedRules: { name: string; severity: string }[];
  threatScore: number;
}

export function analyzeRequest(input: string): WAFResult {
  const matchedRules: { name: string; severity: string }[] = [];
  let threatScore = 0;

  const severityScores = {
    low: 1,
    medium: 5,
    high: 15,
    critical: 30,
  };

  for (const rule of WAF_RULES) {
    if (rule.pattern.test(input)) {
      matchedRules.push({ name: rule.name, severity: rule.severity });
      threatScore += severityScores[rule.severity];
    }
    // Reset regex lastIndex for global patterns
    rule.pattern.lastIndex = 0;
  }

  return {
    blocked: threatScore >= 15 || matchedRules.some(r => r.severity === 'critical'),
    matchedRules,
    threatScore,
  };
}

// =====================================================
// Brute Force Protection & Account Lockout
// =====================================================

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  locked: boolean;
  lockUntil: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

const BRUTE_FORCE_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockDuration: 30 * 60 * 1000, // 30 minutes lock
  progressiveLockMultiplier: 2, // Double lock time on repeated lockouts
};

export function checkBruteForce(identifier: string): { allowed: boolean; remainingAttempts: number; lockUntil?: Date } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      locked: false,
      lockUntil: 0,
    });
    return { allowed: true, remainingAttempts: BRUTE_FORCE_CONFIG.maxAttempts - 1 };
  }

  // Check if currently locked
  if (attempt.locked && attempt.lockUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockUntil: new Date(attempt.lockUntil),
    };
  }

  // Reset if window expired
  if (now - attempt.firstAttempt > BRUTE_FORCE_CONFIG.windowMs) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      locked: false,
      lockUntil: 0,
    });
    return { allowed: true, remainingAttempts: BRUTE_FORCE_CONFIG.maxAttempts - 1 };
  }

  // Increment attempt
  attempt.count++;
  attempt.lastAttempt = now;

  // Check if should lock
  if (attempt.count >= BRUTE_FORCE_CONFIG.maxAttempts) {
    attempt.locked = true;
    attempt.lockUntil = now + BRUTE_FORCE_CONFIG.lockDuration;
    loginAttempts.set(identifier, attempt);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockUntil: new Date(attempt.lockUntil),
    };
  }

  loginAttempts.set(identifier, attempt);
  return {
    allowed: true,
    remainingAttempts: BRUTE_FORCE_CONFIG.maxAttempts - attempt.count,
  };
}

export function resetBruteForce(identifier: string): void {
  loginAttempts.delete(identifier);
}

export function recordFailedLogin(identifier: string): void {
  checkBruteForce(identifier);
}

// =====================================================
// Request Fingerprinting & Bot Detection
// =====================================================

interface RequestFingerprint {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  connection: string;
  cacheControl: string;
  hash: string;
}

export function generateFingerprint(request: NextRequest): RequestFingerprint {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  const connection = request.headers.get('connection') || '';
  const cacheControl = request.headers.get('cache-control') || '';

  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${connection}|${cacheControl}`;
  const hash = crypto.createHash('sha256').update(fingerprintData).digest('hex');

  return {
    userAgent,
    acceptLanguage,
    acceptEncoding,
    connection,
    cacheControl,
    hash,
  };
}

interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  reasons: string[];
}

const KNOWN_BOTS = [
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i,
  /yandexbot/i, /facebot/i, /ia_archiver/i, /applebot/i,
];

const SUSPICIOUS_USER_AGENTS = [
  /curl/i, /wget/i, /python/i, /java/i, /perl/i, /ruby/i,
  /libwww/i, /httpclient/i, /okhttp/i, /axios/i, /node-fetch/i,
  /postman/i, /insomnia/i, /httpie/i, /scrapy/i, /puppeteer/i,
  /playwright/i, /selenium/i, /phantomjs/i, /headless/i,
];

export function detectBot(request: NextRequest): BotDetectionResult {
  const reasons: string[] = [];
  let botScore = 0;

  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language');
  const acceptEncoding = request.headers.get('accept-encoding');
  const accept = request.headers.get('accept');

  // Check for known search engine bots (allowed)
  if (KNOWN_BOTS.some(pattern => pattern.test(userAgent))) {
    return { isBot: true, confidence: 100, reasons: ['Known search engine bot'] };
  }

  // Check for empty or missing user agent
  if (!userAgent || userAgent.length < 10) {
    botScore += 40;
    reasons.push('Missing or short user agent');
  }

  // Check for suspicious user agents
  if (SUSPICIOUS_USER_AGENTS.some(pattern => pattern.test(userAgent))) {
    botScore += 30;
    reasons.push('Suspicious user agent pattern');
  }

  // Check for missing common headers
  if (!acceptLanguage) {
    botScore += 15;
    reasons.push('Missing Accept-Language header');
  }

  if (!acceptEncoding) {
    botScore += 10;
    reasons.push('Missing Accept-Encoding header');
  }

  if (!accept || accept === '*/*') {
    botScore += 10;
    reasons.push('Generic or missing Accept header');
  }

  // Check for specific bot indicators
  if (userAgent.includes('bot') || userAgent.includes('spider') || userAgent.includes('crawler')) {
    botScore += 25;
    reasons.push('Bot keyword in user agent');
  }

  return {
    isBot: botScore >= 50,
    confidence: Math.min(botScore, 100),
    reasons,
  };
}

// =====================================================
// API Request Signing & Validation
// =====================================================

const API_SIGNING_SECRET = process.env.API_SIGNING_SECRET || 'api-signing-secret-change-in-production';

export function signRequest(payload: string, timestamp: number): string {
  const dataToSign = `${timestamp}.${payload}`;
  return crypto
    .createHmac('sha256', API_SIGNING_SECRET)
    .update(dataToSign)
    .digest('hex');
}

export function validateRequestSignature(
  payload: string,
  timestamp: number,
  signature: string,
  maxAgeMs: number = 300000 // 5 minutes
): { valid: boolean; error?: string } {
  // Check timestamp freshness
  const now = Date.now();
  if (Math.abs(now - timestamp) > maxAgeMs) {
    return { valid: false, error: 'Request timestamp expired' };
  }

  // Verify signature
  const expectedSignature = signRequest(payload, timestamp);

  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    return { valid, error: valid ? undefined : 'Invalid signature' };
  } catch {
    return { valid: false, error: 'Invalid signature format' };
  }
}

// =====================================================
// Anomaly Detection System
// =====================================================

interface RequestPattern {
  count: number;
  endpoints: Map<string, number>;
  methods: Map<string, number>;
  timestamps: number[];
  payloadSizes: number[];
}

const requestPatterns = new Map<string, RequestPattern>();

const ANOMALY_THRESHOLDS = {
  maxRequestsPerMinute: 100,
  maxEndpointsPerMinute: 30,
  maxPayloadSize: 10 * 1024 * 1024, // 10MB
  burstThreshold: 20, // requests in 5 seconds
  suspiciousMethodRatio: 0.5, // ratio of DELETE/PUT to total
};

export interface AnomalyResult {
  isAnomalous: boolean;
  score: number;
  anomalies: string[];
}

export function detectAnomaly(
  identifier: string,
  endpoint: string,
  method: string,
  payloadSize: number
): AnomalyResult {
  const now = Date.now();
  const anomalies: string[] = [];
  let score = 0;

  let pattern = requestPatterns.get(identifier);

  if (!pattern) {
    pattern = {
      count: 0,
      endpoints: new Map(),
      methods: new Map(),
      timestamps: [],
      payloadSizes: [],
    };
  }

  // Clean old data (keep last minute)
  const oneMinuteAgo = now - 60000;
  pattern.timestamps = pattern.timestamps.filter(t => t > oneMinuteAgo);

  // Update pattern
  pattern.count = pattern.timestamps.length + 1;
  pattern.timestamps.push(now);
  pattern.endpoints.set(endpoint, (pattern.endpoints.get(endpoint) || 0) + 1);
  pattern.methods.set(method, (pattern.methods.get(method) || 0) + 1);
  pattern.payloadSizes.push(payloadSize);

  // Check request rate
  if (pattern.count > ANOMALY_THRESHOLDS.maxRequestsPerMinute) {
    score += 30;
    anomalies.push('Excessive request rate');
  }

  // Check endpoint diversity (rapid scanning)
  if (pattern.endpoints.size > ANOMALY_THRESHOLDS.maxEndpointsPerMinute) {
    score += 25;
    anomalies.push('Rapid endpoint scanning detected');
  }

  // Check for burst activity
  const fiveSecondsAgo = now - 5000;
  const recentRequests = pattern.timestamps.filter(t => t > fiveSecondsAgo).length;
  if (recentRequests > ANOMALY_THRESHOLDS.burstThreshold) {
    score += 35;
    anomalies.push('Burst activity detected');
  }

  // Check method distribution
  const totalRequests = Array.from(pattern.methods.values()).reduce((a, b) => a + b, 0);
  const destructiveMethods = (pattern.methods.get('DELETE') || 0) + (pattern.methods.get('PUT') || 0);
  if (totalRequests > 10 && destructiveMethods / totalRequests > ANOMALY_THRESHOLDS.suspiciousMethodRatio) {
    score += 20;
    anomalies.push('High ratio of destructive methods');
  }

  // Check payload size
  if (payloadSize > ANOMALY_THRESHOLDS.maxPayloadSize) {
    score += 15;
    anomalies.push('Oversized payload');
  }

  requestPatterns.set(identifier, pattern);

  return {
    isAnomalous: score >= 50,
    score,
    anomalies,
  };
}

// =====================================================
// Security Audit Logging
// =====================================================

export type SecurityEventType =
  | 'waf_block'
  | 'brute_force_attempt'
  | 'account_locked'
  | 'bot_detected'
  | 'anomaly_detected'
  | 'invalid_signature'
  | 'suspicious_request'
  | 'authentication_failure'
  | 'authorization_failure'
  | 'rate_limit_exceeded';

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  severity: 'info' | 'warning' | 'critical';
  ip: string;
  userId?: string;
  userAgent?: string;
  endpoint: string;
  method: string;
  details: Record<string, unknown>;
  fingerprint?: string;
}

const auditLogs: SecurityAuditLog[] = [];
const MAX_LOGS_IN_MEMORY = 10000;

// Save to database asynchronously
async function saveToDatabase(event: {
  eventType: string;
  severity: string;
  ip: string;
  userId?: string;
  userAgent?: string;
  endpoint: string;
  method: string;
  details: Record<string, unknown>;
  fingerprint?: string;
}): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const { default: prisma } = await import('@/lib/prisma');

    await prisma.securityAuditLog.create({
      data: {
        eventType: event.eventType,
        severity: event.severity,
        ip: event.ip,
        userId: event.userId,
        userAgent: event.userAgent,
        endpoint: event.endpoint,
        method: event.method,
        details: JSON.stringify(event.details),
        fingerprint: event.fingerprint,
        blocked: ['waf_block', 'bot_detected', 'account_locked'].includes(event.eventType),
      },
    });
  } catch (error) {
    console.error('Failed to save security log to database:', error);
  }
}

export function logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): void {
  const log: SecurityAuditLog = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };

  // Store in memory for quick access
  auditLogs.push(log);

  // Keep memory bounded
  if (auditLogs.length > MAX_LOGS_IN_MEMORY) {
    auditLogs.shift();
  }

  // Console log for critical events
  if (log.severity === 'critical') {
    console.error(`[SECURITY CRITICAL] ${log.eventType}: ${JSON.stringify(log.details)}`);
  } else if (log.severity === 'warning') {
    console.warn(`[SECURITY WARNING] ${log.eventType}: ${JSON.stringify(log.details)}`);
  }

  // Save to database asynchronously (don't await to not block the request)
  saveToDatabase(event).catch(() => {});
}

export function getSecurityLogs(
  filters?: {
    eventType?: SecurityEventType;
    severity?: 'info' | 'warning' | 'critical';
    ip?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit: number = 100
): SecurityAuditLog[] {
  let filtered = [...auditLogs];

  if (filters) {
    if (filters.eventType) {
      filtered = filtered.filter(log => log.eventType === filters.eventType);
    }
    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }
    if (filters.ip) {
      filtered = filtered.filter(log => log.ip === filters.ip);
    }
    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }
    if (filters.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
    }
  }

  return filtered.slice(-limit).reverse();
}

// =====================================================
// Honeypot System
// =====================================================

const HONEYPOT_ENDPOINTS = [
  '/admin.php',
  '/wp-admin',
  '/phpmyadmin',
  '/.env',
  '/config.php',
  '/backup.sql',
  '/db.sql',
  '/.git/config',
  '/server-status',
  '/xmlrpc.php',
];

export function isHoneypotEndpoint(pathname: string): boolean {
  return HONEYPOT_ENDPOINTS.some(hp => pathname.toLowerCase().includes(hp.toLowerCase()));
}

// =====================================================
// Geo-blocking (placeholder - requires GeoIP database)
// =====================================================

const BLOCKED_COUNTRIES: string[] = []; // Add country codes to block

export function isCountryBlocked(countryCode: string): boolean {
  return BLOCKED_COUNTRIES.includes(countryCode.toUpperCase());
}

// =====================================================
// Comprehensive Security Check
// =====================================================

export interface ComprehensiveSecurityResult {
  allowed: boolean;
  checks: {
    waf: WAFResult;
    bot: BotDetectionResult;
    anomaly: AnomalyResult;
    bruteForce?: { allowed: boolean; remainingAttempts: number };
  };
  blockedReason?: string;
}

export function performComprehensiveSecurityCheck(
  request: NextRequest,
  identifier: string,
  inputData: string,
  isAuthEndpoint: boolean = false
): ComprehensiveSecurityResult {
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  const payloadSize = parseInt(request.headers.get('content-length') || '0');

  // WAF Analysis
  const wafResult = analyzeRequest(inputData);

  // Bot Detection
  const botResult = detectBot(request);

  // Anomaly Detection
  const anomalyResult = detectAnomaly(identifier, endpoint, method, payloadSize);

  // Brute Force Check (only for auth endpoints)
  let bruteForceResult;
  if (isAuthEndpoint) {
    bruteForceResult = checkBruteForce(identifier);
  }

  // Determine if request should be blocked
  let allowed = true;
  let blockedReason: string | undefined;

  if (wafResult.blocked) {
    allowed = false;
    blockedReason = `WAF: ${wafResult.matchedRules.map(r => r.name).join(', ')}`;
  } else if (botResult.isBot && botResult.confidence > 80) {
    allowed = false;
    blockedReason = `Bot detected: ${botResult.reasons.join(', ')}`;
  } else if (anomalyResult.isAnomalous) {
    allowed = false;
    blockedReason = `Anomaly: ${anomalyResult.anomalies.join(', ')}`;
  } else if (bruteForceResult && !bruteForceResult.allowed) {
    allowed = false;
    blockedReason = 'Account temporarily locked due to multiple failed attempts';
  }

  // Log security event if blocked
  if (!allowed) {
    logSecurityEvent({
      eventType: wafResult.blocked ? 'waf_block' :
                 botResult.isBot ? 'bot_detected' :
                 anomalyResult.isAnomalous ? 'anomaly_detected' : 'brute_force_attempt',
      severity: 'warning',
      ip: identifier,
      userAgent: request.headers.get('user-agent') || undefined,
      endpoint,
      method,
      details: {
        waf: wafResult,
        bot: botResult,
        anomaly: anomalyResult,
        bruteForce: bruteForceResult,
        blockedReason,
      },
      fingerprint: generateFingerprint(request).hash,
    });
  }

  return {
    allowed,
    checks: {
      waf: wafResult,
      bot: botResult,
      anomaly: anomalyResult,
      bruteForce: bruteForceResult,
    },
    blockedReason,
  };
}
