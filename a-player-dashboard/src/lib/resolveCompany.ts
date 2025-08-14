// Company Context Resolution
// Handles the complex logic for determining which company a user belongs to

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyContext } from "./tenantContext";
import { setCompanyContext } from "./tenantContext";

/**
 * Resolve company context for authenticated user
 * This function encapsulates the complex logic for determining
 * which company a user belongs to and their role within it
 */
export async function resolveCompanyContext(supabase: SupabaseClient): Promise<CompanyContext> {
  // 1) Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error(`Authentication required: ${authError?.message || 'No user session'}`);
  }

  // 2) Look up user profile in people table (matches existing app pattern)
  const { data: person, error: personError } = await supabase
    .from("people")
    .select("id, company_id, email, jwt_role")
    .eq("email", user.email)
    .eq("active", true)
    .single();

  if (personError) {
    if (personError.code === 'PGRST116') {
      throw new Error(`User profile not found for email: ${user.email}. User may not be activated.`);
    }
    throw new Error(`Failed to fetch user profile: ${personError.message}`);
  }

  if (!person) {
    throw new Error(`No active user profile found for: ${user.email}`);
  }

  // 3) Handle missing company_id (auto-assignment logic from existing code)
  let companyId = person.company_id;
  
  if (!companyId) {
    console.warn('[TenantContext] User missing company_id, attempting auto-assignment...');
    
    // Get first available company (matches existing fallback logic in dataFetching.ts)
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name")
      .order("created_at", { ascending: true })
      .limit(1);

    if (companiesError || !companies?.length) {
      throw new Error(`No companies available for assignment: ${companiesError?.message || 'Empty companies table'}`);
    }

    companyId = companies[0].id;
    
    // Update person record (matches existing pattern in dataFetching.ts:717)
    const { error: updateError } = await supabase
      .from("people")
      .update({ company_id: companyId })
      .eq("email", user.email);

    if (updateError) {
      console.warn('[TenantContext] Could not update company_id:', updateError);
      // Continue anyway - RLS might still work
    } else {
      console.log(`[TenantContext] Auto-assigned company: ${companies[0].name} (${companyId})`);
    }

    // Also ensure company membership exists (matches existing pattern in dataFetching.ts:731)
    try {
      const { error: membershipError } = await supabase
        .from("company_memberships")
        .upsert({
          person_id: person.id, // Note: existing code uses person_id, not profile_id
          company_id: companyId,
          role: 'member'
        }, {
          onConflict: 'person_id,company_id'
        });

      if (membershipError) {
        console.warn('[TenantContext] Could not create company membership:', membershipError.message);
        // This is not critical for basic functionality
      }
    } catch (membershipErr) {
      console.warn('[TenantContext] Company membership update failed:', membershipErr);
      // Continue - company_memberships table might not be fully implemented
    }
  }

  if (!companyId) {
    throw new Error("Unable to determine company context for user. Please contact administrator.");
  }

  return { 
    companyId, 
    role: person.jwt_role,
    userId: user.id,
    userEmail: user.email
  };
}

/**
 * Refresh company context (useful when user's company/role changes)
 */
export async function refreshCompanyContext(supabase: SupabaseClient): Promise<CompanyContext> {
  console.log('[TenantContext] Refreshing company context...');
  return resolveCompanyContext(supabase);
}

/**
 * Validate that user has access to specific company
 * Useful for validating URL parameters or cross-company operations
 */
export async function validateCompanyAccess(
  supabase: SupabaseClient, 
  targetCompanyId: string
): Promise<boolean> {
  const context = await resolveCompanyContext(supabase);
  
  // For now, users can only access their own company
  // Future enhancement: support multiple company memberships
  return context.companyId === targetCompanyId;
}

/**
 * Get all companies user has access to
 * Returns single company for regular users, all companies for super_admin
 */
export async function getUserCompanies(supabase: SupabaseClient): Promise<Array<{id: string, name: string, role?: string}>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get user's company and role from people table
  const { data: person } = await supabase
    .from("people")
    .select("company_id, jwt_role")
    .eq("email", user.email)
    .eq("active", true)
    .single();

  if (!person) return [];

  // If super_admin, return all companies
  if (person.jwt_role === 'super_admin') {
    const { data: allCompanies } = await supabase
      .from("companies")
      .select("id, name")
      .is("deleted_at", null)
      .order("name");

    return allCompanies?.map(company => ({
      id: company.id,
      name: company.name,
      role: 'super_admin'
    })) || [];
  }

  // For regular users, return their company only
  if (!person.company_id) return [];

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", person.company_id)
    .single();

  if (!company) return [];

  return [{ 
    id: company.id, 
    name: company.name,
    role: person.jwt_role || 'member'
  }];
}

/**
 * Switch company context for super_admin users
 * Uses the existing switch_company database function
 */
export async function switchCompanyContext(
  supabase: SupabaseClient, 
  targetCompanyId: string
): Promise<{success: boolean, message: string, company?: any}> {
  try {
    // Call the database function to switch company context
    const { data, error } = await supabase.rpc('switch_company', {
      target_company_id: targetCompanyId
    });

    if (error) {
      console.error('Error switching company context:', error);
      return { success: false, message: error.message };
    }

    // If successful, refresh the company context
    if (data?.success) {
      const newContext = await resolveCompanyContext(supabase);
      setCompanyContext(newContext);
      return {
        success: true,
        message: 'Company context switched successfully',
        company: data.company
      };
    }

    return { success: false, message: data?.message || 'Unknown error' };
  } catch (error) {
    console.error('Error in switchCompanyContext:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
