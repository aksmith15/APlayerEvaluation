// Create Invite Edge Function
// Purpose: Allow company admins to generate secure invite links
// Uses: auth.admin.generateLink + people.jwt_role for authorization
// Date: February 1, 2025

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface InviteRequest {
  company_id: string
  email: string
  role_to_assign: 'admin' | 'member' | 'viewer'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1) Parse request body
    const { company_id, email, role_to_assign }: InviteRequest = await req.json()
    
    // Validate input
    if (!company_id || !email || !role_to_assign) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: company_id, email, role_to_assign' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2) Create user-context client (validates permissions via RLS)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get environment variables with fallbacks for debugging
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !anonKey) {
      console.error('Missing Supabase configuration:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!anonKey,
        envKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes('SUPABASE'))
      })
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error - missing Supabase credentials',
          debug: { hasUrl: !!supabaseUrl, hasKey: !!anonKey }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    })

    // Extract JWT token and decode it to get user info
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Invalid Authorization header format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client for privileged operations
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!serviceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error - missing service role key'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const admin = createClient(supabaseUrl, serviceKey)

    // Verify JWT token and get user info using admin client
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized - invalid or missing auth token',
          details: userError?.message || 'No user found'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Authenticated user:', user.email)

    // 3) Verify user is admin and get their company
    // Check user's role and company from people table using admin client
    console.log('Looking up user in people table with email:', user.email)
    const { data: userData, error: userDataError } = await admin
      .from('people')
      .select('id, jwt_role, active, company_id')
      .eq('email', user.email)
      .single()

    console.log('People table lookup result:', { userData, userDataError })

    if (userDataError || !userData) {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden - user not found in people table',
          details: userDataError?.message || 'No user data found',
          email_searched: user.email
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    console.log('User data found:', { 
      jwt_role: userData.jwt_role, 
      active: userData.active, 
      company_id: userData.company_id 
    })
    
    if (!userData.active || !['super_admin', 'hr_admin'].includes(userData.jwt_role)) {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden - insufficient permissions. Requires super_admin or hr_admin role.',
          user_role: userData.jwt_role,
          user_active: userData.active
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is trying to create invite for their own company
    if (userData.company_id !== company_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - can only create invites for your own company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4) Check if email is already invited to this company (non-expired, non-claimed, non-revoked)
    const { data: existingInvite } = await admin
      .from('invites')
      .select('id')
      .eq('company_id', company_id)
      .eq('email', email.toLowerCase().trim())
      .is('claimed_at', null)  // Not claimed yet
      .is('revoked_at', null)  // Not revoked
      .gt('expires_at', new Date().toISOString())  // Not expired
      .single()

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: 'Email already has a pending invite to this company' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate secure token for our invite system
    const inviteToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    
    // Create redirect URL that includes our custom token
    // Force production URL for invites to ensure proper redirects
    const siteUrl = 'https://a-player-dashboard.onrender.com'
    const redirectTo = `${siteUrl}/accept-invite?token=${inviteToken}`
    
    console.log('Using site URL for redirect:', siteUrl)

    // Send Supabase invite email using custom SMTP configuration
    console.log('Sending invite email with custom SMTP to:', email.toLowerCase().trim());
    console.log('Redirect URL:', redirectTo);
    
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
    )
    
    console.log('Invite email result:', { inviteData, inviteError });

    if (inviteError) {
      console.error('Supabase inviteUserByEmail error:', inviteError)
      return new Response(
        JSON.stringify({ error: 'Failed to send invite email', details: inviteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Invite email sent successfully:', { 
      userEmail: inviteData?.user?.email,
      userId: inviteData?.user?.id,
      inviteToken: inviteToken
    })

    // 6) Store invite record in our database using people.id (we already have userData)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    
    console.log('Creating invite with people.id:', userData.id, 'for company:', company_id)
    
    // We already looked up the user in the people table above (userData), so we can use that ID
    const { data: dbInviteData, error: dbInviteError } = await admin
      .from('invites')
      .insert({
        company_id,
        email: email.toLowerCase().trim(),
        role_to_assign,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
        created_by: userData.id  // Use people.id (from userData lookup above)
      })
      .select()
      .single()

    if (dbInviteError) {
      console.error('Database invite insert error:', dbInviteError)
      return new Response(
        JSON.stringify({ error: 'Failed to create invite record', details: dbInviteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7) Return success response
    return new Response(
      JSON.stringify({
        success: true,
        invite_id: dbInviteData.id,
        email: dbInviteData.email,
        expires_at: dbInviteData.expires_at,
        user_id: inviteData?.user?.id,
        message: 'Invite created successfully. Email sent to user.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Create invite function error:', error)
    
    // More detailed error information for debugging
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      environment: {
        hasSupabaseUrl: !!(Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL')),
        hasAnonKey: !!(Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY')),
        hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        hasSiteUrl: !!(Deno.env.get('SITE_URL') || Deno.env.get('VITE_APP_URL'))
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        debug: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
