/**
 * Create Tab Component
 * Wrapper for assignment creation functionality
 */

import React from 'react';
import { AssignmentCreationForm } from '../AssignmentCreationForm';

interface CreateTabProps {
  onAssignmentCreated: () => void;
}

export const CreateTab: React.FC<CreateTabProps> = ({ onAssignmentCreated }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <AssignmentCreationForm onAssignmentCreated={onAssignmentCreated} />
    </div>
  );
};
