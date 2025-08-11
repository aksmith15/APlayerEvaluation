import { supabase } from './supabase';
import { SUPABASE_CONFIG } from '../constants/config';

export interface AICoachingReportOut {
  coaching_report?: any;
}

export interface AICoachingPayload {
  employee: { id: string; name: string };
  quarter: { id: string; name: string };
  scope?: 'overview' | 'competence' | 'character' | 'curiosity';
  section?: 'strengths_dev' | 'gaps_incidents' | 'questions';
  attributes: Record<string, {
    scores: { self: number; peer: number; manager: number; weighted: number };
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
      tags?: string[];
      is_recent?: boolean;
    }>;
  }>;
}

export async function fetchCoachingReport(payload: AICoachingPayload): Promise<AICoachingReportOut> {
  const { data: sess } = await supabase.auth.getSession();
  const accessToken = sess?.session?.access_token;
  const headers: Record<string, string> = {
    apikey: SUPABASE_CONFIG.ANON_KEY,
    Authorization: `Bearer ${accessToken ?? SUPABASE_CONFIG.ANON_KEY}`
  };

  const { data, error } = await supabase.functions.invoke('ai-coaching-report', {
    body: payload,
    headers
  });
  if (error) {
    throw new Error(`AI coaching report failed: ${error.message || 'unknown error'}`);
  }
  return data as AICoachingReportOut;
}

