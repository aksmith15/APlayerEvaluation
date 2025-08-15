// Direct SMTP Test Function
// Purpose: Test Resend SMTP directly without Supabase auth
// Date: February 1, 2025

import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Testing direct Resend API...')
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Test Resend API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'A-Player Evaluations <info@theculturebase.com>',
        to: ['kolbes@ridgelineei.com'], // Your email for testing
        subject: 'SMTP Test - A-Player Evaluations',
        html: `
          <h2>SMTP Test Successful!</h2>
          <p>This email was sent directly through Resend API to test the SMTP configuration.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Domain:</strong> theculturebase.com</p>
          <p><strong>Status:</strong> Custom SMTP is working correctly!</p>
        `
      })
    })

    const result = await response.json()
    console.log('Resend API response:', result)

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Resend API failed', 
          status: response.status,
          details: result 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Direct Resend API test successful',
        emailId: result.id,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('SMTP test error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'SMTP test failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
