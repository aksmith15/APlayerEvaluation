// RLS Logging and Monitoring
// Helps debug tenant isolation issues and monitor performance

import { getCurrentCompanyId } from './tenantContext';

interface RlsLogEntry {
  operation: string;
  table?: string;
  companyId?: string | null;
  userId?: string;
  error?: any;
  duration?: number;
  success: boolean;
  timestamp: string;
}

/**
 * Wrap database operations with structured RLS logging
 * Helps debug tenant isolation issues and monitor performance
 */
export function wrapRls<T extends (...a:any)=>Promise<any>>(fn: T, label: string): T {
  return (async (...args: any[]) => {
    const start = performance.now();
    const companyId = getCurrentCompanyId();
    
    try {
      const res = await fn(...args);
      const duration = performance.now() - start;
      
      const logEntry: RlsLogEntry = {
        operation: label,
        companyId,
        duration: Number(duration.toFixed(2)),
        success: !res?.error,
        timestamp: new Date().toISOString()
      };
      
      if (res?.error) {
        logEntry.error = {
          code: res.error.code,
          message: res.error.message,
          details: res.error.details
        };
        
        if (res.error.code === '42501') {
          console.error(`[RLS DENIED] ${label}:`, logEntry);
          
          // Send to monitoring in production
          if (import.meta.env.PROD) {
            sendRlsAlert(logEntry);
          }
        } else {
          console.error(`[DB ERROR] ${label}:`, logEntry);
        }
      } else if (import.meta.env.DEV) {
        console.log(`[DB SUCCESS] ${label}: ${duration.toFixed(2)}ms`);
      }
      
      // Store for analytics (optional)
      if (import.meta.env.DEV) {
        storeRlsLog(logEntry);
      }
      
      return res;
    } catch (error) {
      const duration = performance.now() - start;
      
      const logEntry: RlsLogEntry = {
        operation: label,
        companyId,
        duration: Number(duration.toFixed(2)),
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        timestamp: new Date().toISOString()
      };
      
      console.error(`[DB EXCEPTION] ${label}:`, logEntry);
      
      if (import.meta.env.PROD) {
        sendRlsAlert(logEntry);
      }
      
      throw error;
    }
  }) as T;
}

/**
 * Create wrapped version of common Supabase operations
 */
export function wrapSupabaseClient(sb: any) {
  return {
    from: (table: string) => ({
      select: wrapRls(sb.from(table).select.bind(sb.from(table)), `select:${table}`),
      insert: wrapRls(sb.from(table).insert.bind(sb.from(table)), `insert:${table}`),
      update: wrapRls(sb.from(table).update.bind(sb.from(table)), `update:${table}`),
      upsert: wrapRls(sb.from(table).upsert.bind(sb.from(table)), `upsert:${table}`),
      delete: wrapRls(sb.from(table).delete.bind(sb.from(table)), `delete:${table}`)
    }),
    rpc: wrapRls(sb.rpc.bind(sb), 'rpc'),
    auth: sb.auth // Don't wrap auth operations
  };
}

/**
 * Store RLS logs for development analysis
 */
function storeRlsLog(entry: RlsLogEntry): void {
  try {
    const logs = JSON.parse(localStorage.getItem('rlsLogs') || '[]');
    logs.push(entry);
    
    // Keep only last 100 entries
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    localStorage.setItem('rlsLogs', JSON.stringify(logs));
  } catch (error) {
    console.warn('[RLS] Could not store log:', error);
  }
}

/**
 * Get stored RLS logs for analysis
 */
export function getRlsLogs(): RlsLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem('rlsLogs') || '[]');
  } catch (error) {
    console.warn('[RLS] Could not retrieve logs:', error);
    return [];
  }
}

/**
 * Clear stored RLS logs
 */
export function clearRlsLogs(): void {
  localStorage.removeItem('rlsLogs');
}

/**
 * Send RLS alert to monitoring service (placeholder)
 */
function sendRlsAlert(entry: RlsLogEntry): void {
  // In production, this would send to your monitoring service
  // Examples: DataDog, Sentry, LogRocket, etc.
  
  if (entry.error?.code === '42501') {
    console.warn('[MONITORING] RLS Permission Denied:', entry);
    
    // Example monitoring integration:
    // datadog.increment('rls.permission_denied', 1, {
    //   operation: entry.operation,
    //   company_id: entry.companyId
    // });
  }
}

/**
 * Generate RLS analytics report
 */
export function generateRlsReport(): {
  totalOperations: number;
  successRate: number;
  avgDuration: number;
  errorsByType: Record<string, number>;
  operationsByTable: Record<string, number>;
} {
  const logs = getRlsLogs();
  
  if (logs.length === 0) {
    return {
      totalOperations: 0,
      successRate: 0,
      avgDuration: 0,
      errorsByType: {},
      operationsByTable: {}
    };
  }
  
  const totalOperations = logs.length;
  const successfulOperations = logs.filter(l => l.success).length;
  const successRate = (successfulOperations / totalOperations) * 100;
  
  const totalDuration = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
  const avgDuration = totalDuration / totalOperations;
  
  const errorsByType: Record<string, number> = {};
  const operationsByTable: Record<string, number> = {};
  
  logs.forEach(log => {
    if (log.error?.code) {
      errorsByType[log.error.code] = (errorsByType[log.error.code] || 0) + 1;
    }
    
    if (log.table) {
      operationsByTable[log.table] = (operationsByTable[log.table] || 0) + 1;
    }
  });
  
  return {
    totalOperations,
    successRate: Number(successRate.toFixed(2)),
    avgDuration: Number(avgDuration.toFixed(2)),
    errorsByType,
    operationsByTable
  };
}
