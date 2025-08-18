/**
 * @category test  
 * @doc-ignore
 * Minimal accept-invite function for debugging
 * No shared imports, completely self-contained
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

Deno.serve(async (req) => {
  console.log('MINIMAL accept-invite request:', req.method, req.url)
  
  if (req.method === 'OPTIONS') {
    console.log('MINIMAL handling OPTIONS preflight')
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    console.log('MINIMAL auth header check:', { hasAuth: !!authHeader })
    
    if (!authHeader) {
      console.log('MINIMAL: No auth header found')
      return new Response(
        JSON.stringify({ 
          error: 'No Authorization header provided',
          debug: 'minimal test - no auth header'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the token from the request
    let token: string
    if (req.method === 'GET') {
      const url = new URL(req.url)
      token = url.searchParams.get('token') || ''
    } else {
      const body = await req.json()
      token = body.token
    }

    console.log('MINIMAL token received:', { hasToken: !!token })

    if (!token) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing invite token',
          debug: 'minimal test - no token'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return success for now (we're just testing the auth header passing)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Minimal test passed',
        debug: {
          hasAuthHeader: !!authHeader,
          hasToken: !!token,
          authHeaderPrefix: authHeader.substring(0, 20) + '...'
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('MINIMAL accept-invite error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        debug: 'minimal test - catch block'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
