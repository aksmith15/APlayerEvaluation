// AcceptInvite Page Component
// Purpose: Handle invite acceptance after user clicks email link
// Uses: New invite system with token validation + automatic company membership
// Date: February 1, 2025

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner, Button, Card } from '../components/ui';

interface AcceptInviteState {
  status: 'loading' | 'success' | 'error' | 'login_required';
  message: string;
  companyName?: string;
  assignedRole?: string;
  redirectUrl?: string;
  error?: string;
}

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [state, setState] = useState<AcceptInviteState>({
    status: 'loading',
    message: 'Processing invitation...'
  });

  const token = searchParams.get('token');

  // Debug logging
  console.log('AcceptInvite component loaded', { token, user: !!user, authLoading });

  useEffect(() => {
    console.log('AcceptInvite useEffect triggered', { token, user: !!user, authLoading });
    
    // Wait for auth to initialize
    if (authLoading) {
      console.log('Still loading auth...');
      return;
    }

    if (!token) {
      console.log('No token found in URL');
      setState({
        status: 'error',
        message: 'Invalid invitation link',
        error: 'No invitation token found in the URL'
      });
      return;
    }

    if (!user) {
      console.log('User not authenticated, showing login required');
      setState({
        status: 'login_required',
        message: 'Please log in to accept this invitation',
        error: 'You must be logged in to accept a company invitation'
      });
      return;
    }

    // User is authenticated, process the invite
    console.log('User authenticated, processing invite');
    acceptInvitation();
  }, [token, user, authLoading]);

  const acceptInvitation = async () => {
    if (!token || !user) return;

    try {
      setState({
        status: 'loading',
        message: 'Accepting invitation...'
      });

      // Get current session to ensure auth headers are included
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        setState({
          status: 'login_required',
          message: 'Please log in to accept this invitation',
          error: 'Authentication session expired'
        });
        return;
      }

      // Call accept-invite-v2 Edge Function with explicit auth (test version)
      const { data, error } = await supabase.functions.invoke('accept-invite-v2', {
        body: { token },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        setState({
          status: 'error',
          message: 'Failed to accept invitation',
          error: data.error
        });
        return;
      }

      // Success!
      setState({
        status: 'success',
        message: data.message || 'Welcome to the company!',
        companyName: data.company_name,
        assignedRole: data.assigned_role,
        redirectUrl: data.redirect_to || '/dashboard'
      });

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate(data.redirect_to || '/dashboard');
      }, 3000);

    } catch (err: any) {
      console.error('Invite acceptance failed:', err);
      
      let errorMessage = 'Failed to accept invitation';
      let specificError = err.message;

      // Handle specific error cases
      if (err.message?.includes('unauthorized')) {
        setState({
          status: 'login_required',
          message: 'Please log in to accept this invitation',
          error: 'Authentication required'
        });
        return;
      }

      if (err.message?.includes('expired')) {
        errorMessage = 'This invitation has expired';
        specificError = 'Please request a new invitation from your company administrator';
      } else if (err.message?.includes('already been used')) {
        errorMessage = 'This invitation has already been used';
        specificError = 'You may already have access to this company';
      } else if (err.message?.includes('email mismatch')) {
        errorMessage = 'Email address mismatch';
        specificError = 'This invitation is for a different email address';
      }

      setState({
        status: 'error',
        message: errorMessage,
        error: specificError
      });
    }
  };

  const handleLoginRedirect = () => {
    // Save the current URL to redirect back after login
    const currentUrl = window.location.href;
    sessionStorage.setItem('redirectAfterLogin', currentUrl);
    navigate('/login');
  };

  const handleRetry = () => {
    acceptInvitation();
  };

  const handleGoToDashboard = () => {
    navigate(state.redirectUrl || '/dashboard');
  };

  // Loading state
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold mt-4 mb-2">Processing Invitation</h2>
            <p className="text-gray-600">{state.message}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Login required state
  if (state.status === 'login_required') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-4">{state.message}</p>
            
            {state.error && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
                {state.error}
              </div>
            )}
            
            <Button onClick={handleLoginRedirect} className="w-full">
              Go to Login
            </Button>
            
            <p className="text-sm text-gray-500 mt-3">
              You'll be redirected back here after logging in
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Success state
  if (state.status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-green-600 mb-2">Welcome!</h2>
            <p className="text-gray-600 mb-4">{state.message}</p>
            
            {state.companyName && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm">
                  <strong>Company:</strong> {state.companyName}
                </p>
                {state.assignedRole && (
                  <p className="text-sm">
                    <strong>Role:</strong> {state.assignedRole}
                  </p>
                )}
              </div>
            )}
            
            <Button onClick={handleGoToDashboard} className="w-full">
              Go to Dashboard
            </Button>
            
            <p className="text-sm text-gray-500 mt-3">
              Redirecting automatically in a few seconds...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-red-600 mb-2">Invitation Error</h2>
          <p className="text-gray-600 mb-4">{state.message}</p>
          
          {state.error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {state.error}
            </div>
          )}
          
          <div className="space-y-2">
            <Button onClick={handleRetry} variant="secondary" className="w-full">
              Try Again
            </Button>
            <Button onClick={() => navigate('/login')} variant="ghost" className="w-full">
              Go to Login
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-3">
            If the problem persists, contact your company administrator
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AcceptInvite;
