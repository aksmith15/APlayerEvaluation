// Application configuration constants

export const APP_CONFIG = {
  TITLE: 'A-Player Evaluations Dashboard',
  DESCRIPTION: 'Quarterly employee evaluation data visualization',
  VERSION: '1.0.0'
} as const;

export const SUPABASE_CONFIG = {
  URL: import.meta.env.VITE_SUPABASE_URL || 'https://tufjnccktzcbmaemekiz.supabase.co',
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZmpuY2NrdHpjYm1hZW1la2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MDMwODMsImV4cCI6MjA2ODA3OTA4M30.XjhFQkkByu3-NC47HUOH8ESA6z1u3xDBssqkpAGMwg4'
} as const;

export const API_ENDPOINTS = {
  WEBHOOK_CONFIG_KEY: 'n8n_webhook_url'
} as const;

export const ROUTES = {
  LOGIN: '/',
  EMPLOYEE_SELECTION: '/employees',
  EMPLOYEE_ANALYTICS: '/analytics'
} as const; 