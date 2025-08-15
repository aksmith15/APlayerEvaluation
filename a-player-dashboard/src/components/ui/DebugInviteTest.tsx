// Temporary Debug Test Component
// Purpose: Test the debug function to understand environment variable issues
// Date: February 1, 2025

import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Button } from './Button';
import { Card } from './Card';

export const DebugInviteTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runDebugTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      console.log('Running debug test...');
      
      // First test the debug function
      const { data: debugData, error: debugError } = await supabase.functions.invoke('test-create-invite-debug', {
        body: {
          test: 'debug',
          company_id: 'test-company',
          email: 'test@example.com',
          role_to_assign: 'member'
        }
      });

      // Then test the step-by-step create-invite debug function with real data
      const { data: { user } } = await supabase.auth.getUser();
      const { data: peopleData } = await supabase
        .from('people')
        .select('company_id')
        .eq('email', user?.email)
        .eq('active', true)
        .single();

      let createInviteResult = null;
      let createInviteError = null;

      if (peopleData?.company_id) {
        console.log('Testing actual create-invite function with SMTP...');
        try {
          const response = await fetch(`https://tufjnccktzcbmaemekiz.supabase.co/functions/v1/create-invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              company_id: peopleData.company_id,
              email: 'debug-test@example.com',
              role_to_assign: 'member'
            })
          });

          const responseText = await response.text();
          console.log('Raw response:', responseText);
          
          try {
            createInviteResult = JSON.parse(responseText);
          } catch (parseError) {
            createInviteResult = { rawResponse: responseText, parseError: parseError.message };
          }
          
          if (!response.ok) {
            createInviteError = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (fetchError) {
          createInviteError = `Fetch error: ${fetchError.message}`;
          createInviteResult = null;
        }
      }

      // Test direct SMTP functionality
      console.log('Testing direct SMTP with Resend API...');
      let smtpTestResult = null;
      let smtpTestError = null;

      try {
        const smtpResponse = await fetch(`https://tufjnccktzcbmaemekiz.supabase.co/functions/v1/test-smtp-direct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        const smtpResponseText = await smtpResponse.text();
        console.log('SMTP test raw response:', smtpResponseText);
        
        try {
          smtpTestResult = JSON.parse(smtpResponseText);
        } catch (parseError) {
          smtpTestResult = { rawResponse: smtpResponseText, parseError: parseError.message };
        }
        
        if (!smtpResponse.ok) {
          smtpTestError = `HTTP ${smtpResponse.status}: ${smtpResponse.statusText}`;
        }
      } catch (fetchError) {
        smtpTestError = `Fetch error: ${fetchError.message}`;
        smtpTestResult = null;
      }

      const combinedResult = {
        debugTest: {
          success: !debugError,
          data: debugData,
          error: debugError?.message
        },
        createInviteTest: {
          success: !createInviteError,
          data: createInviteResult,
          error: createInviteError?.message,
          userCompany: peopleData?.company_id
        },
        smtpDirectTest: {
          success: !smtpTestError,
          data: smtpTestResult,
          error: smtpTestError
        }
      };

      console.log('Combined test results:', combinedResult);
      setResult(combinedResult);

    } catch (err: any) {
      console.error('Debug test failed:', err);
      setResult({ error: err.message, details: err });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-6 m-4">
      <h3 className="text-lg font-semibold mb-4">Debug Invite Function Test</h3>
      
      <Button 
        onClick={runDebugTest}
        disabled={testing}
        className="mb-4"
      >
        {testing ? 'Testing...' : 'Run Debug Test'}
      </Button>

      {result && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Test Results:</h4>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
};
