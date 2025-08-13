/**
 * Name utility functions for PDF generation
 * Provides standardized name formatting across PDF components
 */

/**
 * Extracts the first name from a full name
 * Handles various name formats and edge cases
 * 
 * @param fullName - The complete name (e.g., "John Smith", "Mary Jane Watson", "John")
 * @returns The first name only (e.g., "John", "Mary", "John")
 */
export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'This person';
  }
  
  // Trim whitespace and split by spaces
  const nameParts = fullName.trim().split(/\s+/);
  
  // Return the first part (first name)
  return nameParts[0] || 'This person';
}

/**
 * Formats name for use in PDF content
 * - Cover page: Uses full name for formal introduction
 * - All other pages: Uses first name only for personal/friendly tone
 * 
 * @param fullName - The complete name
 * @param isIntroduction - Whether this is an introduction/cover page context
 * @returns Formatted name appropriate for the context
 */
export function formatNameForPDF(fullName: string | null | undefined, isIntroduction: boolean = false): string {
  if (isIntroduction) {
    return fullName || 'Unknown Employee';
  }
  
  return getFirstName(fullName);
}

/**
 * Test cases for name extraction (for validation)
 */
export const testNameExtraction = () => {
  const testCases = [
    { input: 'John Smith', expected: 'John' },
    { input: 'Mary Jane Watson', expected: 'Mary' },
    { input: 'John', expected: 'John' },
    { input: '  Jane   Doe  ', expected: 'Jane' },
    { input: '', expected: 'This person' },
    { input: null, expected: 'This person' },
    { input: undefined, expected: 'This person' },
    { input: 'Jean-Claude Van Damme', expected: 'Jean-Claude' },
    { input: "O'Connor", expected: "O'Connor" }
  ];
  
  console.log('Name extraction test results:');
  testCases.forEach(({ input, expected }) => {
    const result = getFirstName(input as any);
    const passed = result === expected;
    console.log(`${passed ? '✅' : '❌'} "${input}" → "${result}" (expected: "${expected}")`);
  });
};
