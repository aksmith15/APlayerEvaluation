// Tenant-Aware Database Access Layer
// Automatically adds company_id filters and validation for multi-tenant tables

import type { SupabaseClient } from "@supabase/supabase-js";
import { getCompanyContext, getCurrentCompanyId } from "./tenantContext";

// Feature flag for progressive rollout
const TENANCY_ENFORCED = import.meta.env.VITE_TENANCY_ENFORCED === 'true';

/**
 * Tenant-aware database query builder
 * Automatically adds company_id filters and validation for multi-tenant tables
 */
export function fromTenant<T extends string>(sb: SupabaseClient, table: T) {
  if (!TENANCY_ENFORCED) {
    // Fallback to existing behavior during rollout
    console.log(`[DB] Using standard query for ${table} (TENANCY_ENFORCED=false)`);
    return sb.from(table);
  }

  const { companyId, userId } = getCompanyContext();
  console.log(`[DB] Tenant-aware query for ${table} (company: ${companyId})`);
  
  return {
    select: (...args: any[]) => {
      const query = sb.from(table).select(...args);
      
      // Add company_id filter for multi-tenant tables
      if (isCompanyScoped(table)) {
        console.log(`[DB] Adding company_id filter to ${table} select`);
        return query.eq("company_id", companyId);
      }
      
      return query;
    },
    
    insert: (payload: any) => {
      const enrichedPayload = Array.isArray(payload)
        ? payload.map(r => enrichPayloadWithCompany(r, table, companyId, userId))
        : enrichPayloadWithCompany(payload, table, companyId, userId);
      
      console.log(`[DB] Insert to ${table} with tenant context:`, { 
        records: Array.isArray(payload) ? payload.length : 1,
        companyId: isCompanyScoped(table) ? companyId : 'not required'
      });
      
      return sb.from(table).insert(enrichedPayload);
    },
    
    update: (patch: any) => {
      const query = sb.from(table).update(patch);
      
      if (isCompanyScoped(table)) {
        console.log(`[DB] Adding company_id filter to ${table} update`);
        return query.eq("company_id", companyId);
      }
      
      return query;
    },
    
    upsert: (payload: any) => {
      const enrichedPayload = Array.isArray(payload)
        ? payload.map(r => enrichPayloadWithCompany(r, table, companyId, userId))
        : enrichPayloadWithCompany(payload, table, companyId, userId);
      
      console.log(`[DB] Upsert to ${table} with tenant context:`, { 
        records: Array.isArray(payload) ? payload.length : 1,
        companyId: isCompanyScoped(table) ? companyId : 'not required'
      });
      
      return sb.from(table).upsert(enrichedPayload);
    },
    
    delete: () => {
      const query = sb.from(table).delete();
      
      if (isCompanyScoped(table)) {
        console.log(`[DB] Adding company_id filter to ${table} delete`);
        return query.eq("company_id", companyId);
      }
      
      return query;
    }
  };
}

/**
 * Safe version that doesn't throw if tenant context missing
 * Falls back to regular Supabase client
 */
export function fromTenantSafe<T extends string>(sb: SupabaseClient, table: T) {
  const companyId = getCurrentCompanyId();
  
  if (!companyId || !TENANCY_ENFORCED) {
    console.warn(`[DB] No tenant context for ${table}, using standard query`);
    return sb.from(table);
  }
  
  return fromTenant(sb, table);
}

// Table metadata based on schema analysis from the audit
const COMPANY_SCOPED_TABLES = new Set([
  'people',
  'invites', 
  'employee_quarter_notes',
  'evaluation_assignments',
  'submissions',
  'attribute_scores',
  'attribute_responses',
  'analysis_jobs',
  'core_group_calculations',
  'core_group_breakdown',
  'quarterly_trends',
  'attribute_weights'
]);

// Tables that are global/not company-scoped
const GLOBAL_TABLES = new Set([
  'companies',
  'app_config'
]);

// View tables (may have company filtering in the view definition)
const VIEW_TABLES = new Set([
  'weighted_evaluation_scores',
  'quarter_final_scores',
  'core_group_scores',
  'core_group_scores_with_consensus',
  'core_group_summary',
  'quarter_core_group_trends',
  'assignment_details',
  'assignment_statistics'
]);

/**
 * Check if table requires company_id filtering
 */
function isCompanyScoped(table: string): boolean {
  return COMPANY_SCOPED_TABLES.has(table);
}

// Note: VIEW_TABLES is kept for future functionality when we need to handle views differently

/**
 * Enrich payload with company_id and other tenant context
 */
function enrichPayloadWithCompany(
  payload: any, 
  table: string, 
  companyId: string, 
  userId: string
) {
  if (isCompanyScoped(table)) {
    // Add company_id if not already present
    if (!payload.company_id) {
      payload = { company_id: companyId, ...payload };
    }
    
    // Add user tracking fields if table supports them
    if (tableHasField(table, 'created_by') && !payload.created_by) {
      payload.created_by = userId;
    }
    
    if (tableHasField(table, 'updated_by')) {
      payload.updated_by = userId;
    }
  }
  
  return payload;
}

/**
 * Check if table has specific field (basic implementation)
 * In production, this would query the schema or use generated types
 */
function tableHasField(table: string, field: string): boolean {
  const fieldsMap: Record<string, string[]> = {
    'employee_quarter_notes': ['created_by', 'updated_by'],
    'analysis_jobs': ['created_by'],
    'evaluation_assignments': ['assigned_by'],
    'attribute_weights': ['created_by', 'updated_by']
  };
  
  return fieldsMap[table]?.includes(field) || false;
}

/**
 * Validate company access for specific record
 * Useful for operations that take record IDs as parameters
 */
export async function validateRecordAccess(
  sb: SupabaseClient, 
  table: string, 
  recordId: string
): Promise<boolean> {
  if (!isCompanyScoped(table)) {
    return true; // Global tables don't need validation
  }
  
  const { companyId } = getCompanyContext();
  
  const { data, error } = await sb
    .from(table)
    .select('company_id')
    .eq('id', recordId)
    .single();
    
  if (error || !data) {
    console.warn(`[DB] Could not validate access to ${table}:${recordId}`, error);
    return false;
  }
  
  return data.company_id === companyId;
}

/**
 * Get count of records in table for current company
 * Useful for analytics and debugging
 */
export async function getCompanyRecordCount(
  sb: SupabaseClient, 
  table: string
): Promise<number> {
  if (!isCompanyScoped(table)) {
    // For global tables, return total count
    const { count, error } = await sb
      .from(table)
      .select('*', { count: 'exact', head: true });
    return error ? 0 : (count || 0);
  }
  
  const { companyId } = getCompanyContext();
  
  const { count, error } = await sb
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);
    
  return error ? 0 : (count || 0);
}

/**
 * Development helper to list all tables and their tenant status
 */
export function getTenantTableInfo(): Record<string, string> {
  const allTables = [
    ...Array.from(COMPANY_SCOPED_TABLES),
    ...Array.from(GLOBAL_TABLES),
    ...Array.from(VIEW_TABLES)
  ];
  
  const info: Record<string, string> = {};
  
  for (const table of allTables) {
    if (COMPANY_SCOPED_TABLES.has(table)) {
      info[table] = 'company-scoped';
    } else if (GLOBAL_TABLES.has(table)) {
      info[table] = 'global';
    } else if (VIEW_TABLES.has(table)) {
      info[table] = 'view (may have built-in filtering)';
    } else {
      info[table] = 'unknown';
    }
  }
  
  return info;
}
