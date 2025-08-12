// Ultra-simple test to isolate invocation issues
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

serve(async (req) => {
  console.log('🚀 Ultra-simple test function called');
  
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
    
    // Just return immediate success
    return jsonResponse({ 
      success: true, 
      message: 'Test function working',
      insights: [
        { attribute_name: 'Test', recommendation: 'Test recommendation' }
      ]
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return jsonResponse({ error: 'Server error', details: error.message }, 500);
  }
});
