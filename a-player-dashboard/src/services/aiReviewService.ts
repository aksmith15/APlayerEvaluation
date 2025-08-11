export interface AIGroupOut {
  gradeLine: string;
  paragraph: string;
}

export interface AIReviewOut {
  competence?: AIGroupOut;
  character?: AIGroupOut;
  curiosity?: AIGroupOut;
}

interface GroupInItem {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

export interface AIReviewPayload {
  employeeName: string;
  quarterId?: string;
  groups: {
    competence?: Record<string, GroupInItem>;
    character?: Record<string, GroupInItem>;
    curiosity?: Record<string, GroupInItem>;
  };
}

import { supabase } from './supabase';
import { SUPABASE_CONFIG } from '../constants/config';

export async function fetchDescriptiveReview(payload: AIReviewPayload): Promise<AIReviewOut> {
  const { data: sess } = await supabase.auth.getSession();
  const accessToken = sess?.session?.access_token;
  const headers: Record<string, string> = {
    apikey: SUPABASE_CONFIG.ANON_KEY,
    Authorization: `Bearer ${accessToken ?? SUPABASE_CONFIG.ANON_KEY}`
  };

  const { data, error } = await supabase.functions.invoke('ai-descriptive-review', {
    body: payload,
    headers
  });
  if (error) {
    throw new Error(`AI descriptive review failed: ${error.message || 'unknown error'}`);
  }
  return data as AIReviewOut;
}

