import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { refreshAuthToken } from '../../services/authService';

interface AuthTestResults {
  authUser?: any;
  userInPeople?: any;
  storageAccess?: boolean;
  notesAccess?: boolean;
  error?: string;
}

export const AuthenticationTest: React.FC = () => {
  const [results, setResults] = useState<AuthTestResults | null>(null);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleTokenRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Attempting token refresh...');
      const success = await refreshAuthToken();
      if (success) {
        console.log('✅ Token refresh successful - running auth test');
        await runAuthTest();
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const runAuthTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      console.log('🧪 Running frontend authentication test...');
      
      // Test 1: Get current auth user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('Auth user:', authData?.user);
      
      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      // Test 2: Check if user exists in people table
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('id, email, role, jwt_role')
        .eq('email', authData?.user?.email || '')
        .single();
      
      console.log('User in people table:', peopleData);
      if (peopleError) {
        console.log('People table error:', peopleError);
      }
      
      // Test 2.5: Check JWT token contents
      console.log('JWT Token Details:', {
        'User metadata': authData?.user?.user_metadata,
        'App metadata': authData?.user?.app_metadata,
        'Full user object': authData?.user
      });

      // Test 3: Test storage access (list buckets)
      const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('Storage buckets:', bucketsData);
      
      // Test 4: Test notes table access
      const { data: notesData, error: notesError } = await supabase
        .from('employee_quarter_notes')
        .select('*', { count: 'exact', head: true });
      
      console.log('Notes access test:', notesData);

      setResults({
        authUser: authData?.user,
        userInPeople: peopleData,
        storageAccess: !bucketsError,
        notesAccess: !notesError,
      });

    } catch (error: any) {
      console.error('Authentication test failed:', error);
      setResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-blue-800 font-semibold mb-3">🔍 Frontend Authentication Test</h3>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={runAuthTest}
          disabled={testing || refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run Authentication Test'}
        </button>
        <button
          onClick={handleTokenRefresh}
          disabled={testing || refreshing}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh JWT Token'}
        </button>
      </div>

      {results && (
        <div className="space-y-3 text-sm">
          {results.error ? (
            <div className="text-red-700 bg-red-100 p-2 rounded">
              ❌ Error: {results.error}
            </div>
          ) : (
            <>
              <div className="text-green-700">
                ✅ <strong>Auth User:</strong> {results.authUser?.email || 'Not found'}
              </div>
              <div className="text-green-700">
                ✅ <strong>People Table Role:</strong> {results.userInPeople?.role || 'Not found'}
              </div>
              <div className="text-green-700">
                ✅ <strong>People Table JWT Role:</strong> {results.userInPeople?.jwt_role || 'Not found'}
              </div>
              <div className="text-green-700">
                ✅ <strong>JWT App Metadata:</strong> {JSON.stringify(results.authUser?.app_metadata) || 'Not found'}
              </div>
              <div className="text-green-700">
                ✅ <strong>Storage Access:</strong> {results.storageAccess ? 'Working' : 'Failed'}
              </div>
              <div className="text-green-700">
                ✅ <strong>Notes Access:</strong> {results.notesAccess ? 'Working' : 'Failed'}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 