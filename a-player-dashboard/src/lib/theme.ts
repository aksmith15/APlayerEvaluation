/**
 * PDF Theme System
 * Unified theme system for React-PDF renderers with color psychology optimizations
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
  // Core identity colors - Color psychology optimized for each group
  primary: '#14B8A6',        // The Culture Base primary teal
  competence: '#1E88E5',      // Blue - Trust, reliability, competence
  character: '#D4AF37',       // Gold - Leadership, wisdom, character
  curiosity: '#2E7D32',       // Green - Growth, learning, curiosity
  
  // Sub-colors for each core group for attribute differentiation
  competenceSubColors: {
    dark: '#0D1B2A',        // Dark navy - Deep competence
    medium: '#1565C0',      // Medium blue - Core competence
    light: '#4682B4'        // Steel blue - Developing competence
  },
  characterSubColors: {
    dark: '#B8860B',        // Dark goldenrod - Strong character
    medium: '#FFBF00',      // Amber - Core character
    light: '#FFA500'        // Orange - Emerging character
  },
  curiositySubColors: {
    darkest: '#50C878',     // Emerald - Deep curiosity
    medium: '#A8E10C',      // Lime - Active curiosity  
    light: '#008080',       // Teal - Learning curiosity
    lightest: '#DFFF00'     // Electric lime - Bright curiosity
  },

  // Specific attribute color mapping using color psychology
  attributeColors: {
    // Competence - Blue Palette (Harmonized) - trust, professionalism, stability
    'quality of work': '#243B53',      // Indigo Navy - Deep but softer than previous
    'quality_of_work': '#243B53',      // Alternative underscore format
    'accountability': '#1E6091',       // Sapphire Blue - Strong, classic blue with depth
    'reliability': '#4A6FA5',          // Slate Blue - Calming mid-tone blue
    
    // Character - Warm Gold Palette (integrity, optimism, leadership)
    'leadership': '#B8860B',           // Rich Gold - authority, inspiration
    'teamwork': '#FFBF00',             // Warm Amber - inclusiveness, positive energy
    'communication': '#FFA500',        // Golden Orange - openness, clarity
    
    // Curiosity - Harmonized Green/Blue-Green Palette (growth, adaptability, innovation)
    'adaptability': '#4B8B3B',         // Olive Green - Warm, grounded green
    'continuous improvement': '#7BB661', // Spring Green - Fresh but not neon
    'continuous_improvement': '#7BB661', // Alternative underscore format
    'problem solving': '#2A8C82',      // Deep Teal - Balanced teal, less saturated
    'problem_solving': '#2A8C82',      // Alternative underscore format
    'taking initiative': '#C5D86D',   // Soft Chartreuse - Muted yellow-green for subtle energy
    'taking_initiative': '#C5D86D'    // Alternative underscore format
  },
  
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
 * Get core group color
 */
export const getCoreGroupColor = (coreGroup: 'competence' | 'character' | 'curiosity'): string => {
  return COLORS[coreGroup];
};

/**
 * Get sub-color for a specific core group and intensity
 */
export const getCoreGroupSubColor = (
  coreGroup: 'competence' | 'character' | 'curiosity', 
  intensity: string
): string => {
  switch (coreGroup) {
    case 'competence':
      return COLORS.competenceSubColors[intensity as keyof typeof COLORS.competenceSubColors] || COLORS.competence;
    case 'character':
      return COLORS.characterSubColors[intensity as keyof typeof COLORS.characterSubColors] || COLORS.character;
    case 'curiosity':
      return COLORS.curiositySubColors[intensity as keyof typeof COLORS.curiositySubColors] || COLORS.curiosity;
    default:
      return COLORS.primary;
  }
};

/**
 * Get an array of sub-colors for a core group (for attribute differentiation)
 */
export const getCoreGroupSubColorArray = (coreGroup: 'competence' | 'character' | 'curiosity'): string[] => {
  switch (coreGroup) {
    case 'competence':
      return [COLORS.competenceSubColors.dark, COLORS.competenceSubColors.medium, COLORS.competenceSubColors.light];
    case 'character':
      return [COLORS.characterSubColors.dark, COLORS.characterSubColors.medium, COLORS.characterSubColors.light];
    case 'curiosity':
      return [COLORS.curiositySubColors.darkest, COLORS.curiositySubColors.medium, COLORS.curiositySubColors.light, COLORS.curiositySubColors.lightest];
    default:
      return [COLORS.primary];
  }
};

/**
 * Get core group color for an attribute (simplified color system)
 * Maps attributes directly to their core group colors: Competence (Blue), Character (Gold), Curiosity (Green)
 */
export const getAttributeColor = (attributeName: string): string => {
  // Normalize the attribute name (lowercase, handle spaces and underscores)
  const normalizedName = attributeName.toLowerCase().trim()
    .replace(/\s+/g, ' ')  // normalize spaces
    .replace(/_/g, ' ');   // replace underscores with spaces

  // Competence attributes (Blue)
  const competenceAttributes = [
    'quality of work',
    'accountability', 
    'accountability for action',
    'reliability'
  ];

  // Character attributes (Gold)
  const characterAttributes = [
    'leadership',
    'teamwork', 
    'communication',
    'communication skills'
  ];

  // Curiosity attributes (Green)
  const curiosityAttributes = [
    'problem solving',
    'problem solving ability',
    'adaptability',
    'taking initiative',
    'continuous improvement'
  ];

  // Check for exact matches first
  if (competenceAttributes.includes(normalizedName)) {
    return COLORS.competence;
  }
  if (characterAttributes.includes(normalizedName)) {
    return COLORS.character;
  }
  if (curiosityAttributes.includes(normalizedName)) {
    return COLORS.curiosity;
  }

  // Fallback based on keywords for any variations
  if (normalizedName.includes('quality') || normalizedName.includes('accountability') || normalizedName.includes('reliability')) {
    return COLORS.competence;
  }
  if (normalizedName.includes('leadership') || normalizedName.includes('teamwork') || normalizedName.includes('communication')) {
    return COLORS.character;
  }
  if (normalizedName.includes('adaptability') || normalizedName.includes('improvement') || normalizedName.includes('problem') || normalizedName.includes('initiative')) {
    return COLORS.curiosity;
  }
  
  // Final fallback to primary color
  return COLORS.primary;
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

// Re-export calculateLetterGrade from pdfDataService
export { calculateLetterGrade } from '../services/pdfDataService';

/**
 * Convert typography weight to React-PDF compatible value
 */
export const getFontWeight = (weight: string): 'normal' | 'bold' => {
  return weight === 'bold' ? 'bold' : 'normal';
};

// Export everything for easy access - all exports are already defined above