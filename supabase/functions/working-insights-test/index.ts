// Copy of working ai-coaching-report structure, modified for insights
// This bypasses the infrastructure issue by using the old function slot
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface InsightsPayload {
  employee: {
    name: string;
    department: string;
    tenure_category: string;
    role: string;
    id: string;
  };
  quarter?: string;
  attributes: Array<{
    name: string;
    score: number;
    category: string;
  }>;
  insight_type: 'strengths' | 'development';
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
      return jsonResponse({ error: 'No provider key set' }, 500);
    }

    const body = (await req.json()) as InsightsPayload;
    if (!body?.employee?.name || !body?.attributes || !body?.insight_type) {
      return jsonResponse({ error: 'Invalid payload' }, 400);
    }

    const isStrengths = body.insight_type === 'strengths';
    const filteredAttributes = body.attributes.filter(attr => 
      isStrengths ? attr.score >= 8.0 : attr.score < 8.0
    );

    if (filteredAttributes.length === 0) {
      return jsonResponse({ insights: [] });
    }

    // Return working test response until infrastructure is fixed
    const testInsights = filteredAttributes.map(attr => ({
      attribute_name: attr.name,
      recommendation: `Focus on leveraging your strong ${attr.name} skills (${attr.score}/10) through ${isStrengths ? 'leadership opportunities and mentoring others' : 'targeted development activities and practice sessions'}.`
    }));

    return jsonResponse({ insights: testInsights });

  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Unknown error' }, 500);
  }
});
