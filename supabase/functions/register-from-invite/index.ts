// Register From Invite Edge Function
// Purpose: Handle complete user registration during invite acceptance
// Uses: Service role for privileged operations, secure backend registration
// Date: February 1, 2025

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface RegistrationRequest {
  inviteToken: string
  fullName: string
  password: string
  profilePictureUrl?: string
}

Deno.serve(async (req) => {
  console.log('register-from-invite request:', req.method, req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight')
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Parse request body
    const { inviteToken, fullName, password, profilePictureUrl }: RegistrationRequest = await req.json()
    
    if (!inviteToken || !fullName || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: inviteToken, fullName, password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client for privileged operations
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Step 1: Validate invite token
    console.log('Step 1: Validating invite token...')
    const { data: invite, error: inviteError } = await admin
      .from('invites')
      .select(`
        id,
        email,
        company_id,
        role_to_assign,
        position,
        jwt_role,
        inviter_name,
        expires_at,
        claimed_at,
        revoked_at,
        companies!inner(name)
      `)
      .eq('token', inviteToken)
      .single()

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired invitation token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate invite status
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)

    if (invite.claimed_at) {
      return new Response(
        JSON.stringify({ error: 'This invitation has already been used' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (invite.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'This invitation has been revoked' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'This invitation has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Invite validated for:', invite.email)

    // Step 2: Create auth user
    console.log('Step 2: Creating auth user...')
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: invite.email,
      password: password,
      user_metadata: {
        full_name: fullName,
        invited_via: 'company_invite',
        company_id: invite.company_id
      },
      email_confirm: true // Auto-confirm email for invited users
    })

    if (authError || !authData.user) {
      console.error('Auth user creation failed:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to create account: ${authError?.message || 'Unknown error'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Step 3: Create profile record
    console.log('Step 3: Creating profile record...')
    const { data: profileData, error: profileError } = await admin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: invite.email,
        full_name: fullName,
        avatar_url: profilePictureUrl || null,
        default_company_id: invite.company_id,
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      console.error('Profile creation payload:', {
        id: authData.user.id,
        email: invite.email,
        full_name: fullName,
        avatar_url: profilePictureUrl || null,
        default_company_id: invite.company_id,
        is_active: true
      })
      // Clean up auth user
      await admin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user profile: ${profileError.message}`,
          details: profileError
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Profile created:', profileData.id)

    // Step 4: Create people table record
    console.log('Step 4: Creating people record...')
    const { data: peopleData, error: peopleError } = await admin
      .from('people')
      .insert({
        name: fullName,
        email: invite.email,
        role: invite.position || invite.role_to_assign,
        active: true,
        company_id: invite.company_id,
        department: 'General', // Default department
        hire_date: new Date().toISOString().split('T')[0], // Today as hire date
        jwt_role: invite.jwt_role || null,
        profile_picture_url: profilePictureUrl || null
      })
      .select()
      .single()

    if (peopleError) {
      console.error('People record creation failed:', peopleError)
      // Non-critical, user can still function
      console.warn('User can still function without people record')
    } else {
      console.log('✅ People record created:', peopleData.id)
    }

    // Step 5: Create company membership
    console.log('Step 5: Creating company membership...')
    const { data: membershipData, error: membershipError } = await admin
      .from('company_memberships')
      .insert({
        company_id: invite.company_id,
        profile_id: authData.user.id,
        role: invite.role_to_assign,
        joined_at: now.toISOString()
      })
      .select()
      .single()

    if (membershipError) {
      console.error('Company membership creation failed:', membershipError)
      console.error('Company membership payload:', {
        company_id: invite.company_id,
        profile_id: authData.user.id,
        role: invite.role_to_assign,
        joined_at: now.toISOString()
      })
      return new Response(
        JSON.stringify({ 
          error: `Failed to create company membership: ${membershipError.message}`,
          details: membershipError
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Company membership created:', membershipData)

    // Step 6: Mark invite as claimed
    console.log('Step 6: Marking invite as claimed...')
    const { error: claimError } = await admin
      .from('invites')
      .update({
        claimed_at: now.toISOString()
      })
      .eq('id', invite.id)

    if (claimError) {
      console.error('Failed to mark invite as claimed:', claimError)
      // Non-critical error, don't fail the whole registration
    } else {
      console.log('✅ Invite marked as claimed')
    }

    console.log('🎉 User registration completed successfully!')

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Welcome to ${invite.companies.name}!`,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName
        },
        company: {
          id: invite.company_id,
          name: invite.companies.name
        },
        redirect_to: '/dashboard'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Register from invite function error:', error)
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
