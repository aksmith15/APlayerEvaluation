import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, ErrorMessage } from '../components/ui';
import { ROUTES, APP_CONFIG } from '../constants/config';

interface LoginFormData {
  email: string;
  password: string;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, error: authError, login, clearError } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate(ROUTES.EMPLOYEE_SELECTION);
    }
  }, [user, authLoading, navigate]);

  // Clear errors when form data changes
  useEffect(() => {
    if (error || authError) {
      setError(null);
      clearError();
    }
  }, [formData, error, authError, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await login(formData);
      // Navigation will happen automatically via useEffect when user state updates
      
    } catch (err) {
      // Error is handled by auth context, but we can show additional validation
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking initial auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  const displayError = error || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="w-full max-w-sm">
        <div className="card p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-secondary-800 mb-1">
              {APP_CONFIG.TITLE}
            </h1>
            <p className="text-sm text-secondary-600">
              Manager Authentication
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-secondary-300 
                          transition-all duration-200 ease-out
                          focus:outline-none focus:ring-2 focus:ring-primary-500 
                          focus:border-primary-500 focus:shadow-sm
                          placeholder:text-secondary-400
                          disabled:bg-secondary-50 disabled:cursor-not-allowed
                          hover:border-secondary-400 hover:shadow-sm"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-secondary-300 
                          transition-all duration-200 ease-out
                          focus:outline-none focus:ring-2 focus:ring-primary-500 
                          focus:border-primary-500 focus:shadow-sm
                          placeholder:text-secondary-400
                          disabled:bg-secondary-50 disabled:cursor-not-allowed
                          hover:border-secondary-400 hover:shadow-sm"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {displayError && (
              <div className="mt-3">
                <ErrorMessage message={displayError} />
              </div>
            )}

            <div className="mt-5">
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                disabled={loading || !formData.email.trim() || !formData.password.trim()}
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-secondary-500">
              {APP_CONFIG.DESCRIPTION}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 