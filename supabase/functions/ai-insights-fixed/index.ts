// @ts-nocheck
// Fixed AI insights function matching working function patterns
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface EmployeeIn {
  name: string;
  department: string;
  tenure_category: string;
  role: string;
  id: string;
}

interface AttributeIn {
  name: string;
  score: number;
  category: string;
}

interface Payload {
  employee: EmployeeIn;
  quarter?: string;
  attributes: AttributeIn[];
  insight_type: string;
}

interface InsightOut {
  attribute_name: string;
  recommendation: string;
}

interface ResultOut {
  insights: InsightOut[];
}

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
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const body = (await req.json()) as Payload;
    
    // Basic validation - matching working function patterns
    if (!body?.employee?.name || !body?.attributes) {
      return jsonResponse({ error: 'Invalid payload' }, 400);
    }

    const isStrengths = body.insight_type === 'strengths';
    const relevantAttributes = isStrengths 
      ? body.attributes.filter(attr => attr.score >= 8.0)
      : body.attributes.filter(attr => attr.score < 8.0);

    if (relevantAttributes.length === 0) {
      return jsonResponse({ insights: [] });
    }

    // Generate mock insights for now
    const insights: InsightOut[] = relevantAttributes.map(attr => ({
      attribute_name: attr.name,
      recommendation: isStrengths 
        ? `${body.employee.name} can leverage their strong ${attr.name.toLowerCase()} by taking on leadership roles and mentoring others. Focus on building upon this strength through challenging projects. Continue to model excellence in this area for the team.`
        : `${body.employee.name} can improve ${attr.name.toLowerCase()} by focusing on structured practice and seeking regular feedback. Set specific goals and track progress weekly. Consider partnering with a mentor or colleague who excels in this area.`
    }));

    return jsonResponse({ insights });

  } catch (error) {
    console.error('Function error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
