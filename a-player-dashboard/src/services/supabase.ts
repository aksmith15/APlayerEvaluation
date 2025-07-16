import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../constants/config';

// Validate Supabase configuration
const validateConfig = () => {
  console.log('Supabase Configuration Check:');
  console.log('URL:', SUPABASE_CONFIG.URL);
  console.log('ANON_KEY:', SUPABASE_CONFIG.ANON_KEY ? 'Present' : 'Missing');
  
  if (!SUPABASE_CONFIG.URL || SUPABASE_CONFIG.URL === 'your-supabase-url') {
    console.error('⚠️ Supabase URL is not configured properly');
  }
  
  if (!SUPABASE_CONFIG.ANON_KEY || SUPABASE_CONFIG.ANON_KEY === 'your-supabase-anon-key') {
    console.error('⚠️ Supabase ANON_KEY is not configured properly');
  }
  
  console.log('✅ Supabase configuration validated');
};

// Run validation
validateConfig();

// Supabase client configuration
export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error);
  } else {
    console.log('✅ Supabase connection successful');
  }
}).catch(err => {
  console.error('Failed to connect to Supabase:', err);
});

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