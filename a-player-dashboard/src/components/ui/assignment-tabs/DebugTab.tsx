/**
 * Debug Tab Component
 * Wrapper for assignment debugging functionality
 */

import React from 'react';
import { AssignmentDebugger } from '../AssignmentDebugger';

interface DebugTabProps {}

export const DebugTab: React.FC<DebugTabProps> = () => {
  return (
    <div className="space-y-6">
      <AssignmentDebugger />
    </div>
  );
};
