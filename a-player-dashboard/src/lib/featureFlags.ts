/**
 * Feature Flag System
 * Simple feature flag implementation for React-PDF rollout
 */

interface FeatureFlags {
  useReactPdf: boolean;
}

// Default feature flags - can be overridden via environment or runtime
const defaultFlags: FeatureFlags = {
  useReactPdf: false  // Legacy PDF generator by default (production-ready)
};

// Load runtime flags from localStorage if available
const loadRuntimeFlags = (): FeatureFlags => {
  try {
    const stored = localStorage.getItem('devFeatureFlags');
    if (stored) {
      return { ...defaultFlags, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load feature flags from localStorage:', error);
  }
  return { ...defaultFlags };
};

// Save runtime flags to localStorage
const saveRuntimeFlags = (flags: FeatureFlags): void => {
  try {
    localStorage.setItem('devFeatureFlags', JSON.stringify(flags));
  } catch (error) {
    console.warn('Failed to save feature flags to localStorage:', error);
  }
};

// Runtime feature flags (can be modified during development/testing)
let runtimeFlags: FeatureFlags = loadRuntimeFlags();

/**
 * Get current feature flag values
 */
export const getFeatureFlags = (): FeatureFlags => {
  // Check for environment variable override (safely handle browser environment)
  const envReactPdf = typeof process !== 'undefined' && process.env?.REACT_APP_USE_REACT_PDF;
  
  // Check for URL parameter override
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlReactPdf = urlParams?.get('reactpdf') === 'true';
  
  return {
    ...runtimeFlags,
    // URL parameter > Environment variable > Runtime flags
    useReactPdf: urlReactPdf || envReactPdf === 'true' || runtimeFlags.useReactPdf
  };
};

/**
 * Update feature flags at runtime (for testing/development)
 */
export const setFeatureFlag = (flag: keyof FeatureFlags, value: boolean): void => {
  runtimeFlags = {
    ...runtimeFlags,
    [flag]: value
  };
  saveRuntimeFlags(runtimeFlags);
};

/**
 * Reset feature flags to defaults
 */
export const resetFeatureFlags = (): void => {
  runtimeFlags = { ...defaultFlags };
  saveRuntimeFlags(runtimeFlags);
};

// Export flags object for easy access
export const flags = {
  get useReactPdf() {
    return getFeatureFlags().useReactPdf;
  }
};