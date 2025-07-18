// Test utilities for React Testing Library
import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from './contexts/AuthContext'
import { NavigationProvider } from './contexts/NavigationContext'

// Mock Supabase client for testing
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'test-user', name: 'Test User', role: 'Manager' },
          error: null
        })
      })
    })
  })
}

// Mock context providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data for testing
export const mockEmployeeData = {
  id: 'emp-123',
  name: 'John Doe',
  email: 'john.doe@company.com',
  department: 'Engineering',
  role: 'Employee',
  manager_id: 'mgr-456'
}

export const mockEvaluationData = {
  id: 'eval-123',
  employee_id: 'emp-123',
  quarter: 'Q4 2024',
  leadership_score: 8.5,
  ownership_score: 7.8,
  communication_score: 9.2,
  delivery_score: 8.1,
  overall_score: 8.4,
  created_at: '2024-01-15T10:00:00Z'
}

export const mockChartData = [
  { quarter: 'Q1 2024', leadership: 8.0, ownership: 7.5, communication: 8.8, delivery: 7.9 },
  { quarter: 'Q2 2024', leadership: 8.2, ownership: 7.8, communication: 9.0, delivery: 8.1 },
  { quarter: 'Q3 2024', leadership: 8.4, ownership: 8.0, communication: 9.1, delivery: 8.3 },
  { quarter: 'Q4 2024', leadership: 8.5, ownership: 7.8, communication: 9.2, delivery: 8.1 }
]

// Mock Supabase client
export { mockSupabaseClient } 