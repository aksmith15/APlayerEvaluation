import React, { useState, useRef } from 'react';
import type { Person } from '../../types/database';
import { uploadProfilePicture, updateEmployeeProfilePicture, deleteEmployeeProfilePicture } from '../../services/dataFetching';
import { LoadingSpinner } from './LoadingSpinner';
import { LetterGrade } from './LetterGrade';
import { PersonaQuickGlanceWidget } from './PersonaQuickGlanceWidget';
import type { LetterGrade as LetterGradeType } from '../../utils/calculations';

interface EmployeeProfileProps {
  employee: Person;
  onProfilePictureUpdate: (url: string | null) => void;
  isEditable?: boolean; // Can the current user edit the profile picture
  currentUserId?: string;
  currentGrade?: LetterGradeType; // Current quarter letter grade
  currentScore?: number; // Current quarter score for tooltip
  quarterName?: string; // Current quarter name for context
  // Persona widget props
  quarterId?: string; // For persona classification
  showPersonaWidget?: boolean; // Whether to show the persona widget
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({
  employee,
  onProfilePictureUpdate,
  isEditable = false,
  currentUserId,
  currentGrade,
  currentScore,
  quarterName,
  quarterId,
  showPersonaWidget = false
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Main Profile Section */}
      <div className="p-8">
        {/* Profile Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Profile Picture Column */}
          <div className="lg:col-span-2 flex justify-center lg:justify-start">
            <div className="relative group">
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-lg ring-4 ring-white">
                {employee.profile_picture_url ? (
                  <img
                    src={employee.profile_picture_url}
                    alt={`${employee.name}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center text-2xl lg:text-3xl font-bold text-indigo-600 ${employee.profile_picture_url ? 'hidden' : ''}`}>
                  {getInitials(employee.name)}
                </div>
              </div>

              {/* Upload/Edit Overlay */}
              {isEditable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-2xl">
                  {isUploading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-white hover:text-blue-200 transition-colors rounded-lg hover:bg-black hover:bg-opacity-20"
                        title="Upload photo"
                        aria-label="Upload profile picture"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      {employee.profile_picture_url && (
                        <button
                          onClick={handleDeletePicture}
                          className="p-2 text-white hover:text-red-200 transition-colors rounded-lg hover:bg-black hover:bg-opacity-20"
                          title="Remove photo"
                          aria-label="Remove profile picture"
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

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Profile picture upload"
              />
            </div>
          </div>

          {/* Employee Information Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Name & Title Group */}
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {employee.name}
              </h1>
              <div className="space-y-1">
                <p className="text-xl font-semibold text-indigo-600">
                  {employee.role}
                </p>
                <p className="text-lg text-gray-600 font-medium">
                  {employee.department}
                </p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                employee.active 
                  ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' 
                  : 'bg-red-100 text-red-800 ring-1 ring-red-200'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  employee.active ? 'bg-emerald-500' : 'bg-red-500'
                }`}></span>
                {employee.active ? 'Active' : 'Inactive'}
              </span>
              
              {currentGrade && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full ring-1 ring-gray-200">
                  <LetterGrade 
                    grade={currentGrade}
                    score={currentScore}
                    size="sm"
                    showTooltip={true}
                    className="shadow-sm"
                  />
                  {quarterName && (
                    <span className="text-sm font-medium text-gray-600">
                      {quarterName}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                  <dd className="text-sm text-gray-900">
                    <a 
                      href={`mailto:${employee.email}`}
                      className="hover:text-indigo-600 transition-colors font-medium underline decoration-transparent hover:decoration-current"
                    >
                      {employee.email}
                    </a>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="text-sm text-gray-900 font-medium">
                    {formatDate(employee.hire_date)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Persona Column */}
          {showPersonaWidget && quarterId && (
            <div className="lg:col-span-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Performance Persona
                    </h3>
                    {quarterName && (
                      <span className="text-sm font-medium text-indigo-600 bg-white px-2 py-1 rounded-md shadow-sm">
                        {quarterName}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-center py-2">
                    <PersonaQuickGlanceWidget
                      employeeId={employee.id}
                      quarterId={quarterId}
                      employeeName={employee.name}
                      size="lg"
                      showTooltip={true}
                      className="shadow-md"
                    />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      Based on core performance areas
                    </p>
                    <div className="flex justify-center space-x-4 text-xs">
                      <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Competence
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Character
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-purple-600">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Curiosity
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Error Message */}
      {uploadError && (
        <div className="mx-8 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 font-medium">{uploadError}</p>
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      {employee.person_description && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-8">
            <div className="max-w-4xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
              <p className="text-gray-700 leading-relaxed text-base">
                {employee.person_description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 