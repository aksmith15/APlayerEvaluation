// Tenancy Event Monitoring and Logging
// Provides structured logging for tenancy-related events

import { getCurrentCompanyId, getCurrentUserRole } from './tenantContext';

interface TenancyEvent {
  type: 'RLS_ERROR' | 'MISSING_CONTEXT' | 'CROSS_TENANT_ATTEMPT' | 'CONTEXT_INIT' | 'CONTEXT_FAILURE';
  operation: string;
  table?: string;
  error?: any;
  context?: any;
  userId?: string;
  companyId?: string | null;
  userRole?: string | null;
  url?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Log tenancy-related events for monitoring and debugging
 */
export function logTenancyEvent(event: Omit<TenancyEvent, 'timestamp' | 'companyId' | 'userRole' | 'url' | 'userAgent'>): void {
  const logEntry: TenancyEvent = {
    ...event,
    companyId: getCurrentCompanyId(),
    userRole: getCurrentUserRole(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString()
  };
  
  // Development logging
  if (import.meta.env.DEV) {
    switch (event.type) {
      case 'RLS_ERROR':
        console.error('[TENANCY RLS]', logEntry);
        break;
      case 'CROSS_TENANT_ATTEMPT':
        console.warn('[TENANCY SECURITY]', logEntry);
        break;
      case 'MISSING_CONTEXT':
        console.warn('[TENANCY CONTEXT]', logEntry);
        break;
      default:
        console.log('[TENANCY]', logEntry);
    }
  }
  
  // Store for local analysis
  storeTenancyEvent(logEntry);
  
  // Production monitoring
  if (import.meta.env.PROD) {
    sendToMonitoring(logEntry);
  }
}

/**
 * Store tenancy events locally for debugging
 */
function storeTenancyEvent(event: TenancyEvent): void {
  try {
    const events = JSON.parse(localStorage.getItem('tenancyEvents') || '[]');
    events.push(event);
    
    // Keep only last 50 events
    if (events.length > 50) {
      events.splice(0, events.length - 50);
    }
    
    localStorage.setItem('tenancyEvents', JSON.stringify(events));
  } catch (error) {
    console.warn('[TENANCY] Could not store event:', error);
  }
}

/**
 * Send to production monitoring service
 */
function sendToMonitoring(event: TenancyEvent): void {
  // Example implementations for different monitoring services
  
  try {
    // Example: Custom analytics endpoint
    if (event.type === 'RLS_ERROR' || event.type === 'CROSS_TENANT_ATTEMPT') {
      fetch('/api/monitoring/tenancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(err => console.warn('[MONITORING] Failed to send event:', err));
    }
    
    // Example: Browser error reporting
    if (event.type === 'RLS_ERROR' && typeof window !== 'undefined' && window.onerror) {
      window.dispatchEvent(new CustomEvent('tenancy-error', { detail: event }));
    }
    
  } catch (error) {
    console.warn('[MONITORING] Error sending event:', error);
  }
}

/**
 * Get stored tenancy events for analysis
 */
export function getTenancyEvents(): TenancyEvent[] {
  try {
    return JSON.parse(localStorage.getItem('tenancyEvents') || '[]');
  } catch (error) {
    console.warn('[TENANCY] Could not retrieve events:', error);
    return [];
  }
}

/**
 * Clear stored tenancy events
 */
export function clearTenancyEvents(): void {
  localStorage.removeItem('tenancyEvents');
}

/**
 * Generate tenancy health report
 */
export function generateTenancyReport(): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  recentErrors: TenancyEvent[];
  companiesAccessed: string[];
  operationsPerformed: string[];
} {
  const events = getTenancyEvents();
  
  const eventsByType: Record<string, number> = {};
  const companiesAccessed = new Set<string>();
  const operationsPerformed = new Set<string>();
  
  events.forEach(event => {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    
    if (event.companyId) {
      companiesAccessed.add(event.companyId);
    }
    
    operationsPerformed.add(event.operation);
  });
  
  const recentErrors = events
    .filter(e => e.type === 'RLS_ERROR' || e.type === 'CROSS_TENANT_ATTEMPT')
    .slice(-5); // Last 5 errors
  
  return {
    totalEvents: events.length,
    eventsByType,
    recentErrors,
    companiesAccessed: Array.from(companiesAccessed),
    operationsPerformed: Array.from(operationsPerformed)
  };
}

/**
 * Monitor tenant context health
 */
export function monitorTenantHealth(): {
  contextInitialized: boolean;
  companyId: string | null;
  userRole: string | null;
  lastActivity: string | null;
} {
  const events = getTenancyEvents();
  const lastActivity = events.length > 0 ? events[events.length - 1].timestamp : null;
  
  return {
    contextInitialized: getCurrentCompanyId() !== null,
    companyId: getCurrentCompanyId(),
    userRole: getCurrentUserRole(),
    lastActivity
  };
}

/**
 * Development helper to validate tenancy setup
 */
export function validateTenancySetup(): {
  valid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check if context is initialized
  if (!getCurrentCompanyId()) {
    issues.push('Tenant context not initialized');
    recommendations.push('Ensure user is logged in and context is set in App.tsx');
  }
  
  // Check feature flag
  const tenancyEnforced = import.meta.env.VITE_TENANCY_ENFORCED === 'true';
  if (!tenancyEnforced) {
    recommendations.push('Set VITE_TENANCY_ENFORCED=true to enable tenant-aware queries');
  }
  
  // Check for recent errors
  const events = getTenancyEvents();
  const recentErrors = events.filter(e => 
    e.type === 'RLS_ERROR' && 
    Date.now() - new Date(e.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
  );
  
  if (recentErrors.length > 0) {
    issues.push(`${recentErrors.length} recent RLS errors detected`);
    recommendations.push('Check database policies and tenant context setup');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    recommendations
  };
}
