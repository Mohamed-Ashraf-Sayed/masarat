import { NextResponse } from 'next/server';

/**
 * Unified Error Handling — Section 14.8
 * Standard error response format: { success, error_code, message, timestamp }
 */

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INVALID_TRANSITION'
  | 'PAYMENT_REQUIRED'
  | 'COURSE_NOT_AVAILABLE'
  | 'ALREADY_ENROLLED'
  | 'INTERNAL_ERROR';

interface ErrorResponseOptions {
  error_code: ErrorCode;
  message: string;
  details?: unknown;
}

export function errorResponse(
  options: ErrorResponseOptions,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error_code: options.error_code,
      message: options.message,
      // كل استهلاك الـ frontend للأخطاء بيقرا result.error — سيبناها متزامنة مع message
      error: options.message,
      ...(options.details !== undefined && { details: options.details }),
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// ── Shorthand helpers ────────────────────────────────────────────────────────

export const unauthorized = (message = 'Unauthorized') =>
  errorResponse({ error_code: 'UNAUTHORIZED', message }, 401);

export const forbidden = (message = 'Access denied') =>
  errorResponse({ error_code: 'FORBIDDEN', message }, 403);

export const notFound = (entity = 'Resource') =>
  errorResponse({ error_code: 'NOT_FOUND', message: `${entity} not found` }, 404);

export const conflict = (message: string, details?: unknown) =>
  errorResponse({ error_code: 'CONFLICT', message, details }, 409);

export const validationError = (message: string, details?: unknown) =>
  errorResponse({ error_code: 'VALIDATION_ERROR', message, details }, 400);

export const invalidTransition = (from: string, to: string, allowed: string[]) =>
  errorResponse(
    {
      error_code: 'INVALID_TRANSITION',
      message: `Invalid status transition: ${from} → ${to}`,
      details: { allowedTransitions: allowed },
    },
    409
  );

export const paymentRequired = (message = 'Payment required to enroll in this course') =>
  errorResponse({ error_code: 'PAYMENT_REQUIRED', message }, 402);

export const courseNotAvailable = (status: string) =>
  errorResponse(
    {
      error_code: 'COURSE_NOT_AVAILABLE',
      message: `Course is not available for enrollment (status: ${status})`,
    },
    409
  );

export const alreadyEnrolled = () =>
  errorResponse({ error_code: 'ALREADY_ENROLLED', message: 'Already enrolled in this course' }, 409);

export const internalError = (message = 'An unexpected error occurred') =>
  errorResponse({ error_code: 'INTERNAL_ERROR', message }, 500);
