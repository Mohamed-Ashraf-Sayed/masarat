/**
 * Role-Permission Matrix (Section 14.6)
 * All permissions are enforced at the backend API level.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STUDENT       : Enroll Courses, Register Events, Join Initiatives, Leave Reviews
 * INSTRUCTOR    : Create/Edit Own Courses, View Own Revenue, Submit Course for Approval
 * ENTITY_OWNER  : Create Initiatives, Assign Initiative Leaders, View Entity Reports
 * ADMIN         : Approve Courses & Events, Suspend Users, Manage Entities, Configure Revenue Rules
 * SUPER_ADMIN   : Full System Control, Role Assignment, System Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ENTITY_OWNER' | 'ADMIN' | 'SUPER_ADMIN';

export type Action =
  // ─── Courses ─────────────────────────────────────────────────────────────────
  | 'course:create'             // Create a new course
  | 'course:edit:own'           // Edit own course (instructor)
  | 'course:edit:any'           // Edit any course
  | 'course:delete'             // Delete any course
  | 'course:publish'            // Publish / unpublish a course (admin approval)
  | 'course:suspend'            // Suspend a course
  | 'course:submit'             // Submit course for admin approval
  | 'course:view:admin'         // View all courses in admin panel
  // ─── Lessons / Resources ─────────────────────────────────────────────────────
  | 'lesson:manage:own'         // Manage lessons for own course
  | 'lesson:manage:any'         // Manage lessons for any course
  // ─── Books ───────────────────────────────────────────────────────────────────
  | 'book:create'
  | 'book:edit'
  | 'book:delete'
  // ─── Quizzes ─────────────────────────────────────────────────────────────────
  | 'quiz:create:own'           // Create quiz for own course
  | 'quiz:create:any'           // Create quiz for any course
  | 'quiz:edit:own'
  | 'quiz:edit:any'
  | 'quiz:delete'
  | 'quiz:view:results'         // View quiz results / attempts
  // ─── Categories ──────────────────────────────────────────────────────────────
  | 'category:manage'
  // ─── Enrollments ─────────────────────────────────────────────────────────────
  | 'enrollment:create'         // Enroll in a course (any authenticated user)
  | 'enrollment:view:own'       // View own enrollments
  | 'enrollment:view:any'       // View all enrollments (admin)
  | 'enrollment:manage'         // Approve / reject enrollments
  // ─── Reviews ─────────────────────────────────────────────────────────────────
  | 'review:create'             // Leave a course review (enrolled users)
  // ─── Users ───────────────────────────────────────────────────────────────────
  | 'user:view'                 // View user list
  | 'user:create'               // Create a user
  | 'user:edit'                 // Edit user profile / status
  | 'user:delete'               // Permanently delete a user   ← SUPER_ADMIN only
  | 'user:role:change'          // Change user role              ← SUPER_ADMIN only
  | 'user:suspend'              // Suspend / activate a user
  // ─── Financial ───────────────────────────────────────────────────────────────
  | 'financial:view'            // View all orders and revenue data
  | 'financial:refund'          // Issue refunds / update order status
  | 'revenue:view:own'          // View own course revenue (instructor)
  | 'revenue:rules:configure'   // Configure revenue share rules
  | 'payment:settings:read'     // Read payment gateway settings
  | 'payment:settings:write'    // Edit payment gateway settings ← SUPER_ADMIN only
  // ─── Coupons ─────────────────────────────────────────────────────────────────
  | 'coupon:manage'
  // ─── Union / Entity / Initiative ─────────────────────────────────────────────
  | 'union:manage'              // Full union CRUD (admin)
  | 'entity:manage'             // Full entity CRUD (admin)
  | 'entity:reports:view'       // View own entity reports (entity owner)
  | 'initiative:manage'         // Full initiative CRUD (admin)
  | 'initiative:create:own'     // Create initiative for own entity (entity owner)
  | 'initiative:leader:assign'  // Assign leader to initiative (entity owner)
  | 'initiative:join'           // Join / participate in an initiative (student/user)
  // ─── Events ──────────────────────────────────────────────────────────────────
  | 'event:create'
  | 'event:edit'
  | 'event:delete'
  | 'event:publish'             // Change event status (publish, cancel, etc.)
  | 'event:register'            // Register for an event (authenticated users)
  // ─── Competitions ────────────────────────────────────────────────────────────
  | 'competition:create'
  | 'competition:edit'
  | 'competition:delete'
  | 'competition:join'          // Join a competition (authenticated users)
  // ─── Instructors / Team ──────────────────────────────────────────────────────
  | 'instructor:manage'
  | 'team:manage'
  // ─── Analytics ───────────────────────────────────────────────────────────────
  | 'analytics:view'
  // ─── Notifications ───────────────────────────────────────────────────────────
  | 'notification:send'
  // ─── Security ────────────────────────────────────────────────────────────────
  | 'security:view'             // View security logs and stats
  | 'security:manage'           // Block IPs, manage security settings ← SUPER_ADMIN only
  // ─── Settings ────────────────────────────────────────────────────────────────
  | 'settings:manage'           // General site settings ← SUPER_ADMIN only
  // ─── Admin Management ────────────────────────────────────────────────────────
  | 'admin:create'              // Create ADMIN users  ← SUPER_ADMIN only
  | 'admin:manage';             // Full admin mgmt     ← SUPER_ADMIN only

/**
 * Complete Role-Permission Matrix
 * Each action maps to the roles that are ALLOWED to perform it.
 */
