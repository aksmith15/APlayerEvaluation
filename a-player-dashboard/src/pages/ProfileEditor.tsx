// ProfileEditor Component
// Purpose: Allow users to edit their profile information, picture, and password
// Uses: Supabase Auth for password changes, existing profile picture services
// Date: January 2025

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Page } from '../components/layout';
import { uploadProfilePicture, deleteEmployeeProfilePicture } from '../services/dataFetching';

interface ProfileData {
  full_name: string;
  email: string;
  position: string;
  company_name: string;
  profile_picture_url: string | null;
  people_id: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  feedback: string;
}

export const ProfileEditor: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    position: '',
    company_name: '',
    profile_picture_url: null,
    people_id: ''
  });
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load user profile data on component mount
  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError(null);

      // Use people table as the primary source of truth (this has all the actual user data)
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select(`
          id,
          name,
          email,
          role,
          department,
          profile_picture_url,
          company_id,
          jwt_role,
          companies!inner(name)
        `)
        .eq('email', user.email)
        .eq('active', true)
        .single();

      if (peopleError) {
        throw new Error(`Failed to load user data: ${peopleError.message}`);
      }

      // Use people table as the complete data source
      // (profiles table supplementary data can be added later when RLS is properly configured)
      setProfileData({
        full_name: peopleData.name || user.name || '',
        email: peopleData.email,
        position: peopleData?.role || peopleData?.department || '',
        company_name: (peopleData?.companies as any)?.name || '',
        profile_picture_url: peopleData?.profile_picture_url || null,
        people_id: peopleData?.id || ''
      });

      console.log('Profile data loaded successfully from people table');

    } catch (err: any) {
      console.error('Failed to load profile data:', err);
      setError(`Failed to load profile data: ${err.message}`);
    } finally {
      setLoading(false);
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

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newPassword') {
      validatePassword(value);
    }
  };

  const handleProfileImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploadingImage(true);
      setError(null);

      // Upload new profile picture
      const publicUrl = await uploadProfilePicture(file, profileData.people_id);
      
      // Update people table with new profile picture URL
      const { error: updateError } = await supabase
        .from('people')
        .update({ profile_picture_url: publicUrl })
        .eq('id', profileData.people_id);

      if (updateError) {
        throw updateError;
      }

      setProfileData(prev => ({ ...prev, profile_picture_url: publicUrl }));
      setImagePreview(null);
      setSuccess('Profile picture updated successfully!');
      
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setError(`Failed to upload profile picture: ${err.message}`);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!profileData.profile_picture_url) return;
    
    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    try {
      setUploadingImage(true);
      setError(null);

      await deleteEmployeeProfilePicture(profileData.people_id, profileData.profile_picture_url);
      
      setProfileData(prev => ({ ...prev, profile_picture_url: null }));
      setSuccess('Profile picture deleted successfully!');
      
    } catch (err: any) {
      console.error('Error deleting profile picture:', err);
      setError(`Failed to delete profile picture: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      // Primary update: people table (this is the main data source)
      const peopleUpdateData: any = {
        name: profileData.full_name.trim()
      };

      // Only super_admin can update position/role
      if (user?.jwtRole === 'super_admin') {
        peopleUpdateData.role = profileData.position.trim();
      }

      const { error: peopleError } = await supabase
        .from('people')
        .update(peopleUpdateData)
        .eq('id', profileData.people_id);

      if (peopleError) {
        throw peopleError;
      }

      // Note: Profiles table updates are disabled due to RLS access issues
      // All user data is now managed through the people table

      // Success message
      if (user?.jwtRole === 'super_admin') {
        setSuccess('Profile and position updated successfully!');
      } else {
        setSuccess('Profile updated successfully!');
      }
      
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(`Failed to save profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setError(null);

      // Validate password requirements
      if (!passwordData.currentPassword) {
        throw new Error('Current password is required');
      }

      if (passwordData.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New password and confirmation do not match');
      }

      if (passwordStrength.score < 3) {
        throw new Error('Please choose a stronger password');
      }

      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength({ score: 0, feedback: '' });

      setSuccess('Password changed successfully!');
      
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(`Failed to change password: ${err.message}`);
    } finally {
      setChangingPassword(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'text-red-600 bg-red-100';
      case 2:
        return 'text-orange-600 bg-orange-100';
      case 3:
        return 'text-yellow-600 bg-yellow-100';
      case 4:
      case 5:
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  return (
    <Page>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and account settings</p>
        </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          
          {/* Profile Picture Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border border-gray-300"
                  />
                ) : profileData.profile_picture_url ? (
                  <img
                    src={profileData.profile_picture_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center">
                    <span className="text-2xl text-gray-500">
                      {profileData.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  size="sm"
                  disabled={uploadingImage}
                >
                  Change Photo
                </Button>
                {profileData.profile_picture_url && (
                  <Button
                    onClick={handleDeleteProfilePicture}
                    variant="ghost"
                    size="sm"
                    disabled={uploadingImage}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete Photo
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Recommended: Square image, at least 200x200 pixels. Max file size: 5MB.
            </p>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">
                Email cannot be changed here. Contact your administrator if you need to update your email.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position/Title
              </label>
              <input
                type="text"
                value={profileData.position}
                onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                disabled={user?.jwtRole !== 'super_admin'}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  user?.jwtRole !== 'super_admin' 
                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
                    : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Enter your position or job title"
              />
              {user?.jwtRole !== 'super_admin' && (
                <p className="text-sm text-gray-500 mt-1">
                  Position/title can only be edited by super administrators.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={profileData.company_name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">
                Company affiliation is managed by administrators.
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving || !profileData.full_name.trim()}
              className="w-full"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </Card>

        {/* Password Change */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your new password"
              />
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPasswordStrengthColor()}`}>
                    {passwordStrength.feedback}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your new password"
              />
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-1">Password Requirements:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
                <li>• Contains at least one special character</li>
              </ul>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={
                changingPassword ||
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword ||
                passwordData.newPassword !== passwordData.confirmPassword ||
                passwordStrength.score < 3
              }
              className="w-full"
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </Card>
      </div>
      </div>
    </Page>
  );
};

export default ProfileEditor;
