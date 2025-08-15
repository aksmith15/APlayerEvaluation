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

    // Parse token
    let token: string
    if (req.method === 'GET') {
      const url = new URL(req.url)
      token = url.searchParams.get('token') || ''
    } else {
      const body = await req.json()
      token = body.token
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing invite token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

    // Create user client
    console.log('Creating user client...')
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    console.log('Getting user...')
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    
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

    // Validate invite token
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

    // Check existing membership
    const { data: existingMembership } = await admin
      .from('company_memberships')
      .select('role')
      .eq('company_id', invite.company_id)
      .eq('profile_id', user.id)
      .maybeSingle()

    if (existingMembership) {
      // Mark invite as claimed
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

    // Create company membership
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

    // Update user's default company if needed
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

    // Mark invite as claimed
    await admin
      .from('invites')
      .update({ claimed_at: now.toISOString() })
      .eq('id', invite.id)

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
