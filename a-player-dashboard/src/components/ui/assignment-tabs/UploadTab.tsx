/**
 * Upload Tab Component
 * Placeholder for bulk upload functionality
 */

import React from 'react';
import { Card } from '../Card';

const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

interface UploadTabProps {}

export const UploadTab: React.FC<UploadTabProps> = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="p-6 text-center">
          <UploadIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-secondary-900 mb-4">Bulk Upload</h2>
          <p className="text-secondary-600 mb-6">
            Bulk assignment upload functionality will be available in a future update.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Coming Soon:</strong> Upload CSV files to create multiple assignments at once, 
              with validation and error handling for large-scale deployment.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
