/**
 * Quarter utility functions for determining current quarter and managing quarter selection
 */

export interface QuarterInfo {
  year: number;
  quarter: number;
  quarterName: string; // e.g., "Q1 2025"
  startDate: Date;
  endDate: Date;
}

/**
 * Get the current quarter based on today's date
 * Q1: January 1st to March 31st 
 * Q2: April 1st to June 30th 
 * Q3: July 1st to September 30th 
 * Q4: October 1st to December 31st 
 */
export const getCurrentQuarter = (): QuarterInfo => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based (0 = January)
  
  let quarter: number;
  let startMonth: number;
  let endMonth: number;
  let endDay: number;
  
  if (month >= 0 && month <= 2) {
    // Q1: January (0) to March (2)
    quarter = 1;
    startMonth = 0; // January
    endMonth = 2; // March
    endDay = 31;
  } else if (month >= 3 && month <= 5) {
    // Q2: April (3) to June (5)
    quarter = 2;
    startMonth = 3; // April
    endMonth = 5; // June
    endDay = 30;
  } else if (month >= 6 && month <= 8) {
    // Q3: July (6) to September (8)
    quarter = 3;
    startMonth = 6; // July
    endMonth = 8; // September
    endDay = 30;
  } else {
    // Q4: October (9) to December (11)
    quarter = 4;
    startMonth = 9; // October
    endMonth = 11; // December
    endDay = 31;
  }
  
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth, endDay);
  const quarterName = `Q${quarter} ${year}`;
  
  return {
    year,
    quarter,
    quarterName,
    startDate,
    endDate
  };
};

/**
 * Get quarter info for a specific year and quarter number
 */
export const getQuarterInfo = (year: number, quarter: number): QuarterInfo => {
  let startMonth: number;
  let endMonth: number;
  let endDay: number;
  
  switch (quarter) {
    case 1:
      startMonth = 0; // January
      endMonth = 2; // March
      endDay = 31;
      break;
    case 2:
      startMonth = 3; // April
      endMonth = 5; // June
      endDay = 30;
      break;
    case 3:
      startMonth = 6; // July
      endMonth = 8; // September
      endDay = 30;
      break;
    case 4:
      startMonth = 9; // October
      endMonth = 11; // December
      endDay = 31;
      break;
    default:
      throw new Error(`Invalid quarter: ${quarter}. Must be 1, 2, 3, or 4.`);
  }
  
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth, endDay);
  const quarterName = `Q${quarter} ${year}`;
  
  return {
    year,
    quarter,
    quarterName,
    startDate,
    endDate
  };
};

/**
 * Find the matching quarter from a list of quarters based on current date
 * Returns the quarter that matches the current quarter, or null if not found
 */
export const findCurrentQuarterInList = (quarters: any[]): any | null => {
  const currentQuarter = getCurrentQuarter();
  
  // Try to find by name first (most reliable)
  const byName = quarters.find(q => 
    q.name === currentQuarter.quarterName || 
    q.name.toLowerCase() === currentQuarter.quarterName.toLowerCase()
  );
  
  if (byName) {
    console.log('📅 Found current quarter by name:', byName.name);
    return byName;
  }
  
  // Fallback: try to find by date range
  const now = new Date();
  const byDateRange = quarters.find(q => {
    if (!q.startDate || !q.endDate) return false;
    
    const startDate = new Date(q.startDate);
    const endDate = new Date(q.endDate);
    
    return now >= startDate && now <= endDate;
  });
  
  if (byDateRange) {
    console.log('📅 Found current quarter by date range:', byDateRange.name);
    return byDateRange;
  }
  
  // If still not found, try to find the most recent quarter
  const sortedQuarters = quarters
    .filter(q => q.startDate)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  if (sortedQuarters.length > 0) {
    console.log('📅 Using most recent quarter as fallback:', sortedQuarters[0].name);
    return sortedQuarters[0];
  }
  
  console.warn('📅 No suitable current quarter found in list');
  return null;
};

/**
 * Check if a date falls within a specific quarter
 */
export const isDateInQuarter = (date: Date, quarter: QuarterInfo): boolean => {
  return date >= quarter.startDate && date <= quarter.endDate;
};

/**
 * Get the quarter name for display purposes
 */
export const getQuarterDisplayName = (year: number, quarter: number): string => {
  return `Q${quarter} ${year}`;
};

/**
 * Debug function to log current quarter info
 */
export const logCurrentQuarter = (): void => {
  const current = getCurrentQuarter();
  console.log('📅 Current Quarter Info:', {
    name: current.quarterName,
    quarter: current.quarter,
    year: current.year,
    startDate: current.startDate.toISOString().split('T')[0],
    endDate: current.endDate.toISOString().split('T')[0],
    today: new Date().toISOString().split('T')[0]
  });
}; 