// @ts-nocheck
// Exact copy of working function structure for AI insights

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface Payload {
  employeeName: string;
  quarterId?: string;
  groups: {
    competence?: Record<string, { score: number; grade: string }>;
    character?: Record<string, { score: number; grade: string }>;
    curiosity?: Record<string, { score: number; grade: string }>;
  };
}

interface ResultOut {
  insights: Array<{
    attribute_name: string;
    recommendation: string;
  }>;
}

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

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!openaiKey && !anthropicKey) {
      return jsonResponse({ error: 'No provider key set (OPENAI_API_KEY or ANTHROPIC_API_KEY)' }, 500);
    }

    const body = (await req.json()) as Payload;
    if (!body?.employeeName || !body?.groups) {
      return jsonResponse({ error: 'Invalid payload' }, 400);
    }

    // Mock processing that should work like descriptive review
    const insights = [];
    
    Object.entries(body.groups).forEach(([groupName, attributes]) => {
      if (attributes) {
        Object.entries(attributes).forEach(([attrName, data]) => {
          insights.push({
            attribute_name: attrName,
            recommendation: `Mock insight for ${attrName}: ${body.employeeName} shows strength in this area with score ${data.score}.`
          });
        });
      }
    });

    return jsonResponse({ insights });

  } catch (error) {
    console.error('Function error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
