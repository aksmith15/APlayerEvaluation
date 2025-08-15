// TypeScript Database Types
// Generated on 2025-08-15 14:38:26 (Windows PowerShell mode)

// TODO: Generate actual types with Supabase CLI
// Run: npm install -g supabase
// Then: supabase gen types typescript --local > src/lib/database.types.ts

export type Database = {
  // TODO: Generated types will appear here
  // This project uses multi-tenant PostgreSQL schema
  // Key entities: companies, profiles, people, evaluations, submissions
};

// Placeholder types based on codebase analysis
export interface Company {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  company_id: string;
}

// For complete types, use Supabase CLI type generation
