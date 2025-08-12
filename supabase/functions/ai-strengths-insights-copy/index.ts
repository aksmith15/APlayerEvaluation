// Supabase Edge Function: ai-descriptive-review
// Securely generates Descriptive Review text per core group from compact scores/grades
// Endpoint (after deploy): /functions/v1/ai-descriptive-review

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Grade = 'A' | 'B' | 'C' | 'D';
type GroupIn = Record<string, { score: number; grade: Grade }>;

interface Payload {
  employeeName: string;
  quarterId?: string;
  groups: {
    competence?: GroupIn;
    character?: GroupIn;
    curiosity?: GroupIn;
  };
}

interface GroupOut { gradeLine: string; paragraph: string }
interface ResultOut {
  competence?: GroupOut;
  character?: GroupOut;
  curiosity?: GroupOut;
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

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!openaiKey && !anthropicKey) {
      return jsonResponse({ error: 'No provider key set (OPENAI_API_KEY or ANTHROPIC_API_KEY)' }, 500);
    }

    const body = (await req.json()) as Payload;
    if (!body?.employeeName || !body?.groups) {
      return jsonResponse({ error: 'Invalid payload' }, 400);
    }

    const prompt = `
You are writing a concise Descriptive Review for an HR performance report. For each provided group
(Competence, Character, Curiosity), return JSON with this shape (include only groups that exist in input):
{
  "competence": { "gradeLine": "Label: A | Label: B | ...", "paragraph": "120-160 words" },
  "character": { ... },
  "curiosity": { ... }
}

Requirements:
- Use the employee's name (${body.employeeName}) in prose.
- gradeLine must follow the attribute order as in input for that group.
- Tone: professional, specific, no bullet points, one paragraph per group.
- Do not include any additional keys or commentary.

Input data (attributes with score and letter grade):
${JSON.stringify(body.groups)}
`.trim();

    if (anthropicKey) {
      // Prefer Anthropic if configured
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-latest',
          temperature: 0.7,
          max_tokens: 1200,
          system: 'You write succinct, HR-grade performance narratives. Output strictly a single JSON object and nothing else.',
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!resp.ok) {
        const text = await resp.text();
        return jsonResponse({ error: 'Upstream error (Anthropic)', detail: text }, resp.status);
      }

      const data = await resp.json();
      const content = data?.content?.[0]?.text || '{}';
      try {
        const parsed = JSON.parse(content) as ResultOut;
        return jsonResponse(parsed);
      } catch {
        return jsonResponse({ error: 'Invalid model output', raw: content }, 502);
      }
    } else {
      // Fallback to OpenAI
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You write succinct, HR-grade performance narratives.' },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!resp.ok) {
        const text = await resp.text();
        return jsonResponse({ error: 'Upstream error (OpenAI)', detail: text }, resp.status);
      }

      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || '{}';
      try {
        const parsed = JSON.parse(content) as ResultOut;
        return jsonResponse(parsed);
      } catch {
        return jsonResponse({ error: 'Invalid model output', raw: content }, 502);
      }
    }
  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Unknown error' }, 500);
  }
});

