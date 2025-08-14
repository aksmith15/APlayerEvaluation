// Minimal test function to check Resend API connectivity
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 TEST: Starting Resend API test');

    // Check if API key exists
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    console.log('🔍 TEST: API key exists:', !!resendApiKey);
    console.log('🔍 TEST: API key length:', resendApiKey?.length || 0);
    console.log('🔍 TEST: API key starts with:', resendApiKey?.substring(0, 5));

    if (!resendApiKey) {
      console.log('❌ TEST: No API key found');
      return jsonResponse({ error: 'RESEND_API_KEY not set' }, 500);
    }

    // Test basic Resend API call
    console.log('🔍 TEST: Making Resend API call...');
    
    const testPayload = {
      from: 'A-Player Evaluations <onboarding@resend.dev>',
      to: 'test@example.com', // This won't actually send to a test email
      subject: 'Test Email',
      html: '<p>This is a test</p>',
      text: 'This is a test'
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('🔍 TEST: Resend response status:', response.status);
    console.log('🔍 TEST: Resend response ok:', response.ok);

    const result = await response.json();
    console.log('🔍 TEST: Resend response body:', result);

    if (!response.ok) {
      console.log('❌ TEST: Resend API error');
      return jsonResponse({ 
        error: 'Resend API failed',
        status: response.status,
        resend_error: result
      }, 500);
    }

    console.log('✅ TEST: Resend API call successful');
    return jsonResponse({ 
      success: true, 
      message: 'Resend API test passed',
      resend_response: result
    });

  } catch (error) {
    console.log('❌ TEST: Unexpected error:', error);
    return jsonResponse({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

