// RegisterFromInvite Page Component
// Purpose: Handle user registration during invite acceptance
// Date: February 1, 2025

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner, Button, Card } from '../components/ui';
import { 
  getInviteData, 
  registerUserFromInvite, 
  uploadProfilePicture,
  type InviteData,
  type RegistrationData 
} from '../services/registrationService';
import { supabase } from '../services/supabase';

interface RegistrationState {
  status: 'loading' | 'ready' | 'submitting' | 'success' | 'error';
  message: string;
  error?: string;
}

const RegisterFromInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [state, setState] = useState<RegistrationState>({
    status: 'loading',
    message: 'Validating invitation...'
  });
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: '',
    password: '',
    profilePictureUrl: undefined
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string;
  }>({ score: 0, feedback: '' });

  const token = searchParams.get('token');

  useEffect(() => {
    // Handle both action_link flow (user already authenticated) and token flow
    handleInviteFlow();
  }, []);

  const handleInviteFlow = async () => {
    try {
      // Check if user is already authenticated (action_link flow)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('User already authenticated. Email:', session.user.email);
        console.log('User metadata:', session.user.user_metadata);
        
        // Check if this session was created via invite (has invite metadata)
        const inviteMetadata = session.user.user_metadata;
        
        if (inviteMetadata?.company_id && inviteMetadata?.role_to_assign) {
          console.log('Found invite metadata in session:', inviteMetadata);
          
          // Construct invite data from session metadata
          const inviteFromSession: InviteData = {
            id: 'action-link',
            token: 'action-link',
            email: session.user.email!,
            company_id: inviteMetadata.company_id,
            role_to_assign: inviteMetadata.role_to_assign,
            position: inviteMetadata.position,
            jwt_role: inviteMetadata.jwt_role,
            inviter_name: inviteMetadata.inviter_name,
            companies: {
              name: inviteMetadata.company_name || 'Your Company'
            }
          };
          
          setInviteData(inviteFromSession);
          
          // Try to complete the invite acceptance automatically
          setState({
            status: 'submitting',
            message: 'Completing your invitation...'
          });
          
          const result = await completeInviteAcceptance(inviteFromSession);
          if (result.success) {
            setState({
              status: 'success',
              message: `Welcome to ${inviteFromSession.companies.name}! Your account has been set up successfully.`
            });
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
            return;
          } else {
            // If auto-completion fails, show error
            setState({
              status: 'error',
              message: 'Failed to complete invitation',
              error: result.error
            });
            return;
          }
        } else {
          console.log('Session found but no invite metadata. This might be an existing user.');
          console.log('Checking for token-based flow...');
          // Fall back to token flow
          await loadInviteDataFromToken();
        }
      } else {
        console.log('No authenticated session, checking for token...');
        // No session, use token flow
        await loadInviteDataFromToken();
      }
    } catch (error: any) {
      console.error('Error handling invite flow:', error);
      setState({
        status: 'error',
        message: 'Failed to process invitation',
        error: error.message
      });
    }
  };

  const loadInviteDataFromToken = async () => {
    if (!token) {
      setState({
        status: 'error',
        message: 'Invalid invitation link',
        error: 'No invitation token found in the URL'
      });
      return;
    }

    await loadInviteData();
  };

  const loadInviteData = async () => {
    if (!token) return;

    try {
      const invite = await getInviteData(token);
      
      if (!invite) {
        setState({
          status: 'error',
          message: 'Invalid or expired invitation',
          error: 'This invitation link is not valid, has expired, or has already been used.'
        });
        return;
      }

      setInviteData(invite);
      setState({
        status: 'ready',
        message: 'Please complete your registration'
      });

    } catch (error: any) {
      console.error('Failed to load invite data:', error);
      setState({
        status: 'error',
        message: 'Failed to validate invitation',
        error: error.message
      });
    }
  };

  const completeInviteAcceptance = async (inviteData: InviteData) => {
    try {
      // Get the current session to include auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No session available for invite acceptance');
        return { success: false, error: 'No authentication session available' };
      }

      console.log('🔍 DEBUG: Session info:', {
        userEmail: session.user?.email,
        inviteEmail: inviteData.email,
        hasAccessToken: !!session.access_token,
        userMetadata: session.user?.user_metadata
      });

      console.log('Calling accept-invite-v2 with session for user:', session.user?.email);
      console.log('Invite is for:', inviteData.email);

      // Call accept-invite-v2 directly since user is already authenticated via action_link
      const { data: result, error } = await supabase.functions.invoke('accept-invite-v2', {
        body: {
          token: inviteData.token === 'action-link' ? 'action-link-metadata' : inviteData.token
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Accept invite error:', error);
        console.error('Full error object:', error);
        return { success: false, error: error.message };
      }

      if (result?.error) {
        console.error('Accept invite failed:', result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ Invite acceptance completed successfully');
      return { success: true, result };
    } catch (error: any) {
      console.error('Complete invite acceptance error:', error);
      return { success: false, error: error.message };
    }
  };

  const validatePassword = (password: string) => {
    let score = 0;
    let feedback = '';

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Very weak password';
        break;
      case 2:
        feedback = 'Weak password';
        break;
      case 3:
        feedback = 'Fair password';
        break;
      case 4:
        feedback = 'Strong password';
        break;
      case 5:
        feedback = 'Very strong password';
        break;
    }

    setPasswordStrength({ score, feedback });
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    validatePassword(password);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }
      setProfileFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData) return;

    // Validation
    if (!formData.fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 2) {
      if (!confirm('Your password is weak. Continue anyway?')) {
        return;
      }
    }

    setState({
      status: 'submitting',
      message: 'Creating your account...'
    });

    try {
      let profilePictureUrl = undefined;
      
      // Upload profile picture if provided
      if (profileFile) {
        setState({
          status: 'submitting',
          message: 'Uploading profile picture...'
        });
        
        // We'll need a temp user ID for upload, so we'll handle this differently
        // For now, we'll register first then update with picture
      }

      setState({
        status: 'submitting',
        message: 'Creating your account...'
      });

      const result = await registerUserFromInvite(inviteData, {
        ...formData,
        profilePictureUrl
      });

      if (!result.success) {
        setState({
          status: 'error',
          message: 'Registration failed',
          error: result.error
        });
        return;
      }

      // Handle profile picture upload after user creation
      if (profileFile && result.user) {
        setState({
          status: 'submitting',
          message: 'Uploading profile picture...'
        });

        const uploadedUrl = await uploadProfilePicture(profileFile, result.user.id);
        if (uploadedUrl) {
          console.log('✅ Profile picture uploaded:', uploadedUrl);
          
          // Update the people table with the profile picture URL
          try {
            const { error: updateError } = await supabase
              .from('people')
              .update({ profile_picture_url: uploadedUrl })
              .eq('email', result.user.email);
              
            if (updateError) {
              console.error('Failed to update profile picture in people table:', updateError);
            } else {
              console.log('✅ People table updated with profile picture URL');
            }
          } catch (error) {
            console.error('Error updating people table:', error);
          }
        } else {
          console.error('Profile picture upload failed');
        }
      }

      setState({
        status: 'success',
        message: `Welcome to ${inviteData.companies.name}! Your account has been created successfully.`
      });

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate(result.redirectTo || '/dashboard');
      }, 3000);

    } catch (error: any) {
      console.error('Registration failed:', error);
      setState({
        status: 'error',
        message: 'Registration failed',
        error: error.message
      });
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Loading state
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold mt-4 mb-2">Validating Invitation</h2>
            <p className="text-gray-600">{state.message}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (state.status === 'error') {
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
            
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
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
            
            <Button onClick={() => navigate('/dashboard')} className="w-full">
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

  // Registration form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You've been invited to join <strong>{inviteData?.companies.name}</strong>
          </p>
          {inviteData?.inviter_name && (
            <p className="text-center text-sm text-gray-500">
              by {inviteData.inviter_name}
            </p>
          )}
        </div>

        <Card className="p-6">
          {/* Invitation details */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Invitation Details</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Email:</strong> {inviteData?.email}</p>
              <p><strong>Company Role:</strong> {inviteData?.role_to_assign}</p>
              {inviteData?.position && (
                <p><strong>Position:</strong> {inviteData.position}</p>
              )}
              {inviteData?.jwt_role && (
                <p><strong>Admin Access:</strong> {inviteData.jwt_role}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
                required
                disabled={state.status === 'submitting'}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Choose a strong password"
                required
                disabled={state.status === 'submitting'}
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{passwordStrength.feedback}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
                required
                disabled={state.status === 'submitting'}
              />
              {confirmPassword && formData.password !== confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Profile Picture */}
            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture (Optional)
              </label>
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={state.status === 'submitting'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                state.status === 'submitting' || 
                !formData.fullName.trim() || 
                !formData.password || 
                !confirmPassword ||
                formData.password !== confirmPassword
              }
              className="w-full"
            >
              {state.status === 'submitting' ? state.message : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterFromInvite;
