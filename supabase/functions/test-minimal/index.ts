// Ultra-simple test to isolate invocation issues - using Deno.serve directly

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(async (req) => {
  console.log('🚀 Test minimal function called');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📨 Method:', req.method);
    
    if (req.method !== 'POST') {
      console.log('❌ Non-POST method');
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    console.log('✅ POST method confirmed');
    
    // Parse body safely
    let body: any = null;
    try {
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        body = JSON.parse(raw);
        console.log('✅ Body parsed:', body);
      } else {
        console.log('⚠️ Empty body received');
      }
    } catch (e) {
      console.error('❌ JSON parse error:', e);
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }
    
    // Check for insights request
    if (body?.insight_type) {
      console.log('✅ Insights request detected:', body.insight_type);
      return jsonResponse({ 
        insights: [
          { attribute_name: 'Test Attribute', recommendation: 'Test recommendation for insights.' }
        ]
      });
    }
    
    // Return basic success
    return jsonResponse({ 
      success: true, 
      message: 'Test function working',
      timestamp: new Date().toISOString(),
      receivedBody: body
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return jsonResponse({ error: 'Server error', details: error.message }, 500);
  }
});
