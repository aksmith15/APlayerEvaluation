// Authentication types

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  // Add JWT role for RLS policies
  jwtRole?: 'hr_admin' | 'super_admin' | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
} 