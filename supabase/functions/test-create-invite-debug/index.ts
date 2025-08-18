/**
 * @category test
 * @doc-ignore
 * Debug Test for Create Invite Function
 * Purpose: Test environment variables and basic function execution
 * Date: February 1, 2025
 */

import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== DEBUG CREATE INVITE TEST ===')
    
    // 1) Check environment variables
    const envCheck = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') || 'NOT_SET',
      VITE_SUPABASE_URL: Deno.env.get('VITE_SUPABASE_URL') || 'NOT_SET',
      SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ? 'SET' : 'NOT_SET',
      VITE_SUPABASE_ANON_KEY: Deno.env.get('VITE_SUPABASE_ANON_KEY') ? 'SET' : 'NOT_SET',
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'NOT_SET',
      SITE_URL: Deno.env.get('SITE_URL') || 'NOT_SET',
      VITE_APP_URL: Deno.env.get('VITE_APP_URL') || 'NOT_SET',
      RESEND_API_KEY: Deno.env.get('RESEND_API_KEY') ? 'SET' : 'NOT_SET'
    }
    
    console.log('Environment Variables:', envCheck)
    
    // 2) Check authorization
    const authHeader = req.headers.get('Authorization')
    const hasAuth = !!authHeader
    
    console.log('Authorization:', { hasAuth, headerLength: authHeader?.length || 0 })
    
    // 3) Check request body
    let requestBody = null
    try {
      requestBody = await req.json()
      console.log('Request Body:', requestBody)
    } catch (e) {
      console.log('Request Body Parse Error:', e.message)
    }
    
    // 4) Return debug info
    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          environment: envCheck,
          authorization: { hasAuth, headerLength: authHeader?.length || 0 },
          requestBody: requestBody,
          timestamp: new Date().toISOString(),
          message: 'Debug test completed successfully'
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Debug test error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Debug test failed', 
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
