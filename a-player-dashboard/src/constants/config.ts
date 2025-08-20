// Application configuration constants

export const APP_CONFIG = {
  TITLE: 'A-Player Evaluations',
  DESCRIPTION: 'Quarterly employee evaluation data visualization',
  VERSION: '1.0.0'
} as const;

export const SUPABASE_CONFIG = {
  URL: import.meta.env.VITE_SUPABASE_URL || 'https://tufjnccktzcbmaemekiz.supabase.co',
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
} as const;

export const FEATURES = {
  AI_INSIGHTS_ENABLED: true, // ENABLED: AI functions are now fixed and working
  DEBUG_TABS: true // Controls visibility of debug functionality in Manager Dashboard
} as const;

export const API_ENDPOINTS = {
  WEBHOOK_CONFIG_KEY: 'n8n_webhook_url'
} as const;

export const ROUTES = {
  LOGIN: '/',
  EMPLOYEE_SELECTION: '/employees',
  EMPLOYEE_ANALYTICS: '/analytics',
  ASSIGNMENT_MANAGEMENT: '/assignments/manage',
  MY_ASSIGNMENTS: '/assignments/my',
  EVALUATION_SURVEY: '/survey/:token'
} as const; 