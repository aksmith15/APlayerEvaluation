// Accept Invite Edge Function
// Purpose: Allow users to accept invitations and join companies
// Uses: Token validation + automatic company membership creation
// Date: February 1, 2025

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
// Inline CORS headers so this function can be pasted in the dashboard without shared imports
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface AcceptInviteRequest {
  token: string
}

Deno.serve(async (req) => {
  console.log('accept-invite request:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight')
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // 1) Parse request - can come from query params or body
    let token: string
    
    if (req.method === 'GET') {
      const url = new URL(req.url)
      token = url.searchParams.get('token') || ''
    } else {
      const body: AcceptInviteRequest = await req.json()
      token = body.token
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing invite token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2) Create user-context client to get current user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    console.log('Auth check result:', { user: !!user, userError, authHeader: !!req.headers.get('Authorization') })
    
    if (userError || !user) {
      console.error('Auth failed:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized - user must be logged in to accept invite',
          redirect_to_login: true,
          debug: { userError: userError?.message, hasAuthHeader: !!req.headers.get('Authorization') }
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3) Create admin client for privileged operations
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 4) Validate invite token (using public policy for token access)
    const { data: invite, error: inviteError } = await admin
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
      .eq('token', token)
      .maybeSingle()

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

    // 5) Validate invite status
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

    // 6) Verify email matches (security check)
    const userEmail = user.email?.toLowerCase().trim()
    const inviteEmail = invite.email.toLowerCase().trim()

    if (userEmail !== inviteEmail) {
      return new Response(
        JSON.stringify({ 
          error: 'Email mismatch - this invite is for a different email address',
          expected_email: invite.email,
          user_email: user.email
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7) Check if user already has membership in this company
    const { data: existingMembership } = await admin
      .from('company_memberships')
      .select('role')
      .eq('company_id', invite.company_id)
      .eq('profile_id', user.id)
      .maybeSingle()

    if (existingMembership) {
      // Mark invite as claimed even though user already has access
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

    // 8) Create company membership (the main operation)
    const { data: membershipData, error: membershipError } = await admin
      .from('company_memberships')
      .insert({
        company_id: invite.company_id,
        profile_id: user.id,
        role: invite.role_to_assign,
        joined_at: now.toISOString()
      })
      .select()
      .single()

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

    // 9) Update user's default company if they don't have one
    const { data: profileData } = await admin
      .from('profiles')
      .select('default_company_id')
      .eq('id', user.id)
      .single()

    if (!profileData?.default_company_id) {
      await admin
        .from('profiles')
        .update({ default_company_id: invite.company_id })
        .eq('id', user.id)
    }

    // 10) Mark invite as claimed
    const { error: claimError } = await admin
      .from('invites')
      .update({ claimed_at: now.toISOString() })
      .eq('id', invite.id)

    if (claimError) {
      console.error('Failed to mark invite as claimed:', claimError)
      // Non-critical error, don't fail the whole operation
    }

    // 11) Return success response
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
    console.error('Accept invite function error:', error)
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
