// User Registration Service
// Purpose: Handle complete user registration during invite acceptance
// Date: February 1, 2025

import { supabase } from './supabase';

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
 * Handles case where user is already authenticated via generateLink action_link
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
    // Step 1: Check if user is already authenticated (from invite link)
    console.log('Step 1: Checking existing session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    let authData;
    let finalSession = session;
    
    if (session?.user) {
      console.log('✅ User already authenticated via invite link:', session.user.email);
      
      // Update the existing user's password and metadata
      console.log('Step 1a: Updating existing user password and metadata...');
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: registrationData.password,
        data: {
          full_name: registrationData.fullName,
          invited_via: 'company_invite',
          company_id: inviteData.company_id,
          profile_picture_url: registrationData.profilePictureUrl
        }
      });
      
      if (updateError) {
        console.error('Auth update error:', updateError);
        return {
          success: false,
          error: `Failed to update account: ${updateError.message}`
        };
      }
      
      authData = { user: updateData.user, session };
      console.log('✅ User updated:', authData.user?.id);
    } else {
      // Fallback: Create new auth user (shouldn't happen with generateLink flow)
      console.log('Step 1b: Creating new auth user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: registrationData.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            full_name: registrationData.fullName,
            invited_via: 'company_invite',
            company_id: inviteData.company_id,
            email_confirmed: true
          }
        }
      });

      if (signUpError || !signUpData.user) {
        console.error('Auth signup error:', signUpError);
        return {
          success: false,
          error: `Failed to create account: ${signUpError?.message || 'Unknown error'}`
        };
      }
      
      authData = signUpData;
      finalSession = signUpData.session;
      console.log('✅ Auth user created:', authData.user?.id);
    }

    // Step 2: Call accept-invite-v2 to create profile and people records
    console.log('Step 2: Calling accept-invite-v2 to complete registration...');
    
    if (!finalSession?.access_token) {
      console.error('No session available for accept-invite call');
      return {
        success: false,
        error: 'Authentication session not found'
      };
    }

    console.log('✅ Session available for user:', finalSession.user?.email);

    const { data: inviteResult, error: inviteError } = await supabase.functions.invoke('accept-invite-v2', {
      body: {
        token: inviteData.token
      },
      headers: {
        Authorization: `Bearer ${finalSession.access_token}`
      }
    });

    if (inviteError) {
      console.error('Accept invite error:', inviteError);
      return {
        success: false,
        error: `Failed to complete registration: ${inviteError.message}`
      };
    }

    if (inviteResult?.error) {
      console.error('Accept invite failed:', inviteResult.error);
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

    const { error } = await supabase.storage
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