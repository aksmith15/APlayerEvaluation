import React, { useState } from 'react';
import { downloadAnalyticsView, getAnalyticsExportData, generatePDF, generateDownloadFilename } from '../../utils/downloadUtils';

interface DownloadAnalyticsButtonProps {
  employeeName: string;
  quarterName: string;
  overallScore?: number;
  attributeCount: number;
  completionRate?: number;
  analyticsData?: any;
  elementId?: string;
  disabled?: boolean;
}

type ExportFormat = 'print' | 'html' | 'json' | 'pdf';

export const DownloadAnalyticsButton: React.FC<DownloadAnalyticsButtonProps> = ({
  employeeName,
  quarterName,
  overallScore,
  attributeCount,
  completionRate,
  analyticsData,
  elementId = 'analytics-main-content',
  disabled = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<ExportFormat | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  const exportOptions = [
    {
      format: 'pdf' as ExportFormat,
      label: 'Generate PDF',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Generate high-quality PDF with all charts and data'
    },
    {
      format: 'print' as ExportFormat,
      label: 'Print View',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      ),
      description: 'Open browser print dialog (basic layout)'
    },
    {
      format: 'html' as ExportFormat,
      label: 'Download HTML',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Download as standalone HTML file'
    },
    {
      format: 'json' as ExportFormat,
      label: 'Download Data',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Download raw analytics data as JSON',
      requiresData: true
    }
  ];

  const handleDownload = async (format: ExportFormat) => {
    if (disabled || isDownloading) return;

    try {
      setIsDownloading(format);
      setDownloadProgress('');
      
      if (format === 'pdf') {
        // Use enhanced PDF generation with progress tracking
        const filename = generateDownloadFilename(employeeName, quarterName, 'pdf');
        await generatePDF(
          elementId,
          filename,
          employeeName,
          quarterName,
          (stage: string) => setDownloadProgress(stage)
        );
      } else {
        // Use legacy method for other formats
        const exportData = getAnalyticsExportData(
          employeeName,
          quarterName,
          overallScore,
          attributeCount,
          completionRate
        );

        const combinedData = {
          metadata: exportData,
          analyticsData: analyticsData || null
        };

        await downloadAnalyticsView(
          format,
          elementId,
          employeeName,
          quarterName,
          combinedData
        );
      }

      // Close dropdown after successful download
      setIsDropdownOpen(false);

    } catch (error) {
      console.error(`Error downloading analytics as ${format}:`, error);
      alert(`Failed to download analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(null);
      setDownloadProgress('');
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target && !target.closest('.download-analytics-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDropdownOpen]);

  return (
    <div className="relative download-analytics-dropdown">
      {/* Main Button */}
      <button
        onClick={toggleDropdown}
        disabled={disabled || Boolean(isDownloading)}
        className={`inline-flex items-center px-4 py-2 border border-secondary-300 text-sm font-medium rounded-lg transition-colors ${
          disabled || isDownloading
            ? 'text-secondary-400 bg-secondary-100 cursor-not-allowed'
            : 'text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
        }`}
        title="Download Analytics View"
      >
        {isDownloading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
            {downloadProgress || `Generating ${isDownloading.toUpperCase()}...`}
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Analytics
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-lg border border-secondary-200 z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-secondary-100">
              <h3 className="text-sm font-medium text-secondary-800">Export Options</h3>
              <p className="text-xs text-secondary-500">{employeeName} - {quarterName}</p>
            </div>
            
            {exportOptions.map((option) => {
              const isDisabled = option.requiresData && !analyticsData;
              const isCurrentlyDownloading = isDownloading === option.format;
              
              return (
                <button
                  key={option.format}
                  onClick={() => handleDownload(option.format)}
                  disabled={isDisabled || Boolean(isDownloading)}
                  className={`w-full text-left px-4 py-3 flex items-start space-x-3 transition-colors ${
                    isDisabled || isDownloading
                      ? 'text-secondary-400 cursor-not-allowed'
                      : 'text-secondary-700 hover:bg-secondary-50'
                  }`}
                >
                  <div className={`flex-shrink-0 mt-0.5 ${isCurrentlyDownloading ? 'animate-pulse' : ''}`}>
                    {isCurrentlyDownloading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                    ) : (
                      option.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {isCurrentlyDownloading ? 'Downloading...' : option.label}
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">
                      {isDisabled && option.requiresData 
                        ? 'Analytics data required' 
                        : option.description
                      }
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-2 border-t border-secondary-100 bg-secondary-50 rounded-b-lg">
            <p className="text-xs text-secondary-500">
              {attributeCount} attributes • Overall: {overallScore?.toFixed(1) || 'N/A'}
              {completionRate && ` • ${completionRate.toFixed(0)}% complete`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 