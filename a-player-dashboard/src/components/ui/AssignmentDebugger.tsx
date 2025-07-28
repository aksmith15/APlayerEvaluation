import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Button } from './Button';
import { Card } from './Card';

interface DebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

export const AssignmentDebugger: React.FC = () => {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);
    const testResults: DebugResult[] = [];

    try {
      // Step 1: Check current auth user
      console.log('🔍 Step 1: Checking current auth user...');
      const { data: authData, error: authError } = await supabase.auth.getUser();
      testResults.push({
        step: 'Auth User Check',
        success: !authError,
        data: authData?.user ? {
          id: authData.user.id,
          email: authData.user.email,
          user_metadata: authData.user.user_metadata,
          app_metadata: authData.user.app_metadata
        } : null,
        error: authError?.message
      });

      if (authError || !authData?.user) {
        setResults(testResults);
        setTesting(false);
        return;
      }

      // Step 2: Check user in people table
      console.log('🔍 Step 2: Checking user in people table...');
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('id, email, name, role, jwt_role')
        .eq('email', authData.user.email)
        .single();

      testResults.push({
        step: 'People Table Check',
        success: !peopleError,
        data: peopleData,
        error: peopleError?.message
      });

      // Step 3: Test direct RLS policy query
      console.log('🔍 Step 3: Testing RLS policy condition...');
      const { data: rlsTest, error: rlsError } = await supabase
        .rpc('test_admin_policy', {
          test_email: authData.user.email
        })
        .single();

      // If the RPC doesn't exist, create a simpler test
      if (rlsError?.code === '42883') {
        // Test with a simple query that mimics the RLS condition
        const { data: simpleRlsTest, error: simpleRlsError } = await supabase
          .from('people')
          .select('id, email, jwt_role')
          .eq('email', authData.user.email)
          .in('jwt_role', ['super_admin', 'hr_admin'])
          .single();

        testResults.push({
          step: 'RLS Policy Simulation',
          success: !simpleRlsError && simpleRlsTest?.jwt_role,
          data: simpleRlsTest,
          error: simpleRlsError?.message
        });
      } else {
        testResults.push({
          step: 'RLS Policy Test',
          success: !rlsError,
          data: rlsTest,
          error: rlsError?.message
        });
      }

      // Step 3.5: Test the RLS debug function (if it exists)
      console.log('🔍 Step 3.5: Testing RLS debug function...');
      const { data: rlsDebugTest, error: rlsDebugError } = await supabase
        .rpc('test_assignment_rls_debug')
        .single();

      if (rlsDebugError?.code === '42883') {
        // Function doesn't exist, test manually
        const { data: conditionTest, error: conditionError } = await supabase
          .from('people')
          .select('email, jwt_role')
          .eq('email', authData.user.email)
          .in('jwt_role', ['super_admin', 'hr_admin']);

        testResults.push({
          step: 'Manual RLS Condition Test',
          success: !conditionError && conditionTest && conditionTest.length > 0,
          data: {
            query_email: authData.user.email,
            found_records: conditionTest?.length || 0,
            matching_record: conditionTest?.[0] || null,
            note: 'Run fix-assignment-rls-policy.sql to get detailed JWT debugging'
          },
          error: conditionError?.message
        });
      } else {
        testResults.push({
          step: 'RLS Debug Function Test',
          success: !rlsDebugError && !!(rlsDebugTest as any)?.can_insert_test,
          data: rlsDebugTest,
          error: rlsDebugError?.message
        });
      }

      // Step 4: Test evaluation_assignments table access
      console.log('🔍 Step 4: Testing evaluation_assignments table access...');
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('evaluation_assignments')
        .select('id, evaluator_id, evaluatee_id')
        .limit(1);

      testResults.push({
        step: 'Assignments Table Read',
        success: !assignmentsError,
        data: assignmentsData ? `Found ${assignmentsData.length} records` : 'No records',
        error: assignmentsError?.message
      });

      // Step 5: Test a simple insert (we'll roll it back)
      console.log('🔍 Step 5: Testing assignment insert permissions...');
      
      // Get some test data first
      const { data: quarters } = await supabase
        .from('evaluation_cycles')
        .select('id')
        .limit(1);

      const { data: people } = await supabase
        .from('people')
        .select('id')
        .eq('active', true)
        .limit(2);

      if (quarters && quarters.length > 0 && people && people.length >= 2) {
        // Try to insert a test assignment
        const testAssignment = {
          evaluator_id: people[0].id,
          evaluatee_id: people[1].id,
          quarter_id: quarters[0].id,
          evaluation_type: 'peer',
          status: 'pending',
          assigned_by: peopleData?.id || authData.user.id
        };

        const { data: insertData, error: insertError } = await supabase
          .from('evaluation_assignments')
          .insert([testAssignment])
          .select()
          .single();

        testResults.push({
          step: 'Assignment Insert Test',
          success: !insertError,
          data: insertData ? 'Insert successful' : null,
          error: insertError?.message
        });

        // Clean up - delete the test assignment if it was created
        if (insertData) {
          await supabase
            .from('evaluation_assignments')
            .delete()
            .eq('id', insertData.id);
        }
      } else {
        testResults.push({
          step: 'Assignment Insert Test',
          success: false,
          error: 'Insufficient test data (need quarters and people)'
        });
      }

      // Step 6: Check JWT token claims directly
      console.log('🔍 Step 6: Checking JWT token claims...');
      const { data: session } = await supabase.auth.getSession();
      testResults.push({
        step: 'JWT Session Check',
        success: !!session.session,
        data: session.session ? {
          expires_at: session.session.expires_at,
          token_type: session.session.token_type,
          access_token_preview: session.session.access_token?.substring(0, 50) + '...'
        } : null,
        error: !session.session ? 'No active session' : undefined
      });

    } catch (error) {
      testResults.push({
        step: 'Diagnostic Error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const refreshToken = async () => {
    try {
      console.log('🔄 Refreshing authentication token...');
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Token refresh failed:', error);
      } else {
        console.log('✅ Token refreshed successfully');
        // Re-run diagnostics after refresh
        setTimeout(runDiagnostics, 1000);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Assignment Creation Debugger</h3>
        <div className="space-x-2">
          <Button
            onClick={refreshToken}
            variant="secondary"
            size="sm"
          >
            Refresh Token
          </Button>
          <Button
            onClick={runDiagnostics}
            disabled={testing}
            size="sm"
          >
            {testing ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Diagnostic Results:</h4>
          {results.map((result, index) => (
            <div key={index} className={`p-3 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✅' : '❌'}
                </span>
                <span className="font-medium">{result.step}</span>
              </div>
              
              {result.data && (
                <div className="mt-2 text-sm">
                  <strong>Data:</strong>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {typeof result.data === 'string' 
                      ? result.data 
                      : JSON.stringify(result.data, null, 2)
                    }
                  </pre>
                </div>
              )}
              
              {result.error && (
                <div className="mt-2 text-sm text-red-600">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <strong>What this tests:</strong>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>Current authentication status and JWT token</li>
          <li>User record in people table with jwt_role</li>
          <li>RLS policy condition simulation</li>
          <li>Table read permissions</li>
          <li>Assignment insert permissions (with cleanup)</li>
          <li>JWT session validity</li>
        </ul>
      </div>
    </Card>
  );
}; 