// Shared CORS headers for Edge Functions
// Purpose: Allow cross-origin requests from the frontend application
// Date: February 1, 2025

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
