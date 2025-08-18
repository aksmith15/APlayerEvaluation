/**
 * @category test
 * @doc-ignore
 * Minimal test function to debug CORS headers and preflight requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

Deno.serve((req) => {
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight')
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  return new Response(JSON.stringify({ 
    message: 'Test function works',
    method: req.method 
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
