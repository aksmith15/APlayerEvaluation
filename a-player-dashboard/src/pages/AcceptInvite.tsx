// AcceptInvite Page Component
// Purpose: Redirect users to registration for new user onboarding flow
// Date: February 1, 2025

import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui';

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    console.log('AcceptInvite: Redirecting to registration flow with token:', !!token);
    
    if (!token) {
      console.error('No token found in URL, redirecting to login');
      navigate('/login?error=invalid_invite');
      return;
    }

    // Redirect to the new registration flow
    navigate(`/register-from-invite?token=${token}`);
  }, [token, navigate]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h2 className="text-xl font-semibold mt-4 mb-2">Processing Invitation</h2>
        <p className="text-gray-600">Redirecting to registration...</p>
      </div>
    </div>
  );
};

export default AcceptInvite;
