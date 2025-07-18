// Utility functions for downloading and exporting analytics views
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Generate a filename for downloads
export const generateDownloadFilename = (
  employeeName: string, 
  quarterName: string, 
  type: 'pdf' | 'png' | 'jpg' = 'pdf'
): string => {
  const sanitizedEmployeeName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedQuarterName = quarterName.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  
  return `${sanitizedEmployeeName}_Analytics_${sanitizedQuarterName}_${timestamp}.${type}`;
};

// PDF-specific CSS injection for clean chart rendering
const injectPDFStyles = () => {
  const existingStyle = document.getElementById('pdf-generation-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement('style');
  style.id = 'pdf-generation-styles';
  style.innerHTML = `
    /* PDF Generation Mode */
    .pdf-generating {
      /* Hide all interactive elements */
      select,
      button:not(.pdf-keep),
      input,
      .dropdown,
      .tooltip,
      .no-print,
      [role="tooltip"],
      .recharts-tooltip-wrapper,
      .recharts-active-dot {
        display: none !important;
      }

      /* Enhanced chart containers with fixed large dimensions */
      .recharts-wrapper {
        background: white !important;
        border: none !important;
        width: 800px !important;
        height: 500px !important;
        min-height: 500px !important;
        max-width: none !important;
      }

      /* Force SVG elements to large dimensions */
      .recharts-wrapper svg {
        width: 800px !important;
        height: 500px !important;
        background: transparent !important;
      }

      /* Enhanced chart text for better readability */
      .recharts-text,
      .recharts-label,
      text {
        font-size: 14px !important;
        font-weight: 500 !important;
        fill: #1f2937 !important;
      }

      /* Ensure proper text rendering */
      * {
        color: #1f2937 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Clean up card styling for PDF */
      .bg-white {
        background: white !important;
        box-shadow: none !important;
        border: 1px solid #e5e7eb !important;
      }

      /* Optimize typography for PDF */
      h1, h2, h3, h4, h5, h6 {
        color: #111827 !important;
        page-break-after: avoid !important;
      }

      /* Chart title styling */
      .chart-title {
        font-size: 18px !important;
        font-weight: 600 !important;
        color: #111827 !important;
        margin-bottom: 15px !important;
      }

      /* Ensure charts have consistent spacing with larger containers */
      .chart-container {
        margin: 25px 0 !important;
        page-break-inside: avoid !important;
        width: auto !important;
        overflow: visible !important;
      }

      /* Clean layout for PDF */
      .analytics-layout {
        max-width: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* Employee profile section */
      .employee-profile {
        border-bottom: 2px solid #e5e7eb !important;
        padding-bottom: 20px !important;
        margin-bottom: 30px !important;
      }

      /* Ensure proper spacing between sections */
      .analytics-section {
        margin-bottom: 50px !important;
        page-break-inside: avoid !important;
      }

      /* Hide any loading states */
      .loading, .spinner, .skeleton {
        display: none !important;
      }

      /* Enhanced chart legends */
      .recharts-legend-wrapper {
        margin-top: 15px !important;
      }

      /* Enhanced grid and axis styling */
      .recharts-cartesian-grid line,
      .recharts-polar-grid circle {
        stroke: #f3f4f6 !important;
        stroke-width: 1 !important;
      }

      /* Enhanced axis text with larger, more readable fonts */
      .recharts-xAxis .recharts-text,
      .recharts-yAxis .recharts-text,
      .recharts-polar-angle-axis .recharts-text {
        fill: #1f2937 !important;
        font-size: 14px !important;
        font-weight: 500 !important;
      }

      /* Enhanced axis labels */
      .recharts-label {
        fill: #1f2937 !important;
        font-size: 14px !important;
        font-weight: 500 !important;
      }
    }
  `;
  
  document.head.appendChild(style);
};

// Remove PDF styles after generation
const removePDFStyles = () => {
  const style = document.getElementById('pdf-generation-styles');
  if (style) {
    style.remove();
  }
};

// Wait for charts to render with new larger dimensions
const waitForChartsToRender = async (): Promise<void> => {
  // Wait for initial style application
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if charts exist and wait for them to settle
  const chartWrappers = document.querySelectorAll('.recharts-wrapper');
  if (chartWrappers.length > 0) {
    // Wait longer for complex charts to re-render with new dimensions
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Additional wait for any SVG animations or transitions
    await new Promise(resolve => setTimeout(resolve, 1000));
  } else {
    // Standard wait if no charts detected
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Enhanced PDF generation with proper chart rendering
export const generatePDF = async (
  elementId: string,
  filename: string,
  employeeName: string,
  quarterName: string,
  onProgress?: (stage: string) => void
): Promise<void> => {
  try {
    onProgress?.('Preparing document...');
    
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Inject PDF-specific styles
    injectPDFStyles();
    
    // Add PDF generation class to trigger style changes
    element.classList.add('pdf-generating');
    
    // Wait for charts to render with new dimensions
    await waitForChartsToRender();
    
    onProgress?.('Capturing analytics...');

    // Capture the element with enhanced settings for large charts
    const canvas = await html2canvas(element, {
      scale: 3, // Higher resolution for crisp large charts
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1400, // Larger window width for better chart rendering
      windowHeight: element.scrollHeight,
      imageTimeout: 20000, // Longer timeout for complex chart rendering
      onclone: (clonedDoc) => {
        // Ensure cloned document has proper styles and chart dimensions
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.classList.add('pdf-generating');
        }
        
        // Force all chart wrappers to large dimensions in cloned document
        const chartWrappers = clonedDoc.querySelectorAll('.recharts-wrapper');
        chartWrappers.forEach(wrapper => {
          const htmlWrapper = wrapper as HTMLElement;
          htmlWrapper.style.width = '800px';
          htmlWrapper.style.height = '500px';
          htmlWrapper.style.minHeight = '500px';
          htmlWrapper.style.maxWidth = 'none';
        });
        
        // Ensure chart text is large and readable in cloned document
        const chartTexts = clonedDoc.querySelectorAll('.recharts-text, .recharts-label, text');
        chartTexts.forEach(text => {
          const htmlText = text as HTMLElement;
          htmlText.style.fontSize = '14px';
          htmlText.style.fontWeight = '500';
          htmlText.style.fill = '#1f2937';
        });

        // Force SVG elements to proper dimensions
        const svgElements = clonedDoc.querySelectorAll('.recharts-wrapper svg');
        svgElements.forEach(svg => {
          const htmlSvg = svg as SVGElement;
          htmlSvg.style.width = '800px';
          htmlSvg.style.height = '500px';
        });
      }
    });

    onProgress?.('Generating PDF...');

    // Create PDF with optimal settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // A4 dimensions
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10; // Minimal margins for content pages
    const maxWidth = pageWidth - (2 * margin);
    const maxHeight = pageHeight - (2 * margin);

    // Add title page
    addTitlePage(pdf, employeeName, quarterName, pageWidth, pageHeight);

    // Enhanced scaling calculation for prominent chart display
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgAspectRatio = imgWidth / imgHeight;
    
    // Calculate scale to make charts prominent (larger than standard fit-to-page)
    // Use 90% of page width for better chart visibility, prioritizing chart prominence over perfect fit
    const targetWidth = maxWidth * 0.9;
    let finalWidth = targetWidth;
    let finalHeight = finalWidth / imgAspectRatio;
    
    // If height exceeds page, adjust but maintain larger scale for charts
    if (finalHeight > maxHeight) {
      finalHeight = maxHeight * 0.95; // Use 95% of available height
      finalWidth = finalHeight * imgAspectRatio;
      
      // If width is now too large, use a balanced approach
      if (finalWidth > maxWidth) {
        finalWidth = maxWidth * 0.85; // Slightly smaller but still prominent
        finalHeight = finalWidth / imgAspectRatio;
      }
    }

    // Add new page for content
    pdf.addPage();

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Enhanced page layout with prominent chart positioning
    if (finalHeight <= maxHeight) {
      // Single page - center the content with prominent positioning
      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = margin + (maxHeight - finalHeight) * 0.1; // Slight top bias for better visual balance
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
    } else {
      // Multi-page content with enhanced chart handling
      const pagesNeeded = Math.ceil(finalHeight / maxHeight);
      
      for (let page = 0; page < pagesNeeded; page++) {
        if (page > 0) pdf.addPage();
        
        // Enhanced page splitting calculation for large charts
        const pageStartY = page * maxHeight;
        const remainingHeight = finalHeight - pageStartY;
        const pageContentHeight = Math.min(maxHeight, remainingHeight);
        
        // Calculate source region with better precision for large charts
        const sourceYRatio = pageStartY / finalHeight;
        const sourceHeightRatio = pageContentHeight / finalHeight;
        
        const ySourceOffset = sourceYRatio * imgHeight;
        const heightToCapture = sourceHeightRatio * imgHeight;
        
        // Create high-quality cropped canvas for this page
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          // Maintain high resolution for chart quality
          pageCanvas.width = imgWidth;
          pageCanvas.height = heightToCapture;
          
          // Enable high-quality image smoothing for charts
          pageCtx.imageSmoothingEnabled = true;
          pageCtx.imageSmoothingQuality = 'high';
          
          pageCtx.drawImage(
            canvas,
            0, ySourceOffset,
            imgWidth, heightToCapture,
            0, 0,
            imgWidth, heightToCapture
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          
          // Center content on page with slight top bias
          const xOffset = (pageWidth - finalWidth) / 2;
          const yOffset = margin;
          
          pdf.addImage(pageImgData, 'PNG', xOffset, yOffset, finalWidth, pageContentHeight);
        }
      }
    }

    onProgress?.('Finalizing...');

    // Clean up
    element.classList.remove('pdf-generating');
    removePDFStyles();

    // Save the PDF
    pdf.save(filename);
    
    onProgress?.('Complete!');

  } catch (error) {
    // Clean up on error
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove('pdf-generating');
    }
    removePDFStyles();
    
    console.error('PDF generation failed:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

// Enhanced title page with better layout
const addTitlePage = (
  pdf: jsPDF, 
  employeeName: string, 
  quarterName: string,
  pageWidth: number,
  pageHeight: number
) => {
  const margin = 25;
  const centerX = pageWidth / 2;
  
  // Title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Performance Analytics Report', centerX, 60, { align: 'center' });
  
  // Employee name
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  pdf.text(employeeName, centerX, 80, { align: 'center' });
  
  // Quarter
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(quarterName, centerX, 95, { align: 'center' });
  
  // Date
  pdf.setFontSize(10);
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, centerX, 110, { align: 'center' });
  
  // Decorative line
  pdf.setLineWidth(0.5);
  pdf.line(margin, 125, pageWidth - margin, 125);
  
  // Summary section
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Report Contents', margin, 150);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const contents = [
    '• Performance Overview - Comprehensive radar chart visualization',
    '• Detailed Evaluation Breakdown - Scores by source and attribute',
    '• Quarterly Performance Trends - Historical performance analysis',
    '• Multi-Quarter Comparisons - Performance evolution over time',
    '• AI-Powered Insights - Meta-analysis and recommendations'
  ];
  
  let yPos = 165;
  contents.forEach(item => {
    pdf.text(item, margin, yPos);
    yPos += 12;
  });
  
  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('This report contains confidential performance data', centerX, pageHeight - 20, { align: 'center' });
};

// Legacy function for compatibility
export const downloadHTML = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Legacy function for compatibility  
export const downloadJSON = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Print the analytics view (kept as fallback)
export const printAnalyticsView = (elementId: string = 'analytics-main-content'): void => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    // Copy styles and content
    const originalTitle = document.title;
    const printContent = element.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Employee Analytics - ${originalTitle}</title>
          <style>
            * { 
              box-sizing: border-box; 
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              margin: 0; 
              padding: 15px;
              color: #333 !important;
              background: white !important;
              font-size: 12px;
              line-height: 1.4;
            }
            
            /* Hide interactive and decorative elements */
            .no-print,
            button,
            .btn,
            .btn-primary,
            .btn-secondary,
            .download-analytics-dropdown,
            [role="button"],
            .cursor-pointer,
            .hover\\:bg-secondary-50,
            .focus\\:ring-2,
            input[type="checkbox"],
            input[type="radio"],
            select,
            .animate-spin,
            .animate-pulse,
            .animate-bounce,
            svg:not(.chart-svg),
            .loading-spinner,
            .tooltip,
            .dropdown,
            .menu,
            .modal,
            .overlay { 
              display: none !important; 
            }
            
            /* Page breaks */
            .page-break { page-break-before: always; }
            .page-break-avoid { 
              page-break-inside: avoid; 
              break-inside: avoid;
            }
            
            /* Card styling optimized for print */
            .card,
            [class*="bg-white"],
            [class*="border"] {
              background: white !important;
              border: 1px solid #d1d5db !important;
              border-radius: 4px !important;
              box-shadow: none !important;
              margin-bottom: 16px !important;
              padding: 12px !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Headings */
            h1, h2, h3, h4, h5, h6 { 
              color: #1f2937 !important; 
              margin-top: 0 !important;
              margin-bottom: 8px !important;
              page-break-after: avoid;
              break-after: avoid;
            }
            h1 { font-size: 18px !important; font-weight: bold; }
            h2 { font-size: 16px !important; font-weight: bold; }
            h3 { font-size: 14px !important; font-weight: 600; }
            
            /* Layout optimizations */
            .grid { 
              display: block !important; 
            }
            .grid > div {
              display: block !important;
              margin-bottom: 8px !important;
              page-break-inside: avoid;
            }
            
            .flex {
              display: block !important;
            }
            .flex > * {
              display: block !important;
              margin-bottom: 4px !important;
            }
            
            /* Spacing */
            .space-y-1 > * + *, .space-y-2 > * + *, .space-y-4 > * + *, .space-y-8 > * + * {
              margin-top: 4px !important;
            }
            .mb-4, .mb-6, .mb-8 { margin-bottom: 12px !important; }
            .p-4, .p-6, .px-4, .py-4 { padding: 8px !important; }
            
            /* Text styling */
            .text-xl { font-size: 16px !important; }
            .text-lg { font-size: 14px !important; }
            .text-base { font-size: 12px !important; }
            .text-sm { font-size: 11px !important; }
            .text-xs { font-size: 10px !important; }
            
            .font-bold { font-weight: bold !important; }
            .font-semibold { font-weight: 600 !important; }
            .font-medium { font-weight: 500 !important; }
            
            /* Chart containers */
            .recharts-wrapper,
            .recharts-surface,
            .chart-container {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              max-height: 300px !important;
              margin-bottom: 16px !important;
            }
            
            /* Remove backgrounds and shadows */
            [class*="bg-blue"], [class*="bg-gray"], [class*="bg-secondary"] {
              background: white !important;
              border: 1px solid #e5e7eb !important;
            }
            
            [class*="shadow"] {
              box-shadow: none !important;
            }
            
            /* PDF Viewer for print */
            .pdf-viewer,
            iframe {
              display: none !important;
            }
            
            /* Replace PDF viewer with message */
            .pdf-viewer::after {
              content: "📄 AI Meta-Analysis PDF available in digital version";
              display: block !important;
              padding: 16px !important;
              background: #f9fafb !important;
              border: 1px solid #d1d5db !important;
              border-radius: 4px !important;
              text-align: center !important;
              font-style: italic !important;
              color: #6b7280 !important;
            }
            
            /* Colors for print */
            .text-primary-600 { color: #2563eb !important; }
            .text-secondary-800 { color: #1f2937 !important; }
            .text-secondary-700 { color: #374151 !important; }
            .text-secondary-600 { color: #4b5563 !important; }
            .text-secondary-500 { color: #6b7280 !important; }
            
            /* Ensure proper page margins */
            @page {
              margin: 0.75in;
              size: letter;
            }
            
            @media print {
              * { 
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body { 
                print-color-adjust: exact !important; 
                -webkit-print-color-adjust: exact !important;
              }
              .no-print,
              button,
              .btn,
              .download-analytics-dropdown,
              svg:not(.chart-svg),
              .animate-spin { 
                display: none !important; 
              }
              
              /* Force page breaks before major sections */
              .ai-meta-analysis {
                page-break-before: always !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${printContent}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };

  } catch (error) {
    console.error('Error printing analytics view:', error);
    throw error;
  }
};

// Download analytics data as JSON
export const downloadAnalyticsAsJSON = (
  data: any,
  employeeName: string,
  quarterName: string
): void => {
  try {
    const filename = generateDownloadFilename(employeeName, quarterName, 'json' as any);
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.pdf', '.json');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading analytics as JSON:', error);
    throw error;
  }
};

// Basic HTML export (fallback when PDF libraries not available)
export const downloadAnalyticsAsHTML = (
  elementId: string = 'analytics-main-content',
  employeeName: string = 'Employee',
  quarterName: string = 'Quarter'
): void => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }

    const filename = generateDownloadFilename(employeeName, quarterName, 'html' as any);
    
    // Get all stylesheets
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Employee Analytics - ${employeeName} - ${quarterName}</title>
          <meta charset="UTF-8">
          <style>
            ${styles}
            body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <h1>Employee Analytics Report</h1>
          <p><strong>Employee:</strong> ${employeeName}</p>
          <p><strong>Quarter:</strong> ${quarterName}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          <hr>
          ${element.innerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.pdf', '.html');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading analytics as HTML:', error);
    throw error;
  }
};

// Type definition for export data
export interface AnalyticsExportData {
  employeeName: string;
  quarterName: string;
  overallScore?: number;
  attributeCount: number;
  completionRate?: number;
  generatedAt: string;
}

// Get structured analytics data for export
export const getAnalyticsExportData = (
  employeeName: string,
  quarterName: string,
  overallScore?: number,
  attributeCount: number = 0,
  completionRate?: number
): AnalyticsExportData => {
  return {
    employeeName,
    quarterName,
    overallScore,
    attributeCount,
    completionRate,
    generatedAt: new Date().toISOString()
  };
};

// Enhanced download function that tries multiple formats
export const downloadAnalyticsView = async (
  format: 'print' | 'html' | 'json' | 'pdf',
  elementId: string = 'analytics-main-content',
  employeeName: string = 'Employee',
  quarterName: string = 'Quarter',
  analyticsData?: any
): Promise<void> => {
  try {
    switch (format) {
      case 'pdf':
        await generatePDF(elementId, generateDownloadFilename(employeeName, quarterName, 'pdf'), employeeName, quarterName);
        break;
      case 'print':
        printAnalyticsView(elementId);
        break;
      case 'html':
        downloadAnalyticsAsHTML(elementId, employeeName, quarterName);
        break;
      case 'json':
        if (analyticsData) {
          downloadAnalyticsAsJSON(analyticsData, employeeName, quarterName);
        } else {
          throw new Error('Analytics data required for JSON export');
        }
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    console.error(`Error downloading analytics as ${format}:`, error);
    throw error;
  }
}; 