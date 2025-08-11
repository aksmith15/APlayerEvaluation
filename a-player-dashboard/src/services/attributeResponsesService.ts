import { supabase } from './supabase';

export interface AttributeResponse {
  attribute_name: string;
  submission_id: string;
  evaluation_type?: 'self'|'peer'|'manager';
  question_id?: string;
  question_text?: string;
  response_type?: string;
  response_value?: unknown;
  created_at?: string;
}

export async function fetchAttributeResponses(
  employeeId: string,
  quarterId: string
): Promise<AttributeResponse[]> {
  const { data, error } = await supabase
    .from('attribute_responses')
    .select(`
      attribute_name,
      question_id,
      question_text,
      response_type,
      response_value,
      created_at,
      submission_id,
      submissions!inner(evaluatee_id, quarter_id, evaluation_type)
    `)
    .eq('submissions.evaluatee_id', employeeId)
    .eq('submissions.quarter_id', quarterId);

  if (error) {
    console.error('Error fetching attribute responses:', error);
    return [];
  }

  return (data || []).map((r: any) => ({
    attribute_name: r.attribute_name,
    question_id: r.question_id,
    question_text: r.question_text,
    response_type: r.response_type,
    response_value: r.response_value,
    created_at: r.created_at,
    submission_id: r.submission_id,
    evaluation_type: r.submissions?.evaluation_type as any
  }));
}

