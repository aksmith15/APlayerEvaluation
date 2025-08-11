/**
 * Development Tools
 * Utilities for testing and debugging feature flags
 */

import { setFeatureFlag, resetFeatureFlags, getFeatureFlags } from '../lib/featureFlags';

// Expose feature flag controls to global window for testing
declare global {
  interface Window {
    devTools: {
      enableReactPdf: () => void;
      disableReactPdf: () => void;
      toggleReactPdf: () => void;
      getFlags: () => object;
      resetFlags: () => void;
      clearStorage: () => void;
    };
  }
}

// Development tools for feature flag testing
export const devTools = {
  enableReactPdf: () => {
    setFeatureFlag('useReactPdf', true);
    console.log('🔧 React-PDF renderer ENABLED');
    console.log('Current flags:', getFeatureFlags());
  },
  
  disableReactPdf: () => {
    setFeatureFlag('useReactPdf', false);
    console.log('🔧 React-PDF renderer DISABLED (using legacy)');
    console.log('Current flags:', getFeatureFlags());
  },
  
  toggleReactPdf: () => {
    const current = getFeatureFlags().useReactPdf;
    setFeatureFlag('useReactPdf', !current);
    console.log(`🔧 React-PDF renderer ${!current ? 'ENABLED' : 'DISABLED'}`);
    console.log('Current flags:', getFeatureFlags());
  },
  
  getFlags: () => {
    return getFeatureFlags();
  },
  
  resetFlags: () => {
    resetFeatureFlags();
    console.log('🔧 Feature flags reset to defaults');
    console.log('Current flags:', getFeatureFlags());
  },
  
  clearStorage: () => {
    localStorage.removeItem('devFeatureFlags');
    console.log('🔧 Feature flag storage cleared');
  }
};

// Always expose devTools for development/testing (safe since this is imported conditionally)
if (typeof window !== 'undefined') {
  window.devTools = devTools;
  console.log('🔧 DevTools available: window.devTools');
  console.log('Commands: enableReactPdf(), disableReactPdf(), toggleReactPdf(), getFlags(), resetFlags(), clearStorage()');
}