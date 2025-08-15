/**
 * Utility to clear authentication storage and resolve refresh token issues
 * Use this when users encounter "Invalid Refresh Token" errors
 */

export const clearAuthStorage = (): void => {
  try {
    console.log('🧹 Clearing authentication storage...');
    
    // Clear localStorage (Supabase stores auth tokens here)
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('supabase') || key.includes('auth'))) {
        authKeys.push(key);
      }
    }
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed localStorage key: ${key}`);
    });
    
    // Clear sessionStorage
    const sessionAuthKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('supabase') || key.includes('auth'))) {
        sessionAuthKeys.push(key);
      }
    }
    
    sessionAuthKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`Removed sessionStorage key: ${key}`);
    });
    
    console.log('✅ Authentication storage cleared successfully');
    console.log('🔄 Please refresh the page and log in again');
    
  } catch (error) {
    console.error('❌ Error clearing auth storage:', error);
  }
};

/**
 * Check if there are potentially stale auth tokens
 */
export const checkForStaleTokens = (): boolean => {
  try {
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('supabase.auth.token')) {
        authKeys.push(key);
      }
    }
    
    if (authKeys.length > 0) {
      console.log('🔍 Found auth tokens in storage:', authKeys);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking for stale tokens:', error);
    return false;
  }
};

// Development helper - expose to window in dev mode
if (import.meta.env.DEV) {
  (window as any).clearAuthStorage = clearAuthStorage;
  (window as any).checkForStaleTokens = checkForStaleTokens;
  console.log('🛠️ Dev tools available: clearAuthStorage(), checkForStaleTokens()');
}
