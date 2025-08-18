// Get Invite Data Edge Function
// Purpose: Securely fetch invite data by token for unauthenticated users
// Date: February 1, 2025

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface InviteDataResponse {
  id: string;
  token: string;
  email: string;
  company_id: string;
  role_to_assign: string;
  position?: string;
  jwt_role?: string;
  inviter_name?: string;
  companies: {
    name: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Use service role to bypass RLS for this specific lookup
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: invite, error } = await supabase
      .from('invites')
      .select(`
        id,
        token,
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
      .eq('token', token)
      .single()

    if (error) {
      console.error('Invite lookup error:', error)
      return new Response(
        JSON.stringify({ error: 'Invite not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!invite) {
      return new Response(
        JSON.stringify({ error: 'Invite not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate invite status
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)

    if (invite.claimed_at) {
      return new Response(
        JSON.stringify({ error: 'Invite already claimed' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (invite.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'Invite has been revoked' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: 'Invite has expired' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Valid invite found for:', invite.email)

    return new Response(
      JSON.stringify(invite),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Get invite data error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
