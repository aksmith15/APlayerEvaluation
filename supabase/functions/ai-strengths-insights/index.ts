// Supabase Edge Function: ai-strengths-insights
// Generates actionable insights for leveraging employee strengths
// Fixed with robust body parsing pattern from test-minimal

type TenureCategory = 'new' | 'growing' | 'established' | 'advanced';
type CoreGroupCategory = 'competence' | 'character' | 'curiosity';

interface Employee {
  name: string;
  department: string;
  tenure_category: TenureCategory;
  role: string;
  id: string;
}

interface Attribute {
  name: string;
  score: number;
  category: CoreGroupCategory;
}

interface Payload {
  employee: Employee;
  quarter?: string;
  attributes: Attribute[];
  insight_type: 'strengths';
}

interface InsightItem {
  attribute_name: string;
  recommendation: string;
}

interface ResultOut {
  insights: InsightItem[];
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

function getTenureDescription(category: TenureCategory): string {
  switch (category) {
    case 'new': return 'new team member (≤6 months)';
    case 'growing': return 'developing employee (6-12 months)';
    case 'established': return 'experienced team member (1-3 years)';
    case 'advanced': return 'senior team member (3+ years)';
    default: return 'team member';
  }
}

// @ts-ignore - Deno global is available in Supabase Edge Functions runtime
Deno.serve(async (req) => {
  console.log('🚀 AI Strengths Insights function called');
  
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

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!anthropicKey && !openaiKey) {
      return jsonResponse({ error: 'No provider key set' }, 500);
    }

    // Robust body parsing (no crash if empty) - same pattern as test-minimal
    let body: any = null;
    try {
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        body = JSON.parse(raw);
        console.log('✅ Body parsed:', body);
      } else {
        console.log('⚠️ Empty body received');
        return jsonResponse({ error: 'Empty request body' }, 400);
      }
    } catch (e) {
      console.error('❌ JSON parse error:', e);
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    if (!body?.employee?.name || !body?.attributes || body.insight_type !== 'strengths') {
      console.log('❌ Invalid payload structure');
      return jsonResponse({ error: 'Invalid payload or wrong insight_type' }, 400);
    }

    // Filter for actual strengths (≥8.0)
    const strengths = body.attributes.filter(attr => attr.score >= 8.0);
    if (strengths.length === 0) {
      return jsonResponse({ insights: [] });
    }

    const tenureDesc = getTenureDescription(body.employee.tenure_category);
    const attributeList = strengths.map(attr => 
      `${attr.name} (Score: ${attr.score.toFixed(1)}/10, Category: ${attr.category})`
    ).join('\n');

    const prompt = `
You are a Leadership Development Coach providing actionable insights for leveraging employee strengths.

Employee: ${body.employee.name}
Department: ${body.employee.department}
Experience Level: ${tenureDesc}
Role: ${body.employee.role}

Strong Attributes (≥8.0):
${attributeList}

Generate actionable recommendations for leveraging these strengths. Return JSON format:
{
  "insights": [
    {
      "attribute_name": "exact attribute name",
      "recommendation": "2-3 concise sentences with practical, department-aware advice"
    }
  ]
}

Guidelines:
- Keep each recommendation to exactly 2-3 sentences maximum
- Focus on practical actions relevant to their department context
- Consider their experience level for appropriate complexity
- Emphasize leveraging existing strengths rather than fixing weaknesses
- Be specific and actionable, not generic advice
- Match advice to their tenure level and department context

Department Context Examples:
- Engineering: Focus on technical leadership, code reviews, mentoring
- Sales: Leverage relationship building, client communication, pipeline management
- Marketing: Utilize creative communication, campaign strategy, brand messaging
- Operations: Emphasize process optimization, team coordination, efficiency
- Executive: Strategic thinking, stakeholder management, vision communication

Return only valid JSON with no additional text.`.trim();

    // Call AI provider with proper error handling (same pattern as working functions)
    async function callAnthropic(promptText: string) {
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
          max_tokens: 800,
          system: 'You write practical, department-aware recommendations for leveraging strengths. Output strict JSON only.',
          messages: [{ role: 'user', content: promptText }]
        })
      });
      return resp;
    }

    async function callOpenAI(promptText: string) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You write practical, department-aware recommendations for leveraging strengths. Output strict JSON only.' },
            { role: 'user', content: promptText }
          ]
        })
      });
      return resp;
    }

    if (anthropicKey) {
      let resp = await callAnthropic(prompt);
      if (!resp.ok && openaiKey) {
        // Fallback to OpenAI on provider error (e.g., 429 rate limit)
        resp = await callOpenAI(prompt);
      }
      if (!resp.ok) return jsonResponse({ error: 'Anthropic/OpenAI error', detail: await resp.text() }, resp.status);
      const data = await resp.json();
      const content = data?.content?.[0]?.text || data?.choices?.[0]?.message?.content || '{}';
      try {
        const parsed = JSON.parse(content) as ResultOut;
        if (!parsed.insights || !Array.isArray(parsed.insights)) {
          throw new Error('Invalid AI response structure');
        }
        
        // Validate insights match our attributes
        const validInsights = parsed.insights.filter(insight => 
          insight.attribute_name && 
          insight.recommendation && 
          strengths.some(attr => attr.name === insight.attribute_name)
        );
        
        return jsonResponse({ insights: validInsights });
      } catch {
        return jsonResponse({ error: 'Invalid model output', raw: content }, 502);
      }
    } else {
      // OpenAI primary
      const resp = await callOpenAI(prompt);
      if (!resp.ok) return jsonResponse({ error: 'OpenAI error', detail: await resp.text() }, resp.status);
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || '{}';
      try {
        const parsed = JSON.parse(content) as ResultOut;
        if (!parsed.insights || !Array.isArray(parsed.insights)) {
          throw new Error('Invalid AI response structure');
        }
        
        // Validate insights match our attributes
        const validInsights = parsed.insights.filter(insight => 
          insight.attribute_name && 
          insight.recommendation && 
          strengths.some(attr => attr.name === insight.attribute_name)
        );
        
        return jsonResponse({ insights: validInsights });
      } catch {
        return jsonResponse({ error: 'Invalid model output', raw: content }, 502);
      }
    }
  } catch (error) {
    return jsonResponse({ error: (error as Error).message || 'Unknown error' }, 500);
  }
});