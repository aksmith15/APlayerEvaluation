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

const COACHING_TIMEOUT = 90000; // 90 seconds - generous timeout for AI processing

export async function fetchCoachingReport(payload: AICoachingPayload): Promise<AICoachingReportOut> {
  const { data: sess } = await supabase.auth.getSession();
  const accessToken = sess?.session?.access_token;
  const headers: Record<string, string> = {
    apikey: SUPABASE_CONFIG.ANON_KEY,
    Authorization: `Bearer ${accessToken ?? SUPABASE_CONFIG.ANON_KEY}`
  };

  // Create abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, COACHING_TIMEOUT);

  try {
    console.log('🤖 Starting AI coaching report generation...');
    
    // Optimize payload to reduce processing time
    const optimizedPayload = optimizeCoachingPayload(payload);
    
    const { data, error } = await supabase.functions.invoke('ai-coaching-report', {
      body: optimizedPayload,
      headers
    });
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('❌ AI coaching report error:', error);
      throw new Error(`AI coaching report failed: ${error.message || 'unknown error'}`);
    }
    
    console.log('✅ AI coaching report generated successfully');
    return data as AICoachingReportOut;
    
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      console.warn('⏱️ AI coaching report timed out');
      throw new Error(
        `Report generation timed out after ${COACHING_TIMEOUT / 1000} seconds. ` +
        'Please try again with a smaller scope or fewer evaluation responses.'
      );
    }
    
    if (err.message?.includes('503')) {
      throw new Error(
        'AI service is temporarily unavailable. This usually means the report is taking longer than expected to generate. ' +
        'Please try again in a moment, or reduce the scope of your request.'
      );
    }
    
    console.error('❌ Unexpected error in AI coaching report:', err);
    throw err;
  }
}

/**
 * Optimize coaching payload to reduce processing time and avoid timeouts
 */
function optimizeCoachingPayload(payload: AICoachingPayload): AICoachingPayload {
  const optimized = { ...payload };
  
  // Limit responses per attribute to most recent/relevant ones
  const MAX_RESPONSES_PER_ATTRIBUTE = 10;
  
  for (const [attributeName, attributeData] of Object.entries(optimized.attributes)) {
    if (attributeData.responses && attributeData.responses.length > MAX_RESPONSES_PER_ATTRIBUTE) {
      // Sort by recency and relevance, keep the most important ones
      const sortedResponses = attributeData.responses
        .sort((a, b) => {
          // Prioritize recent responses
          if (a.is_recent && !b.is_recent) return -1;
          if (!a.is_recent && b.is_recent) return 1;
          
          // Prioritize responses with specific tags
          const aHasTags = a.tags && a.tags.length > 0;
          const bHasTags = b.tags && b.tags.length > 0;
          if (aHasTags && !bHasTags) return -1;
          if (!aHasTags && bHasTags) return 1;
          
          // Sort by creation date (newest first)
          if (a.created_at && b.created_at) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          
          return 0;
        })
        .slice(0, MAX_RESPONSES_PER_ATTRIBUTE);
      
      optimized.attributes[attributeName] = {
        ...attributeData,
        responses: sortedResponses
      };
    }
  }
  
  console.log(`📊 Optimized payload: ${Object.keys(optimized.attributes).length} attributes, ` +
    `${Object.values(optimized.attributes).reduce((sum, attr) => sum + attr.responses.length, 0)} total responses`);
  
  return optimized;
}

