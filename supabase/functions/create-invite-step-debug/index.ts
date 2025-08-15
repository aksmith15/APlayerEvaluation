// Step-by-Step Debug for Create Invite Function
// Purpose: Find exactly where the create-invite function is failing
// Date: February 1, 2025

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const steps = [];
    
    // Step 1: Parse request
    steps.push({ step: 1, status: 'starting', message: 'Parsing request body' });
    const requestBody = await req.json();
    steps.push({ step: 1, status: 'success', data: requestBody });

    const { company_id, email, role_to_assign } = requestBody;

    // Step 2: Validate input
    steps.push({ step: 2, status: 'starting', message: 'Validating input' });
    if (!company_id || !email || !role_to_assign) {
      steps.push({ step: 2, status: 'error', message: 'Missing required fields' });
      return new Response(JSON.stringify({ error: 'Missing fields', steps }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 2, status: 'success', data: { company_id, email, role_to_assign } });

    // Step 3: Check authorization
    steps.push({ step: 3, status: 'starting', message: 'Checking authorization' });
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      steps.push({ step: 3, status: 'error', message: 'Missing auth header' });
      return new Response(JSON.stringify({ error: 'No auth', steps }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 3, status: 'success', data: { hasAuth: true, headerLength: authHeader.length } });

    // Step 4: Check environment variables
    steps.push({ step: 4, status: 'starting', message: 'Checking environment variables' });
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const siteUrl = Deno.env.get('SITE_URL');
    
    if (!supabaseUrl || !anonKey || !serviceKey) {
      steps.push({ step: 4, status: 'error', message: 'Missing env vars', data: { supabaseUrl: !!supabaseUrl, anonKey: !!anonKey, serviceKey: !!serviceKey } });
      return new Response(JSON.stringify({ error: 'Missing env vars', steps }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 4, status: 'success', data: { supabaseUrl, hasAnonKey: !!anonKey, hasServiceKey: !!serviceKey, siteUrl } });

    // Step 5: Create admin client
    steps.push({ step: 5, status: 'starting', message: 'Creating admin client' });
    const admin = createClient(supabaseUrl, serviceKey);
    steps.push({ step: 5, status: 'success' });

    // Step 6: Verify JWT token
    steps.push({ step: 6, status: 'starting', message: 'Verifying JWT token' });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    
    if (userError || !user) {
      steps.push({ step: 6, status: 'error', message: 'JWT verification failed', error: userError?.message });
      return new Response(JSON.stringify({ error: 'JWT failed', steps }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 6, status: 'success', data: { userEmail: user.email, userId: user.id } });

    // Step 7: Look up user in people table
    steps.push({ step: 7, status: 'starting', message: 'Looking up user in people table' });
    const { data: userData, error: userDataError } = await admin
      .from('people')
      .select('id, jwt_role, active, company_id')
      .eq('email', user.email)
      .single();

    if (userDataError || !userData) {
      steps.push({ step: 7, status: 'error', message: 'People table lookup failed', error: userDataError?.message });
      return new Response(JSON.stringify({ error: 'People lookup failed', steps }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 7, status: 'success', data: userData });

    // Step 8: Check user permissions
    steps.push({ step: 8, status: 'starting', message: 'Checking user permissions' });
    if (!userData.active || !['super_admin', 'hr_admin'].includes(userData.jwt_role)) {
      steps.push({ step: 8, status: 'error', message: 'Insufficient permissions', data: { role: userData.jwt_role, active: userData.active } });
      return new Response(JSON.stringify({ error: 'Insufficient permissions', steps }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 8, status: 'success', data: { role: userData.jwt_role, company: userData.company_id } });

    // Step 9: Check company match
    steps.push({ step: 9, status: 'starting', message: 'Checking company match' });
    if (userData.company_id !== company_id) {
      steps.push({ step: 9, status: 'error', message: 'Company mismatch', data: { userCompany: userData.company_id, requestedCompany: company_id } });
      return new Response(JSON.stringify({ error: 'Company mismatch', steps }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 9, status: 'success' });

    // Step 10: Check for existing invites
    steps.push({ step: 10, status: 'starting', message: 'Checking for existing invites' });
    const { data: existingInvite, error: existingError } = await admin
      .from('invites')
      .select('id')
      .eq('company_id', company_id)
      .eq('email', email.toLowerCase().trim())
      .is('claimed_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      steps.push({ step: 10, status: 'error', message: 'Database error checking existing invites', error: existingError.message });
      return new Response(JSON.stringify({ error: 'DB error', steps }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (existingInvite) {
      steps.push({ step: 10, status: 'error', message: 'Email already has pending invite' });
      return new Response(JSON.stringify({ error: 'Invite exists', steps }), { 
        status: 409, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 10, status: 'success', message: 'No existing invites found' });

    // Step 11: Generate invite token
    steps.push({ step: 11, status: 'starting', message: 'Generating invite token' });
    const inviteToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const redirectTo = `${siteUrl || 'https://a-player-dashboard.onrender.com'}/accept-invite?token=${inviteToken}`;
    steps.push({ step: 11, status: 'success', data: { tokenLength: inviteToken.length, redirectTo } });

    // Step 12: Send Supabase invite email
    steps.push({ step: 12, status: 'starting', message: 'Sending Supabase invite email' });
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: redirectTo,
        data: {
          company_id,
          role_to_assign,
          invite_token: inviteToken
        }
      }
    );

    if (inviteError) {
      steps.push({ step: 12, status: 'error', message: 'Supabase invite email failed', error: inviteError.message });
      return new Response(JSON.stringify({ error: 'Email failed', steps }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 12, status: 'success', data: { userEmail: inviteData?.user?.email, userId: inviteData?.user?.id } });

    // Step 13: Store invite in database
    steps.push({ step: 13, status: 'starting', message: 'Storing invite in database' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const { data: dbInviteData, error: dbInviteError } = await admin
      .from('invites')
      .insert({
        company_id,
        email: email.toLowerCase().trim(),
        role_to_assign,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
        created_by: userData.id
      })
      .select()
      .single();

    if (dbInviteError) {
      steps.push({ step: 13, status: 'error', message: 'Database insert failed', error: dbInviteError.message });
      return new Response(JSON.stringify({ error: 'DB insert failed', steps }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    steps.push({ step: 13, status: 'success', data: { inviteId: dbInviteData.id } });

    // Success!
    return new Response(
      JSON.stringify({
        success: true,
        message: 'All steps completed successfully',
        steps,
        result: {
          invite_id: dbInviteData.id,
          email: dbInviteData.email,
          expires_at: dbInviteData.expires_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Function crashed', 
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
