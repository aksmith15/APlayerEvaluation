// Accept Invite Edge Function V2 - with env var validation
// Purpose: Allow users to accept invitations and join companies  
// Date: February 1, 2025

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

Deno.serve(async (req) => {
  console.log('accept-invite-v2 request:', req.method, req.url)
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight')
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Check environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!anonKey,
      hasServiceKey: !!serviceKey
    })
    
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing environment variables',
          debug: {
            hasSupabaseUrl: !!supabaseUrl,
            hasAnonKey: !!anonKey,
            hasServiceKey: !!serviceKey
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse invite token
    let inviteToken: string
    if (req.method === 'GET') {
      const url = new URL(req.url)
      inviteToken = url.searchParams.get('token') || ''
    } else {
      const body = await req.json()
      inviteToken = body.token
    }

    // Handle action_link flow where token may not be provided but metadata exists
    let isActionLinkFlow = false
    if (!inviteToken || inviteToken === 'action-link-metadata') {
      console.log('Detected action_link flow, will extract metadata from user session')
      isActionLinkFlow = true
    }

    // Check auth header
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header check:', { hasAuth: !!authHeader })
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'No Authorization header provided',
          debug: 'Missing auth header'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract JWT token from Authorization header
    console.log('Extracting JWT token...')
    const jwtToken = authHeader.replace('Bearer ', '')
    
    // Create user client and set session manually
    console.log('Creating user client...')
    const userClient = createClient(supabaseUrl, anonKey)
    
    console.log('Getting user with JWT...')
    const { data: { user }, error: userError } = await userClient.auth.getUser(jwtToken)
    
    console.log('Auth result:', { 
      hasUser: !!user, 
      userEmail: user?.email,
      errorMessage: userError?.message 
    })
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          debug: {
            userError: userError?.message,
            hasAuthHeader: !!authHeader
          }
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
    const admin = createClient(supabaseUrl, serviceKey)

    let invite: any = null
    let inviteError: any = null

    if (isActionLinkFlow) {
      // For action_link flow, construct invite data from user metadata
      console.log('Using action_link flow - constructing invite from user metadata')
      const metadata = user.user_metadata
      
      if (!metadata?.company_id || !metadata?.role_to_assign) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid action link - missing required metadata',
            debug: 'Missing company_id or role_to_assign in user metadata'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Look up company name
      const { data: company } = await admin
        .from('companies')
        .select('name')
        .eq('id', metadata.company_id)
        .single()

      invite = {
        id: 'action-link',
        company_id: metadata.company_id,
        email: user.email,
        role_to_assign: metadata.role_to_assign,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        claimed_at: null,
        revoked_at: null,
        companies: {
          name: company?.name || 'Unknown Company'
        }
      }
      console.log('Constructed invite from metadata:', invite)
    } else {
      // Traditional token-based flow
      console.log('Using token-based flow - looking up invite by token')
      const result = await admin
        .from('invites')
        .select(`
          id,
          company_id,
          email,
          role_to_assign,
          expires_at,
          claimed_at,
          revoked_at,
          companies!inner(name)
        `)
        .eq('token', inviteToken)
        .maybeSingle()
      
      invite = result.data
      inviteError = result.error
    }

    if (inviteError) {
      console.error('Invite lookup error:', inviteError)
      return new Response(
        JSON.stringify({ error: 'Failed to validate invite token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!invite) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate invite status
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)

    if (invite.claimed_at) {
      return new Response(
        JSON.stringify({ error: 'This invite has already been used' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (invite.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'This invite has been revoked' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'This invite has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify email matches
    const userEmail = user.email?.toLowerCase().trim()
    const inviteEmail = invite.email.toLowerCase().trim()
    const isDevelopment = Deno.env.get('DEVELOPMENT_MODE') === 'true'

    console.log('🔍 Email verification:', {
      userEmail,
      inviteEmail,
      matches: userEmail === inviteEmail,
      isDevelopment
    })

    if (userEmail !== inviteEmail && !isDevelopment) {
      return new Response(
        JSON.stringify({ 
          error: 'Email mismatch - this invite is for a different email address',
          expected_email: invite.email,
          user_email: user.email
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (isDevelopment && userEmail !== inviteEmail) {
      console.log('⚠️ DEVELOPMENT MODE: Bypassing email verification check')
    }

    // Idempotent transaction: ensure or create all required records
    console.log('Starting idempotent invite acceptance transaction...')
    
    try {
      // Use a single transaction-like approach with upserts
      console.log('Step 1: Ensure user profile exists...')
      const { error: profileUpsertError } = await admin
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          default_company_id: invite.company_id,
          is_active: true
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (profileUpsertError) {
        console.error('Profile upsert error:', profileUpsertError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to ensure user profile',
            details: profileUpsertError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('✅ Profile ensured')

      console.log('Step 2: Ensure people record exists...')
      
      // First check if people record already exists
      const { data: existingPerson } = await admin
        .from('people')
        .select('id, email, jwt_role, active')
        .eq('email', user.email)
        .eq('company_id', invite.company_id)
        .maybeSingle()

      if (existingPerson) {
        console.log('✅ People record already exists:', existingPerson.email)
      } else {
        console.log('Creating new people record for invited user...')
        
        // Get jwt_role from invite metadata or default based on role
        const jwtRole = invite.jwt_role || (invite.role_to_assign === 'admin' ? 'hr_admin' : null)
        
        // Use clean display name - email is the unique identifier
        const userName = user.user_metadata?.full_name || user.email.split('@')[0]
        
        const { data: newPerson, error: personCreateError } = await admin
          .from('people')
          .insert({
            name: userName,
            email: user.email, // Email is the unique identifier
            role: invite.role_to_assign,
            jwt_role: jwtRole,
            active: true,
            company_id: invite.company_id,
            department: 'General',
            hire_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single()

        if (personCreateError) {
          console.error('CRITICAL: Failed to create people record:', personCreateError)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create employee record - this is required for login',
              details: personCreateError.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.log('✅ People record created:', newPerson)
      }

      console.log('Step 3: Check existing company membership...')
      const { data: existingMembership } = await admin
        .from('company_memberships')
        .select('role, joined_at')
        .eq('company_id', invite.company_id)
        .eq('profile_id', user.id)
        .maybeSingle()

      if (existingMembership) {
        console.log('User already has membership, marking invite as claimed')
        
        // Mark invite as claimed (idempotent)
        await admin
          .from('invites')
          .update({ claimed_at: now.toISOString() })
          .eq('id', invite.id)

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'You already have access to this company',
            company_name: invite.companies.name,
            existing_role: existingMembership.role,
            redirect_to: '/dashboard'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Step 4: Create company membership...')
      const { error: membershipError } = await admin
        .from('company_memberships')
        .upsert({
          company_id: invite.company_id,
          profile_id: user.id,
          role: invite.role_to_assign,
          joined_at: now.toISOString()
        }, {
          onConflict: 'company_id,profile_id',
          ignoreDuplicates: false
        })

      if (membershipError) {
        console.error('Company membership creation error:', membershipError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create company membership',
            details: membershipError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('✅ Company membership created')

      console.log('Step 5: Update default company if needed...')
      const { error: defaultCompanyError } = await admin
        .from('profiles')
        .update({ default_company_id: invite.company_id })
        .eq('id', user.id)
        .is('default_company_id', null)

      if (defaultCompanyError) {
        console.error('Failed to update default company (non-critical):', defaultCompanyError)
        // Don't fail the whole operation for this
      } else {
        console.log('✅ Default company updated')
      }

      console.log('Step 6: Mark invite as claimed...')
      // Mark invite as claimed (idempotent) - skip for action_link flow
      if (!isActionLinkFlow && invite.id !== 'action-link') {
        const { error: claimError } = await admin
          .from('invites')
          .update({ claimed_at: now.toISOString() })
          .eq('id', invite.id)
          .is('claimed_at', null)

        if (claimError) {
          console.error('Failed to mark invite as claimed (non-critical):', claimError)
          // Don't fail for this
        } else {
          console.log('✅ Invite marked as claimed')
        }
      } else {
        console.log('✅ Skipped invite claiming for action_link flow')
      }

    } catch (transactionError) {
      console.error('Transaction error:', transactionError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to complete invite acceptance',
          details: transactionError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: `Welcome to ${invite.companies.name}!`,
        company_name: invite.companies.name,
        company_id: invite.company_id,
        assigned_role: invite.role_to_assign,
        redirect_to: '/dashboard'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Accept invite v2 error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
