/**
 * PDF Theme System
 * Extracted from pdfReportGenerator.ts for reuse across legacy and React-PDF renderers
 */

// Standardized Typography Scale
export const TYPOGRAPHY = {
  pageTitle: { size: 16, weight: 'bold' },      // Was 20
  sectionTitle: { size: 12, weight: 'bold' },   // Was 14
  subsectionTitle: { size: 10, weight: 'bold' }, // Was 11
  bodyLarge: { size: 9, weight: 'normal' },     // Was 10
  body: { size: 8, weight: 'normal' },          // Was 9
  caption: { size: 6, weight: 'normal' },       // Was 7
  dataLarge: { size: 18, weight: 'bold' },      // Was 24
  dataMedium: { size: 12, weight: 'bold' },     // Was 14
  dataSmall: { size: 9, weight: 'bold' }        // Was 10
};

// Standardized Layout System
export const LAYOUT = {
  pageMargin: 15,          // Reduced from 20mm
  contentWidth: 180,       // 210mm - (15mm * 2)
  columnWidth: 14,         // 180mm / 12 columns - gutters
  gutterWidth: 3,          // Space between columns
  sectionSpacing: 12,      // Space between major sections
  elementSpacing: 6,       // Space between elements
  lineHeight: {
    tight: 1.2,            // For headers
    normal: 1.4,           // For body text
    relaxed: 1.6           // For readability sections
  }
};

// Unified Color System
export const COLORS = {
  // Core identity colors - The Culture Base brand teal gradient
  primary: '#14B8A6',        // The Culture Base primary teal
  competence: '#0F766E',      // Darkest teal - most foundational
  character: '#14B8A6',       // Medium teal - interpersonal skills
  curiosity: '#2DD4BF',       // Lightest teal - growth mindset
  
  // Evaluator colors - clearly differentiated
  evaluators: {
    manager: '#7c3aed',       // Purple (authority)
    peer: '#00d4aa',         // Teal (collaboration)
    self: '#94a3b8'          // Cool gray (introspection)
  },
  
  // Performance indicators - traffic light system
  performance: {
    excellent: '#10b981',     // Emerald green
    good: '#00d4aa',         // Teal
    average: '#fbbf24',      // Yellow
    poor: '#ef4444'          // Red
  },
  
  // UI elements - cleaner, more modern
  ui: {
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    border: '#e2e8f0',
    divider: '#cbd5e1',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8'
  }
};

/**
 * Convert hex color to RGB array
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16), 
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

/**
 * Get performance category color based on score
 */
export const getPerformanceColor = (score: number): string => {
  if (score >= 8.0) return COLORS.performance.excellent;
  if (score >= 7.0) return COLORS.performance.good;
  if (score >= 6.0) return COLORS.performance.average;
  return COLORS.performance.poor;
};

/**
 * Get evaluator color
 */
export const getEvaluatorColor = (evaluator: 'manager' | 'peer' | 'self'): string => {
  return COLORS.evaluators[evaluator];
};

/**
 * Truncate text helper
 */
export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.substring(0, maxLength - 2) + '..' : text;
};

/**
 * Helper function to wrap text (jsPDF-compatible)
 * For React-PDF, this will need to be adapted since text wrapping works differently
 */
export const wrapText = (pdf: any, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = pdf.getTextWidth(testLine);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines;
};

// Re-export calculateLetterGrade from pdfDataService to maintain single source of truth
export { calculateLetterGrade } from '../services/pdfDataService';

/**
 * Convert typography weight to React-PDF compatible value
 */
export const getFontWeight = (weight: string): 'normal' | 'bold' => {
  return weight === 'bold' ? 'bold' : 'normal';
};

// Export everything for easy access - all exports are already defined above