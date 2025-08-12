// Minimal test version to debug AI insights issues
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Test function called');
    
    if (req.method !== 'POST') {
      console.log('❌ Non-POST method:', req.method);
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Check environment variables
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    console.log('🔍 Environment check:', { 
      hasOpenAI: !!openaiKey, 
      hasAnthropic: !!anthropicKey,
      openaiPrefix: openaiKey ? openaiKey.substring(0, 8) + '...' : 'none'
    });

    // Parse payload
    let body;
    try {
      body = await req.json();
      console.log('📦 Received payload keys:', Object.keys(body || {}));
      console.log('📦 Employee name:', body?.employee?.name);
      console.log('📦 Attributes count:', body?.attributes?.length);
      console.log('📦 Insight type:', body?.insight_type);
    } catch (parseError) {
      console.log('❌ JSON parsing failed:', parseError);
      return jsonResponse({ error: 'Invalid JSON payload' }, 400);
    }

    // Basic validation
    if (!body?.employee?.name) {
      console.log('❌ Missing employee name');
      return jsonResponse({ error: 'Missing employee.name' }, 400);
    }

    if (!body?.attributes || !Array.isArray(body.attributes)) {
      console.log('❌ Missing or invalid attributes');
      return jsonResponse({ error: 'Missing attributes array' }, 400);
    }

    if (!body?.insight_type) {
      console.log('❌ Missing insight_type');
      return jsonResponse({ error: 'Missing insight_type' }, 400);
    }

    console.log('✅ Basic validation passed');

    // Test OpenAI API access
    if (!openaiKey) {
      console.log('❌ No OpenAI key found');
      return jsonResponse({ error: 'No OpenAI API key configured' }, 500);
    }

    console.log('🤖 Testing OpenAI API access...');
    
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 OpenAI models API status:', testResponse.status);
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.log('❌ OpenAI API test failed:', errorText);
        return jsonResponse({ 
          error: 'OpenAI API access failed', 
          details: `Status: ${testResponse.status}, Body: ${errorText}` 
        }, 500);
      }

      console.log('✅ OpenAI API access successful');

    } catch (apiError) {
      console.log('❌ OpenAI API test exception:', apiError);
      return jsonResponse({ 
        error: 'OpenAI API test failed', 
        details: apiError.message 
      }, 500);
    }

    // Return mock success response
    const mockInsights = body.attributes.map((attr: any) => ({
      attribute_name: attr.name,
      recommendation: `Mock insight for ${attr.name} (${body.insight_type}): This is a test recommendation.`
    }));

    console.log('✅ Returning mock insights for', mockInsights.length, 'attributes');

    return jsonResponse({ insights: mockInsights });

  } catch (error) {
    console.error('❌ Function error:', error);
    return jsonResponse({ 
      error: 'Internal server error', 
      details: error.message 
    }, 500);
  }
});
