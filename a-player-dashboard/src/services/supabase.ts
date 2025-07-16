import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../constants/config';

// Supabase client configuration
export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY
);

// Type-safe database helpers
export type Database = {
  public: {
    Tables: {
      weighted_evaluation_scores: {
        Row: {
          evaluatee_id: string;
          evaluatee_name: string;
          quarter_id: string;
          quarter_name: string;
          quarter_start_date: string;
          quarter_end_date: string;
          attribute_name: string;
          manager_score: number;
          peer_score: number;
          self_score: number;
          weighted_final_score: number;
          has_manager_eval: boolean;
          has_peer_eval: boolean;
          has_self_eval: boolean;
          completion_percentage: number;
        };
      };
      app_config: {
        Row: {
          id: number;
          key: string;
          value: string;
          environment: string;
          created_at: string;
        };
      };
      people: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: string;
          active: boolean;
          person_description: string | null;
          manager_notes: string | null;
          department: string;
          hire_date: string;
          created_at: string;
        };
      };
      evaluation_cycles: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          created_at: string;
        };
      };
    };
  };
}; 