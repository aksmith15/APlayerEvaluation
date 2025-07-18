// Authentication Flow Integration Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import { authService } from '../../services/authService'

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    getUserProfile: vi.fn()
  }
}))

// Mock react-router-dom for navigation testing
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // Keep other router components but provide controlled navigation
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  }
})

const mockAuthService = vi.mocked(authService)

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    // Reset auth state
    mockAuthService.getCurrentUser.mockResolvedValue(null)
    mockAuthService.signOut.mockResolvedValue(undefined)
  })

  describe('Initial Authentication State', () => {
    it('shows login page when user is not authenticated', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      // Use custom render that already provides router context
      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('redirects to employee selection when user is authenticated as manager', async () => {
      const mockManagerUser = {
        id: 'manager-123',
        email: 'manager@company.com',
        role: 'Manager'
      }
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockManagerUser)
      
      // Use custom render that already provides router context
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/employee selection/i)).toBeInTheDocument()
      })

      expect(screen.queryByRole('heading', { name: /login/i })).not.toBeInTheDocument()
    })
  })

  describe('Login Process', () => {
    it('successfully logs in and navigates to employee selection', async () => {
      const user = userEvent.setup()
      
      // Start with no user
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      // Use custom render that already provides router context
      render(<App />)

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'manager@company.com')
      await user.type(passwordInput, 'password123')

      // Mock successful login
      const mockUser = {
        id: 'manager-123',
        email: 'manager@company.com',
        role: 'Manager'
      }
      
      mockAuthService.signIn.mockResolvedValue(mockUser)
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)

      await user.click(signInButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/employee-selection')
      })
    })

    it('shows error message for invalid credentials', async () => {
      const user = userEvent.setup()
      
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      // Use custom render that already provides router context
      render(<App />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'invalid@company.com')
      await user.type(passwordInput, 'wrongpassword')

      // Mock failed login
      mockAuthService.signIn.mockRejectedValue(new Error('Invalid login credentials'))

      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
      })
    })

    it('handles network errors during login', async () => {
      const user = userEvent.setup()
      
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      // Use custom render that already provides router context
      render(<App />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const signInButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'manager@company.com')
      await user.type(passwordInput, 'password123')

      // Mock network error
      mockAuthService.signIn.mockRejectedValue(new Error('Network error'))

      await user.click(signInButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Protected Routes', () => {
    it('redirects unauthenticated users to login when accessing protected routes', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null)
      
      // Use custom render that already provides router context
      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
      })
    })

    it('allows authenticated users to access protected routes', async () => {
      const mockUser = {
        id: 'manager-123',
        email: 'manager@company.com',
        role: 'Manager'
      }
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
      
      // Use custom render that already provides router context
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/employee selection/i)).toBeInTheDocument()
      })
    })
  })

  describe('Session Management', () => {
    it('maintains authentication state across page refreshes', async () => {
      const mockUser = {
        id: 'manager-123',
        email: 'manager@company.com',
        role: 'Manager'
      }
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
      
      // Use custom render that already provides router context
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/employee selection/i)).toBeInTheDocument()
      })

      // Simulate page refresh by re-rendering
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/employee selection/i)).toBeInTheDocument()
      })
    })

    it('handles session expiration gracefully', async () => {
      const mockUser = {
        id: 'manager-123',
        email: 'manager@company.com',
        role: 'Manager'
      }
      
      // Start authenticated
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
      
      // Use custom render that already provides router context
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/employee selection/i)).toBeInTheDocument()
      })

      // Simulate session expiration
      mockAuthService.getCurrentUser.mockResolvedValue(null)

      // Trigger auth state change
      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
      })
    })
  })

  describe('Logout Process', () => {
    it('successfully logs out and redirects to login', async () => {
      const mockUser = {
        id: 'manager-123',
        email: 'manager@company.com',
        role: 'Manager'
      }
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)
      
      // Use custom render that already provides router context
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/employee selection/i)).toBeInTheDocument()
      })

      // Find and click logout button
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await userEvent.setup().click(logoutButton)

      // Mock logout
      mockAuthService.signOut.mockResolvedValue(undefined)
      mockAuthService.getCurrentUser.mockResolvedValue(null)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })
  })
}) 