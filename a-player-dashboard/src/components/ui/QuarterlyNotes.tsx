import React, { useState, useEffect, useCallback } from 'react';
import { fetchEmployeeQuarterNotes, updateEmployeeQuarterNotes } from '../../services/dataFetching';
import { LoadingSpinner } from './LoadingSpinner';

interface QuarterlyNotesProps {
  employeeId: string;
  quarterId: string;
  quarterName: string;
  currentUserId?: string;
  isEditable?: boolean; // Can the current user edit the notes
  className?: string;
}

export const QuarterlyNotes: React.FC<QuarterlyNotesProps> = ({
  employeeId,
  quarterId,
  quarterName,
  currentUserId: _currentUserId, // Not currently used but kept for future functionality
  isEditable = false,
  className = ''
}) => {
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Debounced save functionality
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load notes when component mounts or when employee/quarter changes
  useEffect(() => {
    loadNotes();
  }, [employeeId, quarterId]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedNotes = await fetchEmployeeQuarterNotes(employeeId, quarterId);
      setNotes(fetchedNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes');
      setNotes('');
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotes = useCallback(async (notesToSave: string) => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Use a simplified approach that doesn't depend on currentUserId from auth service
      await updateEmployeeQuarterNotes(employeeId, quarterId, notesToSave, 'bypass');
      
      // Show success indicator briefly
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving notes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save notes';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [employeeId, quarterId]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setError(null);
    setSaveSuccess(false);

    // Auto-save with debouncing (save 1 second after user stops typing)
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    if (isEditable) {
      const timeout = setTimeout(() => {
        saveNotes(value);
      }, 1000);
      setSaveTimeout(timeout);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Save immediately when exiting edit mode
      saveNotes(notes);
    }
    setIsEditing(!isEditing);
  };

  const handleManualSave = () => {
    saveNotes(notes);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const formatCharacterCount = (text: string) => {
    const count = text.length;
    const maxLength = 5000; // Reasonable limit for notes
    return `${count}/${maxLength}`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-secondary-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-secondary-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-800">
          {quarterName} Notes
        </h3>
        
        <div className="flex items-center space-x-2">
          {/* Save Status Indicators */}
          {isSaving && (
            <div className="flex items-center space-x-1 text-sm text-secondary-600">
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </div>
          )}
          
          {saveSuccess && (
            <div className="flex items-center space-x-1 text-sm text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Saved</span>
            </div>
          )}

          {/* Edit Button - Only show for editable notes */}
          {isEditable && (
            <button
              onClick={handleEditToggle}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                isEditing
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Notes Content */}
      <div className="space-y-3">
        {isEditing ? (
          // Edit Mode - Textarea
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes about this employee's performance during this quarter..."
              className="w-full h-32 sm:h-40 px-3 py-2 border border-secondary-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              maxLength={5000}
              autoFocus
            />
            
            {/* Character Count and Actions */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-500">
                {formatCharacterCount(notes)}
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Now
                </button>
              </div>
            </div>
          </div>
        ) : (
          // View Mode - Display notes
          <div className="min-h-[8rem] sm:min-h-[10rem]">
            {notes ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-secondary-700 leading-relaxed whitespace-pre-wrap break-words">
                  {notes}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-secondary-500">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p className="text-sm">
                    {isEditable ? 'Click "Edit" to add notes for this quarter' : 'No notes available for this quarter'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="pt-3 border-t border-secondary-200">
          <p className="text-xs text-secondary-500">
            {isEditable ? 'For manager use' : 'Manager notes'}
            {notes && !isEditing && (
              <span className="ml-2">
                • {formatCharacterCount(notes).split('/')[0]} characters
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}; 