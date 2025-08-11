// @ts-nocheck
// Supabase Edge Function: ai-coaching-report
// Generates a comprehensive coaching report from compact scores + response snippets

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Note: keep file minimal and Deno-compatible

interface AICoachingPayload {
  employee: { id: string; name: string };
  quarter: { id: string; name: string };
  // Optional scope to focus analysis and reduce token usage
  // Allowed: 'overview' | 'competence' | 'character' | 'curiosity'
  scope?: string;
  // Optional section to target specific report parts
  // Allowed: 'strengths_dev' | 'gaps_incidents' | 'questions'
  section?: string;
  attributes: Record<string, {
    scores: { self: number; peer: number; manager: number; weighted: number };
    // Optional precomputed helpers to guide model
    gaps?: { self_vs_others?: number; manager_vs_peer?: number };
    aggregates?: Record<string, { top_values: Array<{ value: string; count: number }> }>;
    responses: Array<{
      attribute_name: string;
      submission_id: string;
      evaluation_type?: 'self'|'peer'|'manager';
      question_id?: string;
      question_text?: string;
      response_type?: string;
      response_value?: unknown;
      created_at?: string;
      // Pre-tagging to help the model separate signal types
      tags?: string[];
      is_recent?: boolean;
    }>;
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

function maybeParseJson<T = unknown>(val: unknown): T | null {
  if (typeof val !== 'string') return null;
  const s = val.trim();
  if (!s.startsWith('{') && !s.startsWith('[')) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function sanitizeCoachingReport(raw: any): any {
  const report = raw?.coaching_report ? raw.coaching_report : raw || {};

  const normArray = (v: any) => Array.isArray(v) ? v : (v == null ? [] : [v]);

  const sanitizeEvidence = (arr: any[]) => normArray(arr).filter(Boolean).slice(0, 4).map((e: any) => ({
    quote: String(e?.quote ?? ''),
    rater: e?.rater === 'self' || e?.rater === 'peer' || e?.rater === 'manager' ? e.rater : undefined,
    attribute: e?.attribute ? String(e.attribute) : undefined,
    question_id: e?.question_id ? String(e.question_id) : undefined,
    created_at: e?.created_at ? String(e.created_at) : undefined
  }));

  const sanitizeCI = (arr: any[]) => normArray(arr).filter(Boolean).map((ci: any) => {
    if (typeof ci === 'string') {
      const parsed = maybeParseJson(ci as string) as any;
      if (parsed && typeof parsed === 'object') ci = parsed;
      else return { situation: String(ci).slice(0, 140) };
    }
    return {
      situation: ci?.situation ? String(ci.situation) : undefined,
      behavior: ci?.behavior ? String(ci.behavior) : undefined,
      impact: ci?.impact ? String(ci.impact) : undefined,
      recommendation: ci?.recommendation ? String(ci.recommendation) : undefined
    };
  });

  const sanitizeTop = (arr: any[]) => normArray(arr).filter(Boolean).map((it: any) => {
    if (typeof it === 'string') {
      return { title: String(it).slice(0, 200), evidence: [] as any[], impact: undefined };
    }
    return {
      title: it?.title ? String(it.title) : undefined,
      evidence: sanitizeEvidence(it?.evidence || []),
      impact: it?.impact ? String(it.impact) : undefined
    };
  });

  const sanitizeDev = (arr: any[]) => normArray(arr).filter(Boolean).map((it: any) => {
    if (typeof it === 'string') {
      return { title: String(it).slice(0, 200), root_cause: 'capability', evidence: [] as any[], interventions: [] as string[] };
    }
    return {
      title: it?.title ? String(it.title) : undefined,
      root_cause: (it?.root_cause === 'capability' || it?.root_cause === 'motivation' || it?.root_cause === 'environment') ? it.root_cause : 'capability',
      evidence: sanitizeEvidence(it?.evidence || []),
      interventions: normArray(it?.interventions).map((s: any) => String(s)).slice(0, 6)
    };
  });

  const sanitizeGaps = (arr: any[]) => normArray(arr).filter(Boolean).map((it: any) => {
    if (typeof it === 'string') {
      return { attribute: undefined, gap_summary: String(it).slice(0, 220), blind_spot: false, evidence: [], alignment_actions: [] };
    }
    return {
      attribute: it?.attribute ? String(it.attribute) : undefined,
      gap_summary: it?.gap_summary ? String(it.gap_summary) : undefined,
      blind_spot: Boolean(it?.blind_spot),
      evidence: sanitizeEvidence(it?.evidence || []),
      alignment_actions: normArray(it?.alignment_actions).map((s: any) => String(s)).slice(0, 6)
    };
  });

  const sanitizeQuestions = (arr: any[]) => normArray(arr).filter(Boolean).map((q: any) => {
    if (typeof q === 'string') return String(q);
    return q?.question ? String(q.question) : JSON.stringify(q);
  });

  const out = {
    top_strengths: sanitizeTop(report?.top_strengths || []),
    top_development_priorities: sanitizeDev(report?.top_development_priorities || []),
    perception_gaps: sanitizeGaps(report?.perception_gaps || []),
    critical_incidents: sanitizeCI(report?.critical_incidents || []),
    '1on1_questions': sanitizeQuestions(report?.['1on1_questions'] || report?.questions || [])
  };

  return { coaching_report: out };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!anthropicKey && !openaiKey) return jsonResponse({ error: 'No provider key set' }, 500);

    const body = (await req.json()) as AICoachingPayload;
    if (!body?.employee?.name || !body?.quarter?.id || !body?.attributes) {
      return jsonResponse({ error: 'Invalid payload' }, 400);
    }

    // Compact prompt builder with scope/section and clear JSON output contract
    const scopeLine = body.scope ? `Scope: ${body.scope} (only analyze attributes relevant to this scope; avoid unrelated content)` : 'Scope: overview';
    const section = body.section as (undefined | 'strengths_dev' | 'gaps_incidents' | 'questions');

    // Build section-specific requirements and JSON schema
    let requirements = `
Requirements:
- Use only the provided data. Ground every claim in the scores and response excerpts.
- Treat rater types equally (self, peer, manager). Do not assume manager evidence is superior.
- Use provided tags (e.g., strength_indicator, weakness_indicator, example, context, critical_incident) and gaps/aggregates when present.
- Prefer direct quotes when available; paraphrase only when necessary (still cite rater/attribute/question).
- Avoid generic coaching cliches. Be specific, measurable, and situational.
- If evidence is truly insufficient for an item, omit that item (do NOT fabricate).

Output rules:
- Never return JSON inside strings. Do NOT wrap objects in quotes or backticks.
- Return arrays of objects exactly as specified in the schema. No extra keys, no markdown fences.`.trim();

    requirements += `

Evidence strength (use to decide inclusion):
- Concrete examples (tag: example) with specific actions/results OR explicit scenarios in response_text.
- Multi-rater alignment: similar themes from 2+ rater types.
- Aggregates: multi-select top values with counts > 1 supporting a pattern.
- Score alignment: item’s conclusion is consistent with numeric scores and computed gaps.
- Clear context signals (tag: context) explaining when/where the behavior occurs.`;

    let jsonShape = '';

    if (section === 'strengths_dev') {
      requirements += `
- Strengths: prioritize attributes with scores 9–10; include 6–8 only when strength_indicator/example/context tags support.
- Development priorities: prioritize scores 1–5; include 6–8 when weakness_indicator/critical_incident tags support.
- Each item must include >=2 short quotes (<=140 chars) with rater and attribute.
- Interventions must be SMART: include owner (${body.employee.name}), cadence/frequency, and observable outcome.
- Minimum counts: top_strengths >= 3, top_development_priorities >= 3.`;
      jsonShape = `{
  "top_strengths": [
    {"title": string, "evidence": [{"quote": string, "rater": "self"|"peer"|"manager", "attribute": string, "question_id"?: string, "created_at"?: string}], "impact": string}
  ],
  "top_development_priorities": [
    {"title": string, "root_cause": "capability"|"motivation"|"environment", "evidence": [{"quote": string, "rater": "self"|"peer"|"manager", "attribute": string, "question_id"?: string, "created_at"?: string}], "interventions": string[]}
  ]
}`;
    } else if (section === 'gaps_incidents') {
      requirements += `
- Perception gaps: compute self vs others (others = avg(manager, peer)); include numeric differences. Threshold |gap| >= 1.5.
- Include >=2 quotes that illustrate the misalignment (e.g., self success vs peer struggle).
- Critical incidents: derive from low scores (<=7) and weakness_indicator/critical_incident tags; use Situation-Behavior-Impact; provide 1 recommendation.
- If no credible critical incidents exist, return an empty list for critical_incidents and instead emphasize development actions inside perception gap alignment_actions (do NOT invent incidents).
- Minimum counts: perception_gaps >= 2; critical_incidents 0–4 depending on evidence.`;
      jsonShape = `{
  "perception_gaps": [
    {"attribute": string, "gap_summary": string, "blind_spot": boolean, "evidence": [{"quote": string, "rater": "self"|"peer"|"manager", "question_id"?: string, "created_at"?: string}], "alignment_actions": string[]}
  ],
  "critical_incidents": [
    {"situation": string, "behavior": string, "impact": string, "recommendation": string}
  ]
}`;
    } else if (section === 'questions') {
      requirements += `
- Generate 8–12 evidence-based coaching questions tied to specific behaviors.
- Cover both strengths (leverage) and weaknesses (improve): ~40% strengths / ~60% development.
- Each question must include a rationale referencing concrete evidence (scores, quotes, or aggregates).`;
      jsonShape = `{
  "1on1_questions": [
    {"question": string, "rationale": string, "target_attribute": string, "focus": "strength"|"development"}
  ]
}`;
    } else {
      // Backward-compatible full report when no section is provided
      requirements += `
- Use at least 2 short quotes (<=140 chars) where available to justify each item.
- Minimum counts: top_strengths (>=3), top_development_priorities (>=3), perception_gaps (>=2).`;
      jsonShape = `{
  "coaching_report": {
    "top_strengths": [
      {"title": string, "evidence": [{"quote": string, "rater": "self"|"peer"|"manager", "attribute": string, "question_id"?: string, "created_at"?: string}], "impact": string}
    ],
    "top_development_priorities": [
      {"title": string, "root_cause": "capability"|"motivation"|"environment", "evidence": [{"quote": string, "rater": "self"|"peer"|"manager", "attribute": string, "question_id"?: string, "created_at"?: string}], "interventions": string[]}
    ],
    "perception_gaps": [
      {"attribute": string, "gap_summary": string, "blind_spot": boolean, "evidence": [{"quote": string, "rater": "self"|"peer"|"manager", "question_id"?: string, "created_at"?: string}], "alignment_actions": string[]}
    ],
    "critical_incidents": [
      {"situation": string, "behavior": string, "impact": string, "recommendation": string}
    ],
    "1on1_questions": string[]
  }
}`;
    }

    const header = `You are an HR-grade performance coach. Output strict JSON only (no prose outside JSON).`;
    const sectionLine = section ? `Section: ${section} (return only keys for this section)` : 'Section: full_report';

    const prompt = `${header}
${scopeLine}
${sectionLine}
Employee: ${body.employee.name}
Quarter: ${body.quarter.name}

DATA (scores + responses + optional gaps/aggregates/tags): ${JSON.stringify(body.attributes)}

${requirements}

Return EXACTLY this JSON shape:
${jsonShape}`.trim();

    // Call provider
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
          max_tokens: 1800,
          temperature: 0.4,
          system: 'You write concise, professional, HR-grade coaching reports. Output a single JSON object.',
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
            { role: 'system', content: 'You write concise, professional, HR-grade coaching reports.' },
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
        const parsed = JSON.parse(content);
         // If sectioned, wrap into coaching_report with only returned keys
         if (section === 'strengths_dev') {
          return jsonResponse(sanitizeCoachingReport({ coaching_report: { top_strengths: parsed.top_strengths || [], top_development_priorities: parsed.top_development_priorities || [] } }));
         } else if (section === 'gaps_incidents') {
          return jsonResponse(sanitizeCoachingReport({ coaching_report: { perception_gaps: parsed.perception_gaps || [], critical_incidents: parsed.critical_incidents || [] } }));
         } else if (section === 'questions') {
           // Normalize to expected key
           const questions = parsed['1on1_questions'] || parsed.questions || [];
          return jsonResponse(sanitizeCoachingReport({ coaching_report: { '1on1_questions': questions } }));
         }
        return jsonResponse(sanitizeCoachingReport(parsed?.coaching_report ? parsed : { coaching_report: parsed }));
      } catch {
        return jsonResponse({ error: 'Invalid model output', raw: content }, 502);
      }
    } else {
      const resp = await callOpenAI(prompt);
      if (!resp.ok && anthropicKey) {
        // Fallback to Anthropic when OpenAI fails and Anthropic is configured
        const resp2 = await callAnthropic(prompt);
        if (!resp2.ok) return jsonResponse({ error: 'OpenAI/Anthropic error', detail: await resp2.text() }, resp2.status);
        const data2 = await resp2.json();
        const content2 = data2?.content?.[0]?.text || '{}';
      try {
        const parsed2 = JSON.parse(content2);
          if (section === 'strengths_dev') {
          return jsonResponse(sanitizeCoachingReport({ coaching_report: { top_strengths: parsed2.top_strengths || [], top_development_priorities: parsed2.top_development_priorities || [] } }));
          } else if (section === 'gaps_incidents') {
          return jsonResponse(sanitizeCoachingReport({ coaching_report: { perception_gaps: parsed2.perception_gaps || [], critical_incidents: parsed2.critical_incidents || [] } }));
          } else if (section === 'questions') {
            const questions2 = parsed2['1on1_questions'] || parsed2.questions || [];
          return jsonResponse(sanitizeCoachingReport({ coaching_report: { '1on1_questions': questions2 } }));
          }
        return jsonResponse(sanitizeCoachingReport(parsed2?.coaching_report ? parsed2 : { coaching_report: parsed2 }));
        } catch {
          return jsonResponse({ error: 'Invalid model output', raw: content2 }, 502);
        }
      }
      if (!resp.ok) return jsonResponse({ error: 'OpenAI error', detail: await resp.text() }, resp.status);
      const data = await resp.json();
       const content = data?.choices?.[0]?.message?.content || '{}';
      try {
        const parsed = JSON.parse(content);
         if (section === 'strengths_dev') {
          return jsonResponse(sanitizeCoachingReport({ coaching_report: { top_strengths: parsed.top_strengths || [], top_development_priorities: parsed.top_development_priorities || [] } }));
         } else if (section === 'gaps_incidents') {
          return jsonResponse(sanitizeCoachingReport({ coaching_report: { perception_gaps: parsed.perception_gaps || [], critical_incidents: parsed.critical_incidents || [] } }));
         } else if (section === 'questions') {
           const questions = parsed['1on1_questions'] || parsed.questions || [];
          return jsonResponse(sanitizeCoachingReport({ coaching_report: { '1on1_questions': questions } }));
         }
        return jsonResponse(sanitizeCoachingReport(parsed?.coaching_report ? parsed : { coaching_report: parsed }));
      } catch {
        return jsonResponse({ error: 'Invalid model output', raw: content }, 502);
      }
    }
  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Unknown error' }, 500);
  }
});

