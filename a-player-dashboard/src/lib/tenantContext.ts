// Tenant Context Management System
// Provides centralized company context for the A-Player Evaluations application

export type CompanyContext = { 
  companyId: string; 
  role?: string | null;
  userId: string;
  userEmail?: string;
};

let current: CompanyContext | null = null;

/**
 * Set the current company context for the user session
 * Called once after authentication to establish tenant scope
 */
export function setCompanyContext(ctx: CompanyContext): void { 
  current = ctx; 
  console.log('[TenantContext] Set:', { 
    companyId: ctx.companyId, 
    role: ctx.role, 
    userId: ctx.userId?.substring(0, 8) + '...' 
  });
}

/**
 * Get the current company context
 * Throws if not initialized - this indicates a programming error
 */
export function getCompanyContext(): CompanyContext {
  if (!current) {
    console.error('[TenantContext] Not initialized - this will cause RLS failures');
    console.trace('[TenantContext] Stack trace for missing context');
    throw new Error("CompanyContext not initialized. Ensure user is authenticated and context is set.");
  }
  return current;
}

/**
 * Clear company context (called on logout)
 */
export function clearCompanyContext(): void {
  console.log('[TenantContext] Cleared');
  current = null;
}

/**
 * Get current company ID without throwing (for conditional logic)
 * Returns null if context not set
 */
export function getCurrentCompanyId(): string | null {
  return current?.companyId || null;
}

/**
 * Check if tenant context is initialized
 */
export function hasCompanyContext(): boolean {
  return current !== null;
}

/**
 * Get current user's role (if available)
 */
export function getCurrentUserRole(): string | null {
  return current?.role || null;
}

/**
 * Check if current user has specific role
 */
export function hasRole(role: string): boolean {
  return current?.role === role;
}

/**
 * Check if current user has any of the specified roles
 */
export function hasAnyRole(roles: string[]): boolean {
  return current?.role ? roles.includes(current.role) : false;
}

/**
 * Development helper to validate context state
 */
export function validateTenantContext(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!current) {
    issues.push('Context not initialized');
    return { valid: false, issues };
  }
  
  if (!current.companyId) {
    issues.push('Missing companyId');
  }
  
  if (!current.userId) {
    issues.push('Missing userId');
  }
  
  if (current.companyId && !current.companyId.match(/^[0-9a-f-]{36}$/)) {
    issues.push('Invalid companyId format (expected UUID)');
  }
  
  return { valid: issues.length === 0, issues };
}
