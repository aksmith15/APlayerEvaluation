// @ts-nocheck
// Minimal insights function copying exact working structure

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface Payload {
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
  insight_type: string;
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

    // Skip environment check for now - just test basic function execution
    console.log('✅ Function executing successfully');

    const body = (await req.json()) as Payload;
    console.log('✅ JSON parsed successfully');
    
    if (!body?.employee?.name || !body?.attributes) {
      console.log('❌ Invalid payload');
      return jsonResponse({ error: 'Invalid payload' }, 400);
    }

    console.log('✅ Payload validation passed');

    const isStrengths = body.insight_type === 'strengths';
    const relevantAttributes = isStrengths 
      ? body.attributes.filter(attr => attr.score >= 8.0)
      : body.attributes.filter(attr => attr.score < 8.0);

    console.log(`✅ Filtered ${relevantAttributes.length} ${body.insight_type} attributes`);

    const insights = relevantAttributes.map(attr => ({
      attribute_name: attr.name,
      recommendation: `Mock ${body.insight_type} insight for ${attr.name}: This is a test recommendation for ${body.employee.name}.`
    }));

    console.log(`✅ Generated ${insights.length} insights`);

    return jsonResponse({ insights });

  } catch (error) {
    console.error('❌ Function error:', error);
    return jsonResponse({ error: 'Internal server error', details: error.message }, 500);
  }
});
