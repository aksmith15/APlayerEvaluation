// Debug utility to investigate tenant context issues
import { supabase } from '../services/supabase';

export async function debugTenantContext() {
  console.group('[DEBUG] Tenant Context Investigation');
  
  try {
    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('1. Auth Status:', { 
      authenticated: !!user, 
      email: user?.email,
      error: authError?.message 
    });
    
    if (!user) {
      console.error('❌ Not authenticated - cannot proceed with tenant debug');
      return;
    }
    
    // 2. Check people table access
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, email, company_id, jwt_role, active')
      .eq('email', user.email);
      
    console.log('2. People Table Access:', {
      found: people?.length || 0,
      data: people,
      error: peopleError?.message
    });
    
    // 3. Check companies table access
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5);
      
    console.log('3. Companies Table Access:', {
      found: companies?.length || 0,
      data: companies,
      error: companiesError?.message
    });
    
    // 4. Test RLS policies
    const { error: rlsError } = await supabase
      .from('people')
      .select('count')
      .limit(1);
      
    console.log('4. RLS Policy Test:', {
      accessible: !rlsError,
      error: rlsError?.message,
      errorCode: rlsError?.code
    });
    
    // 5. Check environment
    console.log('5. Environment:', {
      tenancyEnforced: import.meta.env.VITE_TENANCY_ENFORCED,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
      mode: import.meta.env.MODE
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  
  console.groupEnd();
}

// Export for console access
(window as any).debugTenant = debugTenantContext;
