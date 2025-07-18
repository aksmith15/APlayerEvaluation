import React, { useState, useEffect, useMemo } from 'react';

interface PDFViewerProps {
  url?: string;
  pdfData?: string; // Base64 encoded PDF data
  pdfFilename?: string; // Original filename
  title?: string;
  height?: number;
  showDownloadButton?: boolean;
  onDownload?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  pdfData,
  pdfFilename,
  title = "AI Meta-Analysis Report",
  height = 400,
  showDownloadButton = true,
  onDownload,
  isLoading = false,
  error
}) => {
  const [loadError, setLoadError] = useState<boolean>(false);

  // Create blob URL from base64 data
  const blobUrl = useMemo(() => {
    if (!pdfData) return null;
    
    try {
      // Convert base64 to binary
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Create blob and URL
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL from PDF data:', error);
      return null;
    }
  }, [pdfData]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Use provided URL if available (e.g., Google Drive), otherwise fall back to blob URL from PDF data
  const effectiveUrl = url || blobUrl;
  const effectiveFilename = pdfFilename || `${title.replace(/\s+/g, '_')}.pdf`;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (effectiveUrl) {
      // Default download behavior
      const link = document.createElement('a');
      link.href = effectiveUrl;
      link.download = effectiveFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleIframeError = () => {
    setLoadError(true);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg border border-secondary-200 overflow-hidden">
        <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-secondary-800">{title}</h3>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
              <span className="text-sm text-secondary-600">Generating...</span>
            </div>
          </div>
        </div>
        <div className={`flex items-center justify-center bg-secondary-50`} style={{ height: `${height}px` }}>
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 bg-secondary-300 rounded-full mx-auto"></div>
              <div className="space-y-2">
                <div className="h-4 bg-secondary-300 rounded w-48 mx-auto"></div>
                <div className="h-3 bg-secondary-200 rounded w-32 mx-auto"></div>
              </div>
            </div>
            <p className="text-secondary-600 mt-4">Generating AI analysis...</p>
            <p className="text-sm text-secondary-500">This may take a few moments</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg border border-red-200 overflow-hidden">
        <div className="bg-red-50 px-4 py-3 border-b border-red-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-red-800">{title}</h3>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-600">Error</span>
            </div>
          </div>
        </div>
        <div className={`flex items-center justify-center bg-red-50`} style={{ height: `${height}px` }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-700 font-medium mb-2">Failed to generate analysis</p>
            <p className="text-sm text-red-600 max-w-md mx-auto">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!effectiveUrl) {
    return (
      <div className="w-full bg-white rounded-lg border border-secondary-200 overflow-hidden">
        <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-secondary-800">{title}</h3>
            <span className="text-sm text-secondary-500">Ready to generate</span>
          </div>
        </div>
        <div className={`flex items-center justify-center bg-secondary-50`} style={{ height: `${height}px` }}>
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary-200 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <svg className="w-8 h-8 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-secondary-600 font-medium">No analysis available</p>
            <p className="text-sm text-secondary-500">Click "Generate Meta-Analysis" to create an AI-powered report</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-secondary-200 overflow-hidden pdf-viewer">
      {/* Header */}
      <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-secondary-800">{title}</h3>
          <div className="flex items-center space-x-2">
            {showDownloadButton && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-1.5 border border-secondary-300 text-sm font-medium rounded text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                title="Download PDF"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            )}
            <button
              onClick={() => window.open(effectiveUrl, '_blank')}
              className="inline-flex items-center px-3 py-1.5 border border-primary-300 text-sm font-medium rounded text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              title="Open in new tab"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="relative">
        {loadError ? (
          <div className={`flex items-center justify-center bg-warning-50`} style={{ height: `${height}px` }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-warning-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-warning-700 font-medium mb-2">Unable to display PDF</p>
              <p className="text-sm text-warning-600 mb-4">The PDF could not be embedded, but you can still download or open it</p>
              <div className="space-x-2">
                <button
                  onClick={handleDownload}
                  className="btn-primary inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={() => window.open(effectiveUrl, '_blank')}
                  className="btn-secondary inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={effectiveUrl}
            width="100%"
            height={height}
            className="border-0"
            title={title}
            onError={handleIframeError}
            onLoad={() => setLoadError(false)}
          />
        )}
      </div>
    </div>
  );
}; 