export const PERMISSION_MATRIX: Record<Action, Role[]> = {
  // ─── Courses ─────────────────────────────────────────────────────────────────
  'course:create':              ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'course:edit:own':            ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'course:edit:any':            ['ADMIN', 'SUPER_ADMIN'],
  'course:delete':              ['ADMIN', 'SUPER_ADMIN'],
  'course:publish':             ['ADMIN', 'SUPER_ADMIN'],
  'course:suspend':             ['ADMIN', 'SUPER_ADMIN'],
  'course:submit':              ['INSTRUCTOR'],
  'course:view:admin':          ['ADMIN', 'SUPER_ADMIN'],

  // ─── Lessons ─────────────────────────────────────────────────────────────────
  'lesson:manage:own':          ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'lesson:manage:any':          ['ADMIN', 'SUPER_ADMIN'],

  // ─── Books ───────────────────────────────────────────────────────────────────
  'book:create':                ['ADMIN', 'SUPER_ADMIN'],
  'book:edit':                  ['ADMIN', 'SUPER_ADMIN'],
  'book:delete':                ['ADMIN', 'SUPER_ADMIN'],

  // ─── Quizzes ─────────────────────────────────────────────────────────────────
  'quiz:create:own':            ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'quiz:create:any':            ['ADMIN', 'SUPER_ADMIN'],
  'quiz:edit:own':              ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'quiz:edit:any':              ['ADMIN', 'SUPER_ADMIN'],
  'quiz:delete':                ['ADMIN', 'SUPER_ADMIN'],
  'quiz:view:results':          ['ADMIN', 'SUPER_ADMIN'],

  // ─── Categories ──────────────────────────────────────────────────────────────
  'category:manage':            ['ADMIN', 'SUPER_ADMIN'],

  // ─── Enrollments ─────────────────────────────────────────────────────────────
  'enrollment:create':          ['STUDENT', 'INSTRUCTOR', 'ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'],
  'enrollment:view:own':        ['STUDENT', 'INSTRUCTOR', 'ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'],
  'enrollment:view:any':        ['ADMIN', 'SUPER_ADMIN'],
  'enrollment:manage':          ['ADMIN', 'SUPER_ADMIN'],

  // ─── Reviews ─────────────────────────────────────────────────────────────────
  'review:create':              ['STUDENT', 'INSTRUCTOR', 'ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'],

  // ─── Users ───────────────────────────────────────────────────────────────────
  'user:view':                  ['ADMIN', 'SUPER_ADMIN'],
  'user:create':                ['ADMIN', 'SUPER_ADMIN'],
  'user:edit':                  ['ADMIN', 'SUPER_ADMIN'],
  'user:delete':                ['SUPER_ADMIN'],                  // SUPER_ADMIN only
  'user:role:change':           ['SUPER_ADMIN'],                  // SUPER_ADMIN only
  'user:suspend':               ['ADMIN', 'SUPER_ADMIN'],

  // ─── Financial ───────────────────────────────────────────────────────────────
  'financial:view':             ['ADMIN', 'SUPER_ADMIN'],
  'financial:refund':           ['ADMIN', 'SUPER_ADMIN'],
  'revenue:view:own':           ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
  'revenue:rules:configure':    ['ADMIN', 'SUPER_ADMIN'],
  'payment:settings:read':      ['ADMIN', 'SUPER_ADMIN'],
  'payment:settings:write':     ['SUPER_ADMIN'],                  // SUPER_ADMIN only

  // ─── Coupons ─────────────────────────────────────────────────────────────────
  'coupon:manage':              ['ADMIN', 'SUPER_ADMIN'],

  // ─── Union / Entity / Initiative ─────────────────────────────────────────────
  'union:manage':               ['ADMIN', 'SUPER_ADMIN'],
  'entity:manage':              ['ADMIN', 'SUPER_ADMIN'],
  'entity:reports:view':        ['ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'],
  'initiative:manage':          ['ADMIN', 'SUPER_ADMIN'],
  'initiative:create:own':      ['ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'],
  'initiative:leader:assign':   ['ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'],
  'initiative:join':            ['STUDENT', 'INSTRUCTOR', 'ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'],

  // ─── Events ──────────────────────────────────────────────────────────────────
  'event:create':               ['ADMIN', 'SUPER_ADMIN'],
  'event:edit':                 ['ADMIN', 'SUPER_ADMIN'],
  'event:delete':               ['ADMIN', 'SUPER_ADMIN'],
  'event:publish':              ['ADMIN', 'SUPER_ADMIN'],
  'event:register':             ['STUDENT', 'INSTRUCTOR', 'ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'],

  // ─── Competitions ────────────────────────────────────────────────────────────
  'competition:create':         ['ADMIN', 'SUPER_ADMIN'],
  'competition:edit':           ['ADMIN', 'SUPER_ADMIN'],
  'competition:delete':         ['ADMIN', 'SUPER_ADMIN'],
  'competition:join':           ['STUDENT', 'INSTRUCTOR', 'ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'],

  // ─── Instructors / Team ──────────────────────────────────────────────────────
  'instructor:manage':          ['ADMIN', 'SUPER_ADMIN'],
  'team:manage':                ['ADMIN', 'SUPER_ADMIN'],

  // ─── Analytics ───────────────────────────────────────────────────────────────
  'analytics:view':             ['ADMIN', 'SUPER_ADMIN'],

  // ─── Notifications ───────────────────────────────────────────────────────────
  'notification:send':          ['ADMIN', 'SUPER_ADMIN'],

  // ─── Security ────────────────────────────────────────────────────────────────
  'security:view':              ['ADMIN', 'SUPER_ADMIN'],
  'security:manage':            ['SUPER_ADMIN'],                  // SUPER_ADMIN only

  // ─── Settings ────────────────────────────────────────────────────────────────
  'settings:manage':            ['SUPER_ADMIN'],                  // SUPER_ADMIN only

  // ─── Admin Management ────────────────────────────────────────────────────────
  'admin:create':               ['SUPER_ADMIN'],                  // SUPER_ADMIN only
  'admin:manage':               ['SUPER_ADMIN'],                  // SUPER_ADMIN only
};

