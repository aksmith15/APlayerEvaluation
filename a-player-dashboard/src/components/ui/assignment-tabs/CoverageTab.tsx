/**
 * Coverage Tab Component
 * Wrapper for coverage dashboard functionality
 */

import React from 'react';
import { CoverageDashboard } from '../CoverageDashboard';

interface CoverageTabProps {
  onCreateAssignment: () => void;
}

export const CoverageTab: React.FC<CoverageTabProps> = ({ onCreateAssignment }) => {
  return (
    <div className="space-y-6">
      <CoverageDashboard onCreateAssignment={onCreateAssignment} />
    </div>
  );
};
