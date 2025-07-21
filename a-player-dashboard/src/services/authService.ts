import { supabase } from './supabase';
import type { LoginCredentials, User } from '../types/auth';

// Timeout helper function
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

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

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || data.user.user_metadata?.name || 'Test User',
        role: profile?.role || 'Manager',
        department: profile?.department || 'Test Department',
        jwtRole: profile?.jwtRole || null
      };

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
      const { error } = await withTimeout(
        supabase.auth.signOut(),
        5000,
        'Logout request timed out'
      );
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Helper function to get user profile with timeout and JWT role
  async getUserProfile(email: string): Promise<{ 
    name: string; 
    role: string; 
    department: string; 
    jwtRole?: 'hr_admin' | 'super_admin' | null;
  } | null> {
    try {
      console.log('Fetching profile for:', email);
      
      // Create a timeout promise that matches the query result type
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
        setTimeout(() => resolve({ data: null, error: new Error('Profile query timed out') }), 5000);
      });

      // Execute the query - add jwt_role column if it exists
      const queryPromise = supabase
        .from('people')
        .select('name, role, department, jwt_role')
        .eq('email', email)
        .eq('active', true)
        .maybeSingle();

      const { data: profile, error: profileError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);

      if (profileError) {
        console.warn('Could not fetch user profile:', profileError);
        return null;
      }

      console.log('Profile found:', profile);
      
      if (!profile) return null;

      return {
        name: profile.name,
        role: profile.role,
        department: profile.department,
        jwtRole: profile.jwt_role || null
      };
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

  // Get current user session
  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('Checking current session...');
      
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        5000,
        'Session check timed out'
      );
      
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

      const user = {
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name || session.user.user_metadata?.name || 'Test User',
        role: profile?.role || 'Manager',
        department: profile?.department || 'Test Department',
        jwtRole: profile?.jwtRole || session.user.user_metadata?.role || null
      };

      console.log('Final user object:', user);
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Subscribe to auth state changes (simplified to avoid loops)
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, !!session);
      
      if (session?.user) {
        // Transform session user directly instead of calling getCurrentUser to avoid loops
        try {
          const profile = await this.getUserProfile(session.user.email!);
          
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || 'Test User',
            role: profile?.role || 'Manager',
            department: profile?.department || 'Test Department',
            jwtRole: profile?.jwtRole || session.user.user_metadata?.role || null
          };
          
          callback(user);
        } catch (error) {
          console.error('Error building user object on auth state change:', error);
          callback(null);
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