// @ts-nocheck
// Debug function to test insights payload and see exact errors
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
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Test 1: Check environment variables
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Test 2: Try to parse the request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return jsonResponse({ 
        error: 'JSON parse failed', 
        detail: e.message,
        debug: 'Request body could not be parsed as JSON'
      }, 400);
    }

    // Test 3: Simple Anthropic API test
    if (anthropicKey) {
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'content-type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-latest',
            temperature: 0.4,
            max_tokens: 100,
            system: 'You are a test assistant.',
            messages: [{ role: 'user', content: 'Just say "test successful"' }]
          })
        });

        if (!resp.ok) {
          const errorText = await resp.text();
          return jsonResponse({
            test: 'anthropic_test_failed',
            status: resp.status,
            error: errorText,
            debug: 'Anthropic API call failed'
          }, 200);
        }

        const data = await resp.json();
        return jsonResponse({
          test: 'success',
          anthropic_works: true,
          openai_available: !!openaiKey,
          received_payload: body,
          ai_response: data?.content?.[0]?.text || 'No content'
        }, 200);

      } catch (e) {
        return jsonResponse({
          test: 'anthropic_exception',
          error: e.message,
          debug: 'Exception during Anthropic call'
        }, 200);
      }
    } else if (openaiKey) {
      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.4,
            messages: [{ role: 'user', content: 'Just say "test successful"' }]
          })
        });

        if (!resp.ok) {
          const errorText = await resp.text();
          return jsonResponse({
            test: 'openai_test_failed',
            status: resp.status,
            error: errorText,
            debug: 'OpenAI API call failed'
          }, 200);
        }

        const data = await resp.json();
        return jsonResponse({
          test: 'success',
          openai_works: true,
          anthropic_available: false,
          received_payload: body,
          ai_response: data?.choices?.[0]?.message?.content || 'No content'
        }, 200);

      } catch (e) {
        return jsonResponse({
          test: 'openai_exception',
          error: e.message,
          debug: 'Exception during OpenAI call'
        }, 200);
      }
    } else {
      return jsonResponse({
        test: 'no_api_keys',
        anthropic_key: anthropicKey ? 'present' : 'missing',
        openai_key: openaiKey ? 'present' : 'missing',
        debug: 'No API keys found'
      }, 200);
    }

  } catch (error) {
    return jsonResponse({
      test: 'general_exception',
      error: error.message,
      debug: 'Unexpected error in main handler'
    }, 200);
  }
});

