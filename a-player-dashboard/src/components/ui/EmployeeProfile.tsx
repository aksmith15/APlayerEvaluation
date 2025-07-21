import React, { useState, useRef } from 'react';
import type { Person } from '../../types/database';
import { uploadProfilePicture, updateEmployeeProfilePicture, deleteEmployeeProfilePicture } from '../../services/dataFetching';
import { supabase } from '../../services/supabase';
import { LoadingSpinner } from './LoadingSpinner';

interface EmployeeProfileProps {
  employee: Person;
  onProfilePictureUpdate: (url: string | null) => void;
  isEditable?: boolean; // Can the current user edit the profile picture
  currentUserId?: string;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({
  employee,
  onProfilePictureUpdate,
  isEditable = false,
  currentUserId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🖼️ File selected for upload:', {
      name: file.name,
      size: file.size,
      type: file.type,
      employeeId: employee.id,
      currentUserId: currentUserId,
      isEditable: isEditable
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Upload file to storage
      const publicUrl = await uploadProfilePicture(file, employee.id);
      
      // Update database
      await updateEmployeeProfilePicture(employee.id, publicUrl);
      
      // Notify parent component
      onProfilePictureUpdate(publicUrl);
      
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload profile picture. Please try again.';
      
      if (error?.message) {
        if (error.message.includes('storage')) {
          errorMessage = 'Storage error: Check bucket permissions and configuration.';
        } else if (error.message.includes('policy')) {
          errorMessage = 'Permission error: You may not have permission to upload pictures.';
        } else if (error.message.includes('authentication')) {
          errorMessage = 'Authentication error: Please log out and log back in.';
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      }
      
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePicture = async () => {
    if (!employee.profile_picture_url) return;
    
    try {
      setIsUploading(true);
      setUploadError(null);

      await deleteEmployeeProfilePicture(employee.id, employee.profile_picture_url);
      
      // Notify parent component
      onProfilePictureUpdate(null);
      
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      setUploadError('Failed to delete profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        
        {/* Profile Picture Section */}
        <div className="flex-shrink-0 relative group">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-secondary-100 flex items-center justify-center border-4 border-white shadow-lg">
            {employee.profile_picture_url ? (
              <img
                src={employee.profile_picture_url}
                alt={`${employee.name}'s profile`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-semibold text-secondary-600 ${employee.profile_picture_url ? 'hidden' : ''}`}>
              {getInitials(employee.name)}
            </div>
          </div>

          {/* Upload/Edit Overlay - Only show for editable profiles */}
          {isEditable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
              {isUploading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white hover:text-primary-200 transition-colors"
                    title="Upload photo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  {employee.profile_picture_url && (
                    <button
                      onClick={handleDeletePicture}
                      className="text-white hover:text-red-200 transition-colors"
                      title="Remove photo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Employee Information */}
        <div className="flex-1 min-w-0">
          <div className="space-y-3">
            {/* Name and Role */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 break-words">
                {employee.name}
              </h1>
              <p className="text-lg text-primary-600 font-medium">
                {employee.role}
              </p>
            </div>

            {/* Department */}
            <div>
              <p className="text-base text-secondary-700 font-medium">
                {employee.department}
              </p>
            </div>

            {/* Contact and Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-sm font-medium text-secondary-600">Email:</span>
                <p className="text-sm text-secondary-800 break-all">
                  <a 
                    href={`mailto:${employee.email}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {employee.email}
                  </a>
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-secondary-600">Hire Date:</span>
                <p className="text-sm text-secondary-800">
                  {formatDate(employee.hire_date)}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center pt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                employee.active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {employee.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Error Message */}
      {uploadError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}



      {/* Description (if available) */}
      {employee.person_description && (
        <div className="mt-6 pt-4 border-t border-secondary-200">
          <h3 className="text-sm font-medium text-secondary-600 mb-2">About</h3>
          <p className="text-sm text-secondary-700 leading-relaxed">
            {employee.person_description}
          </p>
        </div>
      )}
    </div>
  );
}; 