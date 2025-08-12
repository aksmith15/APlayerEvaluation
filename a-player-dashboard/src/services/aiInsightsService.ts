/**
 * AI Insights Service
 * Handles fetching AI-generated insights for strengths and development areas
 * Uses Supabase Edge Functions for secure AI integration
 */

import { supabase } from './supabase';
import { FEATURES } from '../constants/config';
import type { TenureCategory } from '../utils/calculations';

// Input interfaces for AI insight requests
export interface AIInsightsEmployee {
  name: string;
  department: string;
  tenure_category: TenureCategory;
  role: string;
  id: string;
}

export interface AIInsightsAttribute {
  name: string;
  score: number;
  category: 'competence' | 'character' | 'curiosity';
}

export interface AIInsightsRequest {
  employee: AIInsightsEmployee;
  quarter: string;
  attributes: AIInsightsAttribute[];
  insight_type: 'strengths' | 'development';
}

// Output interfaces for AI insight responses
export interface AIInsightItem {
  attribute_name: string;
  recommendation: string; // Max 3 sentences
}

export interface AIInsightsResponse {
  insights: AIInsightItem[];
}

/**
 * Fetch AI-generated insights for strengthening existing strong attributes
 * @param employee Employee data with department and tenure context
 * @param attributes Array of strong attributes (score >= 8.0)
 * @returns Promise<AIInsightsResponse> AI recommendations for leveraging strengths
 */
export async function fetchStrengthsInsights(
  employee: AIInsightsEmployee,
  attributes: AIInsightsAttribute[]
): Promise<AIInsightsResponse> {
  console.log('🔍 fetchStrengthsInsights called, AI_INSIGHTS_ENABLED:', FEATURES.AI_INSIGHTS_ENABLED);
  
  if (!FEATURES.AI_INSIGHTS_ENABLED) {
    console.debug('AI insights disabled via feature flag; returning empty strengths insights');
    return { insights: [] };
  }
  if (!attributes || attributes.length === 0) {
    return { insights: [] };
  }

  // Primary path: call multiplexed working function with insights payload
  const insightsPayload = {
    employee,
    quarter: 'current',
    attributes,
    insight_type: 'strengths' as const
  };

  try {
    console.log('🔍 Calling ai-strengths-insights function');
    
    // Get user session for proper authentication
    const { data: sess } = await supabase.auth.getSession();
    const jwt = sess?.session?.access_token;

    const { data, error } = await supabase.functions.invoke('ai-strengths-insights', {
      body: insightsPayload,
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
    });

    if (error) {
      console.error('❌ AI Strengths Insights failed:', {
        error,
        message: error.message,
        details: error.details || 'No details available',
        payload: insightsPayload
      });
      return { insights: [] };
    }

    console.log('✅ AI STRENGTHS INSIGHTS RESPONSE:', data);

    return data as AIInsightsResponse;
  } catch (error) {
    console.error('Error fetching strengths insights (graceful fallback to empty):', error);
    return { insights: [] };
  }
}

/**
 * Fetch AI-generated insights for improving weak attributes
 * @param employee Employee data with department and tenure context
 * @param attributes Array of development attributes (score < 8.0)
 * @returns Promise<AIInsightsResponse> AI recommendations for improvement
 */
export async function fetchDevelopmentInsights(
  employee: AIInsightsEmployee,
  attributes: AIInsightsAttribute[]
): Promise<AIInsightsResponse> {
  console.log('🔍 fetchDevelopmentInsights called, AI_INSIGHTS_ENABLED:', FEATURES.AI_INSIGHTS_ENABLED);
  if (!FEATURES.AI_INSIGHTS_ENABLED) {
    console.debug('AI insights disabled via feature flag; returning empty development insights');
    return { insights: [] };
  }
  if (!attributes || attributes.length === 0) {
    return { insights: [] };
  }

  // Primary path: call multiplexed working function with insights payload
  const insightsPayload = {
    employee,
    quarter: 'current',
    attributes,
    insight_type: 'development' as const
  };

  try {
    console.log('🔍 Calling ai-development-insights function');
    
    // Get user session for proper authentication
    const { data: sess } = await supabase.auth.getSession();
    const jwt = sess?.session?.access_token;

    const { data, error } = await supabase.functions.invoke('ai-development-insights', {
      body: insightsPayload,
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
    });

    if (error) {
      console.error('❌ AI Development Insights failed:', {
        error,
        message: error.message,
        details: error.details || 'No details available',
        payload: insightsPayload
      });
      return { insights: [] };
    }

    console.log('✅ AI DEVELOPMENT INSIGHTS RESPONSE:', data);

    return data as AIInsightsResponse;
  } catch (error) {
    console.error('Error fetching development insights (graceful fallback to empty):', error);
    return { insights: [] };
  }
}

/**
 * Helper function to transform core group breakdown into AI insights format
 * @param coreGroupBreakdown Core group data from PDF data service
 * @param scoreThreshold Minimum score threshold (8.0 for strengths, <8.0 for development)
 * @param isStrengths Whether to filter for strengths (>=threshold) or development (<threshold)
 * @returns AIInsightsAttribute[] Formatted attributes for AI processing
 */
export function transformAttributesForAI(
  coreGroupBreakdown: any,
  scoreThreshold: number = 8.0,
  isStrengths: boolean = true
): AIInsightsAttribute[] {
  if (!coreGroupBreakdown) {
    return [];
  }

  const attributes: AIInsightsAttribute[] = [];
  const seen = new Set<string>();

  // Process each core group
  const groups = [
    { data: coreGroupBreakdown.competence, category: 'competence' as const },
    { data: coreGroupBreakdown.character, category: 'character' as const },
    { data: coreGroupBreakdown.curiosity, category: 'curiosity' as const }
  ];

  for (const group of groups) {
    if (!group.data?.attributes) continue;

    for (const attr of group.data.attributes) {
      const name: string = attr.attributeName || attr.attribute || '';
      const score: number = (attr.scores?.weighted ?? attr.weighted) || 0;

      if (name) {
        const key = name.toLowerCase().replace(/\s+/g, ' ').trim();
        if (!seen.has(key)) {
          // Filter based on isStrengths flag and threshold
          const includeAttribute = isStrengths 
            ? score >= scoreThreshold 
            : score < scoreThreshold;

          if (includeAttribute) {
            attributes.push({
              name,
              score,
              category: group.category
            });
          }
          seen.add(key);
        }
      }
    }
  }

  return attributes;
}

/**
 * Helper function to find AI insight for a specific attribute
 * @param attributeName Name of the attribute to find insight for
 * @param aiInsights AI insights response from the service
 * @returns string | null The recommendation text or null if not found
 */
export function getInsightForAttribute(
  attributeName: string,
  aiInsights?: AIInsightsResponse
): string | null {
  if (!aiInsights?.insights) {
    return null;
  }

  const normalizedName = attributeName.toLowerCase().trim();
  const insight = aiInsights.insights.find(item => 
    item.attribute_name.toLowerCase().trim() === normalizedName
  );

  return insight?.recommendation || null;
}
