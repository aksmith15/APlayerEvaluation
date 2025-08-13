/**
 * Generate PDF Button Component
 * Provides PDF report generation functionality for employee evaluations
 * Uses React-PDF renderer for modern, styled evaluation reports
 */

import React, { useState } from 'react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { generateEmployeeReportReact } from '../../services/reactPdfBuilder';
import type { Person } from '../../types/database';

interface GeneratePDFButtonProps {
  employee: Person;
  selectedQuarter: string;
  quarterName?: string;
  disabled?: boolean;
  className?: string;
}

export const GeneratePDFButton: React.FC<GeneratePDFButtonProps> = ({
  employee,
  selectedQuarter,
  quarterName,
  disabled = false,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Small delay to allow UI to update and show loading state
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🚀 Generating React-PDF report...');
      
      await generateEmployeeReportReact({
        employee,
        selectedQuarter,
        quarterName
      });

      console.log('✅ PDF report generated successfully');

    } catch (err) {
      console.error('❌ PDF generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <Button
        onClick={handleGeneratePDF}
        disabled={disabled || isGenerating || !employee?.id || !selectedQuarter}
        variant="primary"
        className="flex items-center gap-2"
      >
        {isGenerating ? (
          <>
            <LoadingSpinner size="sm" />
            Generating PDF...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </>
        )}
      </Button>
      
      {error && (
        <div className="mt-2">
          <ErrorMessage message={error} />
        </div>
      )}
    </div>
  );
};