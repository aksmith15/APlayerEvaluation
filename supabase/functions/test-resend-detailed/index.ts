// Detailed Resend test with step-by-step debugging
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
    console.log('🔍 DETAILED TEST: Starting...');

    // Step 1: Check all environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');

    console.log('📊 Environment Variables:');
    console.log('- SUPABASE_URL length:', supabaseUrl?.length || 0);
    console.log('- SUPABASE_SERVICE_ROLE_KEY length:', supabaseKey?.length || 0);
    console.log('- RESEND_API_KEY length:', resendKey?.length || 0);
    console.log('- RESEND_API_KEY starts with "re_":', resendKey?.startsWith('re_') || false);

    if (!resendKey) {
      return jsonResponse({ error: 'RESEND_API_KEY not found in environment' }, 500);
    }

    if (!resendKey.startsWith('re_')) {
      return jsonResponse({ error: 'RESEND_API_KEY does not start with "re_" - invalid format' }, 500);
    }

    // Step 2: Test Resend API connectivity
    console.log('🌐 Testing Resend API connectivity...');

    const testEmail = {
      from: 'A-Player Evaluations <onboarding@resend.dev>',
      to: 'delivered@resend.dev', // Resend test email that always works
      subject: 'Test Email from A-Player Evaluations',
      html: '<h1>Test Email</h1><p>This is a test email from your A-Player Evaluations system.</p>',
      text: 'Test Email\n\nThis is a test email from your A-Player Evaluations system.'
    };

    console.log('📧 Test email payload:', {
      from: testEmail.from,
      to: testEmail.to,
      subject: testEmail.subject
    });

    let response;
    let responseText;
    
    try {
      console.log('🚀 Making Resend API call...');
      
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0'
        },
        body: JSON.stringify(testEmail)
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

      responseText = await response.text();
      console.log('📨 Response body (raw):', responseText);

    } catch (fetchError) {
      console.log('❌ Fetch error:', fetchError);
      return jsonResponse({ 
        error: 'Network error calling Resend API',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown network error'
      }, 500);
    }

    // Step 3: Parse and analyze response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      console.log('📨 Parsed response:', parsedResponse);
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError);
      return jsonResponse({ 
        error: 'Invalid JSON response from Resend',
        raw_response: responseText
      }, 500);
    }

    // Step 4: Check if successful
    if (response.ok) {
      console.log('✅ SUCCESS: Resend API call worked!');
      return jsonResponse({ 
        success: true,
        message: 'Resend API test successful',
        email_id: parsedResponse.id,
        full_response: parsedResponse
      });
    } else {
      console.log('❌ FAILED: Resend API returned error');
      return jsonResponse({ 
        error: 'Resend API error',
        status: response.status,
        resend_error: parsedResponse,
        raw_response: responseText
      }, 500);
    }

  } catch (error) {
    console.log('❌ UNEXPECTED ERROR:', error);
    return jsonResponse({ 
      error: 'Unexpected error in test function',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

