A-Player Coaching Report v2 — Implementation + Handoff Summary
Goal: Evidence-backed, coach-usable AI coaching report using multiple focused AI calls, per-core-group trends, and deterministic question intent tagging from survey question IDs.
What we implemented
Multi-call AI strategy: 4 parallel calls to the AI function with scope: overview, competence, character, curiosity; merged into a single coaching report.
Preprocessing
Attribute name normalization; recency tagging (top 3 per evaluator).
Numeric gaps per attribute: self vs others; manager vs peer.
Multi-select aggregates: top values per question_id.
Deterministic intent tagging using survey IDs (from EvaluationSurvey.tsx) via src/constants/questionTags.ts with fallbacks.
Server prompt upgrade
Strict JSON schema; minimum counts; short quotes with rater + attribute; SMART interventions; scope-aware prompts.
PDF rendering update
CoachingReportPage.tsx renders bullets with embedded quotes (rater, attribute) instead of raw JSON.
Key files changed
supabase/functions/ai-coaching-report/index.ts: added scope, evidence fields, stricter prompt, slightly higher max_tokens.
a-player-dashboard/src/services/reactPdfBuilder.ts:
New preprocessing and 4 parallel AI calls; merged result.
Integrates getTagsForQuestionId() for deterministic tagging.
Builds per-question aggregates for multi-selects.
a-player-dashboard/src/constants/questionTags.ts: deterministic tag dictionary by question_id (+ pattern fallback).
a-player-dashboard/src/pages/react-pdf/CoachingReportPage.tsx: bullets + evidence quotes.
Docs/Implementation.md: checked off completed tasks for Coaching Report v2.
LLM prompt used (current)
Apply to index.ts
How to test
Deploy edge functions to your main project ref:
Link (one time):
supabase link --project-ref tufjnccktzcbmaemekiz
Set secrets (if needed):
supabase secrets set --env prod OPENAI_API_KEY=sk-... ANTHROPIC_API_KEY=sk-ant-... --project-ref tufjnccktzcbmaemekiz
Deploy:
supabase functions deploy ai-coaching-report --project-ref tufjnccktzcbmaemekiz
supabase functions deploy ai-descriptive-review --project-ref tufjnccktzcbmaemekiz
Start app: npm run dev
Dev preview route:
http://localhost:3000/dev/pdf-preview?employeeId=2639fa80-d382-4951-afa0-00096e16e2ad&quarterId=fbbf0272-945a-4eae-96f1-d2c87a62bcea&quarterName=Q3%202025
Expect 4 parallel AI calls; PDF Coaching Report shows bullets with quotes, rater/attribute labels, numeric gap callouts.
SQL helpers (for checking data)
Joined fetch of responses for Kolbe Smith, Q3 2025:
Apply to index.ts
Known issues and status
Edge function project targeting: The CLI was picking the wrong project interactively. Use --project-ref tufjnccktzcbmaemekiz on link, secrets, and deploy to pin the correct project.
PowerShell password input: No characters echo when typing—this is normal. Press Enter after typing. Use browser-based token login if preferred (supabase login → open in browser and paste token).
APIs “not firing” for coaching report: Most likely the functions are deployed to a different project (wrong ref) or missing secrets. Redeploy using --project-ref and confirm OPENAI_API_KEY/ANTHROPIC_API_KEY are set on that project.
TypeScript build warnings: npm run build flags pre-existing test/type issues. You can still run npm run dev to preview. We can exclude tests from tsc build or fix outstanding test imports if needed.
Next steps
Redeploy with --project-ref tufjnccktzcbmaemekiz and confirm secrets set.
Test via /dev/pdf-preview link above.
If response density is still low, paste a sample of question_id → question_text pairs and we’ll extend questionTags.ts coverage further.
Where to continue (another chat)
Reference this summary and focus on:
Verifying edge function deployment and secrets on project ref tufjnccktzcbmaemekiz.
Extending questionTags.ts if any question_id is missing desired tags.
Optionally adding an “Evidence Appendix” page (top quotes by attribute).
Short status update:
Implemented multi-call orchestration, deterministic survey-ID tagging, preprocessing (gaps, recency, aggregates), stricter server prompt, and PDF evidence rendering. APIs likely not firing due to deployment targeting; redeploy with the correct --project-ref and test via the dev preview.