/**
 * Check if a role has permission to perform an action.
 */
export function hasPermission(role: Role | string, action: Action): boolean {
  const allowed = PERMISSION_MATRIX[action];
  if (!allowed) return false;
  return allowed.includes(role as Role);
}

/**
 * Check if a role is an admin-level role (ADMIN or SUPER_ADMIN).
 */
export function isAdminRole(role: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Check if a role is SUPER_ADMIN.
 */
export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Check if a role is ENTITY_OWNER.
 */
export function isEntityOwner(role: string): boolean {
  return role === 'ENTITY_OWNER';
}

/**
 * Check if a role can manage their own entity's initiatives
 * (ENTITY_OWNER, ADMIN, or SUPER_ADMIN).
 */
export function canManageInitiatives(role: string): boolean {
  return ['ENTITY_OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
}

/**
 * JWT token data extracted from request.
 */
export interface TokenData {
  userId: string;
  email: string;
  role: string;
}

/**
 * Extract and verify JWT token from Authorization header.
 * Returns null if missing, invalid, or expired.
 */
export function getTokenData(request: Request): TokenData | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(authHeader.substring(7), JWT_SECRET) as TokenData;
  } catch {
    return null;
  }
}

/**
 * Require that the request has a valid token with the given permission.
 * Returns the token data if authorized, or a 401/403 Response if not.
 *
 * Usage in API routes:
 *   const auth = requirePermission(request, 'course:delete');
 *   if (auth instanceof Response) return auth;
 *   // auth.userId, auth.role are available
 */
export function requirePermission(
  request: Request,
  action: Action
): TokenData | Response {
  const tokenData = getTokenData(request);
  if (!tokenData) {
    return new Response(
      JSON.stringify({ success: false, error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!hasPermission(tokenData.role, action)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Insufficient permissions',
        required: action,
        yourRole: tokenData.role,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return tokenData;
}

/**
 * Require admin-level access (ADMIN or SUPER_ADMIN).
 * Returns the token data or a 401/403 Response.
 */
export function requireAdmin(request: Request): TokenData | Response {
  const tokenData = getTokenData(request);
  if (!tokenData) {
    return new Response(
      JSON.stringify({ success: false, error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!isAdminRole(tokenData.role)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Admin access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return tokenData;
}
