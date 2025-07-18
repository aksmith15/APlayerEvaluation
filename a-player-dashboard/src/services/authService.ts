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

      return {
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || data.user.user_metadata?.name || 'Test User',
        role: profile?.role || 'Manager',
        department: profile?.department || 'Test Department'
      };
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

  // Helper function to get user profile with timeout
  async getUserProfile(email: string): Promise<{ name: string; role: string; department: string } | null> {
    try {
      console.log('Fetching profile for:', email);
      
      // Create a timeout promise that matches the query result type
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
        setTimeout(() => resolve({ data: null, error: new Error('Profile query timed out') }), 5000);
      });

      // Execute the query
      const queryPromise = supabase
        .from('people')
        .select('name, role, department')
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
      return profile;
    } catch (error) {
      console.warn('Profile query failed:', error);
      return null;
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
        department: profile?.department || 'Test Department'
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
            department: profile?.department || 'Test Department'
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