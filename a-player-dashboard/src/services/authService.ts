import { supabase } from './supabase';
import type { LoginCredentials, User } from '../types/auth';

// Enhanced timeout helper function with retry capability
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

// Enhanced timeout helper function with better error reporting

// Global state for ultra-aggressive caching to handle React StrictMode
let currentSessionPromise: Promise<any> | null = null;
let globalUserProfile: any = null;
let globalAuthComplete = false;
let lastSuccessfulAuthTime = 0;
let authInitializationPhase = true; // Track if we're still in initialization
const AUTH_CACHE_DURATION = 30000; // 30 seconds cache

// Reset global state on hot module reload (development only)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    currentSessionPromise = null;
    globalUserProfile = null;
    globalAuthComplete = false;
    lastSuccessfulAuthTime = 0;
    authInitializationPhase = true;
  });
}

// Authentication service functions
export const authService = {
  // Sign in with email and password
  async signIn(credentials: LoginCredentials): Promise<User> {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        }),
        10000,
        'Login request timed out'
      );

      if (error) throw error;
      
      if (!data.user) {
        throw new Error('No user data returned');
      }

      console.log('Auth successful, attempting to fetch profile...');

      // Get additional user profile from people table
      const profile = await this.getUserProfile(data.user.email!);

      // CRITICAL: Always use people table ID for assignment creation
      if (!profile?.id) {
        console.error('❌ AUTHORIZATION FAILURE: No people table record found for email:', data.user.email);
        console.error('💡 Solution: Add this user to the people table with appropriate jwt_role');
        throw new Error(`Access denied: No people table record found for ${data.user.email}. Contact administrator to set up your account.`);
      }

      // Verify user has proper role for assignment creation
      if (!profile.jwtRole || !['super_admin', 'hr_admin'].includes(profile.jwtRole)) {
        console.warn('⚠️ User has people table record but no admin role:', {
          email: data.user.email,
          people_id: profile.id,
          jwt_role: profile.jwtRole
        });
      }

      const user: User = {
        id: profile.id, // ALWAYS use people table ID - this fixes assignment creation
        email: data.user.email!,
        name: profile.name || data.user.user_metadata?.name || 'User',
        role: profile.role || 'Manager',
        department: profile.department || 'Default',
        jwtRole: profile.jwtRole || null
      };

      console.log('✅ Authentication successful with people table integration:', {
        auth_email: data.user.email,
        people_id: user.id,
        jwt_role: user.jwtRole,
        can_create_assignments: ['super_admin', 'hr_admin'].includes(user.jwtRole || '')
      });

      // Update JWT custom claims if user has elevated role
      if (profile?.jwtRole) {
        await this.updateJWTClaims(profile.jwtRole);
      }

      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Sign out current user
  async signOut(): Promise<void> {
    try {
      // Clear global auth cache immediately (even if logout fails)
      globalUserProfile = null;
      globalAuthComplete = false;
      currentSessionPromise = null;
      lastSuccessfulAuthTime = 0;
      authInitializationPhase = true;
      
      console.log('🚪 Signing out...');
      
      // Try logout with longer timeout, but don't fail if it times out
      try {
        const { error } = await withTimeout(
          supabase.auth.signOut(),
          10000,  // Increased timeout to 10 seconds
          'Logout request timed out'
        );
        if (error) {
          console.warn('Logout warning (but continuing):', error);
        } else {
          console.log('✅ Logout successful');
        }
      } catch (timeoutError) {
        // Don't throw on timeout - the user is still logged out locally
        console.warn('⚠️ Logout timed out but local session cleared:', timeoutError);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Don't re-throw - we've cleared local state which is most important
    }
  },

  // Clear auth cache (for development/testing)
  clearAuthCache(): void {
    globalUserProfile = null;
    globalAuthComplete = false;
    currentSessionPromise = null;
    lastSuccessfulAuthTime = 0;
    authInitializationPhase = true;
    console.log('🧹 Auth cache cleared');
  },

  // Helper function to get user profile with timeout and JWT role + smart caching
  async getUserProfile(email: string): Promise<{ 
    id: string;
    name: string; 
    role: string; 
    department: string; 
    jwtRole?: 'hr_admin' | 'super_admin' | null;
  } | null> {
    // Check if we already have this profile cached (avoid redundant fetches)
    if (globalUserProfile && globalUserProfile.email === email && 
        (Date.now() - lastSuccessfulAuthTime) < AUTH_CACHE_DURATION) {
      console.log('⚡ Returning cached profile for:', email);
      return {
        id: globalUserProfile.id,
        name: globalUserProfile.name,
        role: globalUserProfile.role,
        department: globalUserProfile.department,
        jwtRole: globalUserProfile.jwtRole
      };
    }
    
    try {
      console.log('🔍 Fetching fresh profile for:', email);
      console.log('Starting people table lookup...');
      
      // Enhanced timeout and retry for database operations
      let profile = null;
      let profileError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔍 Profile lookup attempt ${attempt}/3...`);
          
          // Create timeout promise for this attempt
          const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
            setTimeout(() => resolve({ 
              data: null, 
              error: new Error(`Profile query timed out (attempt ${attempt})`) 
            }), 5000); // Reduced timeout from 15s to 5s
          });

          // SIMPLIFIED APPROACH: Direct query to people table by email
          // The RLS policies will handle security, and we have profiles bridge now
          console.log('🔍 Querying people table directly by email (profiles bridge should enable RLS)');
          
          const queryPromise = supabase
            .from('people')
            .select('id, name, role, department, jwt_role')
            .eq('email', email)
            .limit(1)
            .single();

          const result = await Promise.race([queryPromise, timeoutPromise]);
          
          profile = result.data;
          profileError = result.error;
          
          if (!profileError) {
            console.log(`✅ Profile lookup successful on attempt ${attempt}`);
            break;
          }
          
        } catch (error) {
          console.error(`❌ Profile lookup attempt ${attempt} failed:`, error);
          profileError = error;
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < 3 && profileError) {
          const delay = 1500 * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (profileError) {
        console.error('Profile lookup failed:', profileError);
        console.error('Email being searched:', email);
        return null;
      }

      if (profile) {
        console.log('✅ People table lookup successful during auth:', profile);
        console.log('Profile ID:', profile.id);
        console.log('JWT Role:', profile.jwt_role);
        
        return {
          id: profile.id,
          name: profile.name || 'User',
          role: profile.role || 'Manager',
          department: profile.department || 'Default',
          jwtRole: profile.jwt_role || null
        };
      } else {
        console.error('❌ No profile found for email:', email);
        console.error('This will cause assignment creation to fail!');
        return null;
      }
    } catch (error) {
      console.warn('Profile query failed:', error);
      return null;
    }
  },

  // Update JWT custom claims (simplified version)
  async updateJWTClaims(role: 'hr_admin' | 'super_admin'): Promise<void> {
    try {
      // For now, we'll use Supabase's built-in user metadata
      // In a production setup, you'd use a database function or auth hook
      const { error } = await supabase.auth.updateUser({
        data: { role: role }
      });
      
      if (error) {
        console.warn('Could not update JWT claims:', error);
      } else {
        console.log('JWT claims updated with role:', role);
      }
    } catch (error) {
      console.warn('Failed to update JWT claims:', error);
    }
  },

  // Get current user session with ultra-aggressive caching for React StrictMode
  async getCurrentUser(): Promise<User | null> {
    const now = Date.now();
    
    // Ultra-fast cache check - return cached result if recent
    if (globalAuthComplete && globalUserProfile && (now - lastSuccessfulAuthTime) < AUTH_CACHE_DURATION) {
      console.log('⚡ Returning cached user profile (ultra-fast)...');
      return globalUserProfile;
    }

    // Return existing promise if one is already running
    if (currentSessionPromise) {
      console.log('🔄 Reusing existing session check...');
      return currentSessionPromise;
    }

    console.log('🔍 Performing new session check...');
    
    // Create and store the session promise
    currentSessionPromise = this._performSessionCheck();
    
    try {
      const result = await currentSessionPromise;
      if (result) {
        globalUserProfile = result;
        globalAuthComplete = true;
        lastSuccessfulAuthTime = now;
        authInitializationPhase = false; // Mark initialization as complete
        console.log('✅ Session check successful - cached for 30s');
        console.log('💾 Global profile cached:', { email: result.email, id: result.id });
        console.log('🔧 Global state after cache:', { 
          hasGlobalProfile: !!globalUserProfile,
          globalAuthComplete,
          lastSuccessfulAuthTime 
        });
      }
      return result;
    } finally {
      // Clear the promise when done (success or failure)
      currentSessionPromise = null;
    }
  },

  // Internal method to perform the actual session check
  async _performSessionCheck(): Promise<User | null> {
    try {
      // Enhanced session check with timeout and retry
      let session = null;
      let error = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔍 Session check attempt ${attempt}/3...`);
          
          const result = await withTimeout(
            supabase.auth.getSession(),
            15000, // Increased timeout to 15 seconds
            `Session check timed out (attempt ${attempt})`
          );
          
          session = result.data.session;
          error = result.error;
          
          if (!error) {
            console.log(`✅ Session check successful on attempt ${attempt}`);
            break;
          }
          
        } catch (err) {
          console.error(`❌ Session check attempt ${attempt} failed:`, err);
          error = err;
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < 3 && error) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (error) {
        console.error('Session check error:', error);
        return null;
      }
      
      if (!session?.user) {
        console.log('No active session found');
        return null;
      }

      console.log('Active session found, fetching profile...');

      // Get additional user profile from people table
      const profile = await this.getUserProfile(session.user.email!);

      // CRITICAL: For assignment creation, must have people table record
      if (!profile?.id) {
        console.warn('⚠️ Session found but no people table record for:', session.user.email);
        // For getCurrentUser, we'll return null to force re-authentication
        return null;
      }

      const user = {
        id: profile.id, // ALWAYS use people table ID
        email: session.user.email!,
        name: profile.name || session.user.user_metadata?.name || 'User',
        role: profile.role || 'Manager', 
        department: profile.department || 'Default',
        jwtRole: profile.jwtRole || session.user.user_metadata?.role || null
      };

      console.log('✅ Session validated with people table integration:', {
        auth_email: session.user.email,
        people_id: user.id,
        jwt_role: user.jwtRole
      });

      console.log('Final user object:', user);
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Subscribe to auth state changes with initialization-aware logic
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change event:', event, !!session);
      
      if (session?.user) {
        // During initialization phase, defer to our main auth flow to avoid race conditions
        if (authInitializationPhase && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          console.log('⏳ Deferring auth state change during initialization phase');
          return;
        }
        
        // Transform session user directly instead of calling getCurrentUser to avoid loops
        try {
          // Enhanced cache logic for auth state changes
          const cacheAge = Date.now() - lastSuccessfulAuthTime;
          const cacheValid = globalUserProfile && 
                           globalAuthComplete && 
                           globalUserProfile.email === session.user.email &&
                           cacheAge < AUTH_CACHE_DURATION;
          
          // Debug logging for cache conditions
          if (event === 'USER_UPDATED') {
            console.log('🔍 USER_UPDATED cache check:', {
              hasGlobalProfile: !!globalUserProfile,
              globalEmail: globalUserProfile?.email,
              sessionEmail: session.user.email,
              cacheAge,
              cacheLimit: AUTH_CACHE_DURATION,
              globalAuthComplete,
              cacheValid
            });
          }
          
          // For token refreshes and user updates, ALWAYS use cached profile if valid
          if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && cacheValid) {
            console.log('⚡ Using cached profile for', event, {
              cacheAge,
              email: globalUserProfile.email
            });
            const user: User = {
              id: globalUserProfile.id,
              email: globalUserProfile.email,
              name: globalUserProfile.name,
              role: globalUserProfile.role,
              department: globalUserProfile.department,
              jwtRole: globalUserProfile.jwtRole
            };
            callback(user);
            return;
          }
          
          // Enhanced USER_UPDATED handling with timeout protection
          if (event === 'USER_UPDATED' && !cacheValid) {
            console.log('⚠️ USER_UPDATED with invalid cache - using safe fallback', {
              reason: !globalUserProfile ? 'no profile' : 
                      !globalAuthComplete ? 'auth incomplete' :
                      globalUserProfile.email !== session.user.email ? 'email mismatch' :
                      cacheAge >= AUTH_CACHE_DURATION ? 'cache expired' : 'unknown'
            });
            
            // For USER_UPDATED events, always use session fallback to prevent database timeouts
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.full_name || session.user.email!,
              role: globalUserProfile?.role || 'user', 
              department: globalUserProfile?.department || 'Unknown',
              jwtRole: globalUserProfile?.jwtRole || session.user.user_metadata?.jwt_role || 'user'
            };
            
            // Update cache with session-based user data to prevent future lookups
            globalUserProfile = user;
            globalAuthComplete = true;
            lastSuccessfulAuthTime = Date.now();
            
            callback(user);
            return;
          }

          // For USER_UPDATED events, if profile fetch fails, use session data as safe fallback
          let profile = null;
          try {
            console.log('🔍 Attempting profile fetch for', event, {
              globalProfileExists: !!globalUserProfile,
              globalAuthComplete,
              email: session.user.email
            });
            profile = await this.getUserProfile(session.user.email!);
          } catch (error) {
            if (event === 'USER_UPDATED') {
              console.log('⚠️ USER_UPDATED profile fetch failed, using session fallback');
              const user: User = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || 'User',
                role: 'Manager', 
                department: 'Department',
                jwtRole: session.user.user_metadata?.role || null
              };
              callback(user);
              return;
            }
            throw error; // Re-throw for other events
          }
          
          const user: User = {
            id: profile?.id || session.user.id, // Use people table ID if available, fallback to JWT ID  
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || 'Test User',
            role: profile?.role || 'Manager',
            department: profile?.department || 'Test Department',
            jwtRole: profile?.jwtRole || session.user.user_metadata?.role || null
          };
          
          callback(user);
        } catch (error) {
          console.warn('⚠️ Profile fetch failed during auth state change, using cached or fallback:', error);
          
          // Try to use cached profile as fallback
          if (globalUserProfile && globalUserProfile.email === session.user.email) {
            console.log('🔄 Using cached profile as fallback');
            const user: User = {
              id: globalUserProfile.id,
              email: globalUserProfile.email,
              name: globalUserProfile.name,
              role: globalUserProfile.role,
              department: globalUserProfile.department,
              jwtRole: globalUserProfile.jwtRole
            };
            callback(user);
          } else {
            // Ultimate fallback using session data
            console.log('🔄 Using session data as ultimate fallback');
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || 'Test User',
              role: 'Manager',
              department: 'Test Department',
              jwtRole: session.user.user_metadata?.role || null
            };
            callback(user);
          }
        }
      } else {
        callback(null);
      }
    });
  }
}; 

// Force refresh JWT token and ensure proper transmission
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    console.log('🔄 Forcing JWT token refresh...');
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('❌ No valid session found');
      return false;
    }
    
    // Force refresh the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);
      return false;
    }
    
    console.log('✅ Token refreshed successfully:', refreshData?.session?.access_token ? 'New token received' : 'No new token');
    
    // Test the token immediately with a simple query
    const { data: testData, error: testError } = await supabase
      .from('people')
      .select('id, email')
      .limit(1);
    
    if (testError) {
      console.error('❌ Token test failed:', testError);
      return false;
    }
    
    console.log('✅ Token test successful:', testData);
    
    // Now test employee_quarter_notes specifically
    const { data: notesTestData, error: notesTestError } = await supabase
      .from('employee_quarter_notes')
      .select('*')
      .limit(1);
    
    if (notesTestError) {
      console.error('❌ Notes access still failing:', notesTestError);
      return false;
    }
    
    console.log('✅ Notes access working!', notesTestData ? `Found ${notesTestData.length} records` : 'No records found');
    return true;
    
  } catch (error) {
    console.error('❌ Refresh auth token error:', error);
    return false;
  }
}; 