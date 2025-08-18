// Stable redirector for invite links
// Decouples email links from the frontend hostname
// Inline CORS headers so this file can be pasted into the Supabase dashboard directly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

Deno.serve((req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token) {
      return new Response('Missing token', { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } })
    }

    // Check for development mode via environment variable or default to production
    const isDevelopment = Deno.env.get('DEVELOPMENT_MODE') === 'true'
    const customSiteUrl = Deno.env.get('SITE_URL')
    
    let siteUrl
    if (customSiteUrl) {
      siteUrl = customSiteUrl
    } else if (isDevelopment) {
      siteUrl = 'http://localhost:5173'  // Default Vite dev server
    } else {
      siteUrl = 'https://a-player-evaluations.onrender.com'  // Production default
    }
    
    const target = `${siteUrl}/register-from-invite?token=${encodeURIComponent(token)}`
    
    console.log(`Redirecting to: ${target} (isDevelopment: ${isDevelopment})`)

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: target,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return new Response(`Redirect error: ${e.message}` as unknown as BodyInit, { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } })
  }
})


