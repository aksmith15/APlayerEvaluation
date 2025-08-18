// User Registration Service
// Purpose: Handle complete user registration during invite acceptance
// Date: February 1, 2025

import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

export interface RegistrationData {
  fullName: string;
  password: string;
  profilePictureUrl?: string;
}

export interface InviteData {
  id: string;
  token: string;
  email: string;
  company_id: string;
  role_to_assign: string;
  position?: string;
  jwt_role?: string;
  inviter_name?: string;
  companies: {
    name: string;
  };
}

export interface RegistrationResult {
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
  redirectTo?: string;
}

/**
 * Complete user registration flow for invited users
 * Uses Supabase auth directly + accept-invite-v2 edge function for privileged operations
 */
export async function registerUserFromInvite(
  inviteData: InviteData,
  registrationData: RegistrationData
): Promise<RegistrationResult> {
  console.log('Starting user registration from invite:', {
    email: inviteData.email,
    companyId: inviteData.company_id,
    role: inviteData.role_to_assign
  });

  try {
    // Step 1: Create auth user with Supabase auth
    console.log('Step 1: Creating auth user with email/password...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: inviteData.email,
      password: registrationData.password,
      options: {
        emailRedirectTo: undefined, // Don't send confirmation email for invited users
        data: {
          full_name: registrationData.fullName,
          invited_via: 'company_invite',
          company_id: inviteData.company_id,
          email_confirmed: true // Mark as confirmed since they're coming via invite
        }
      }
    });

    if (authError || !authData.user) {
      console.error('Auth signup error:', authError);
      return {
        success: false,
        error: `Failed to create account: ${authError?.message || 'Unknown error'}`
      };
    }

    console.log('✅ Auth user created:', authData.user.id);
    console.log('🔍 Full auth data:', {
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        email_confirmed_at: authData.user?.email_confirmed_at,
        confirmed_at: authData.user?.confirmed_at
      },
      session: {
        hasSession: !!authData.session,
        hasAccessToken: !!authData.session?.access_token,
        accessToken: authData.session?.access_token ? 'present' : 'missing'
      }
    });

    // Step 2: Wait for session to be available and call accept-invite-v2
    console.log('Step 2: Waiting for session and calling accept-invite-v2...');
    
    // Use the session from signUp response if available, otherwise get current session
    let session = authData.session;
    if (!session?.access_token) {
      console.log('No session in signup response, fetching current session...');
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session check:', { 
        hasSession: !!currentSession, 
        hasAccessToken: !!currentSession?.access_token,
        sessionError 
      });
      session = currentSession;
    }
    
    if (!session?.access_token) {
      console.error('No session available for accept-invite call');
      console.error('This might be due to email confirmation requirements');
      console.error('Auth data summary:', { 
        userCreated: !!authData.user,
        userEmailConfirmed: authData.user?.email_confirmed_at,
        sessionFromSignup: !!authData.session,
        sessionFromCurrent: !!session
      });
      
      // Check if email confirmation is required
      if (authData.user && !authData.user.email_confirmed_at) {
        return {
          success: false,
          error: 'Please check your email and confirm your account before proceeding. (Email confirmation required)'
        };
      }
      
      return {
        success: false,
        error: 'Authentication session not found after signup'
      };
    }

    console.log('✅ Session available for user:', session.user?.email);

    const { data: inviteResult, error: inviteError } = await supabase.functions.invoke('accept-invite-v2', {
      body: {
        token: inviteData.token
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (inviteError) {
      console.error('Accept invite error:', inviteError);
      // Clean up - delete the auth user if invite processing failed
      await supabase.auth.signOut();
      return {
        success: false,
        error: `Failed to complete registration: ${inviteError.message}`
      };
    }

    if (inviteResult.error) {
      console.error('Accept invite failed:', inviteResult.error);
      await supabase.auth.signOut();
      return {
        success: false,
        error: inviteResult.error
      };
    }

    console.log('🎉 User registration completed successfully!');

    return {
      success: true,
      user: authData.user,
      redirectTo: '/dashboard'
    };

  } catch (error: any) {
    console.error('Registration service error:', error);
    return {
      success: false,
      error: `Registration failed: ${error.message}`
    };
  }
}

/**
 * Validate invite token and get invite data
 */
export async function getInviteData(token: string): Promise<InviteData | null> {
  console.log('Fetching invite data for token...');

  try {
    // Use the new edge function to securely fetch invite data
    const { data, error } = await supabase.functions.invoke('get-invite-data', {
      body: { token }
    });

    if (error) {
      console.error('Invite lookup error:', error);
      return null;
    }

    if (data.error) {
      console.error('Invite validation error:', data.error);
      return null;
    }

    console.log('✅ Valid invite found:', data.email);
    return data as InviteData;

  } catch (error: any) {
    console.error('Error fetching invite data:', error);
    return null;
  }
}

/**
 * Upload profile picture to Supabase storage
 */
export async function uploadProfilePicture(file: File, userId: string): Promise<string | null> {
  console.log('Uploading profile picture...');

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file);

    if (error) {
      console.error('Profile picture upload failed:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    console.log('✅ Profile picture uploaded:', urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error: any) {
    console.error('Profile picture upload error:', error);
    return null;
  }
}
