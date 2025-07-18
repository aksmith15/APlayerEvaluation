// Employee Selection Flow Integration Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test-utils'
import userEvent from '@testing-library/user-event'
import { EmployeeSelection } from '../../pages/EmployeeSelection'
import { authService } from '../../services/authService'
import * as dataFetching from '../../services/dataFetching'

// Mock navigation
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

// Mock services
vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    getUserProfile: vi.fn()
  }
}))

vi.mock('../../services/dataFetching')

const mockAuthService = vi.mocked(authService)
const mockDataFetching = vi.mocked(dataFetching)

// Mock employee data
const mockEmployeeData = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Senior Developer',
    department: 'Engineering',
    overallScore: 8.5,
    active: true,
    hire_date: '2023-01-15',
    created_at: '2023-01-15T10:00:00Z',
    latestQuarter: 'Q4 2023'
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane.doe@company.com',
    role: 'Product Manager',
    department: 'Product',
    overallScore: 9.1,
    active: true,
    hire_date: '2022-06-01',
    created_at: '2022-06-01T10:00:00Z',
    latestQuarter: 'Q4 2023'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    role: 'UX Designer',
    department: 'Design',
    overallScore: 7.8,
    active: true,
    hire_date: '2022-03-10',
    created_at: '2022-03-10T10:00:00Z',
    latestQuarter: 'Q4 2023'
  }
]

describe('Employee Selection Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    
    // Set up default auth state
    mockAuthService.getCurrentUser.mockResolvedValue({
      id: 'manager-123',
      email: 'manager@company.com',
      name: 'Test Manager',
      role: 'Manager',
      department: 'Management'
    })

    // Set up default data fetching
    mockDataFetching.fetchEmployees.mockResolvedValue(mockEmployeeData)
  })

  describe('Initial Page Load', () => {
    it('renders employee selection page with search and employee list', async () => {
      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search employees/i)).toBeInTheDocument()
      })

      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })

    it('displays overall scores for each employee', async () => {
      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
      })

      expect(screen.getByText('8.5')).toBeInTheDocument()
      expect(screen.getByText('9.1')).toBeInTheDocument()
      expect(screen.getByText('7.8')).toBeInTheDocument()
    })

    it('handles empty employee list gracefully', async () => {
      mockDataFetching.fetchEmployees.mockResolvedValue([])

      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText(/no employees found/i)).toBeInTheDocument()
      })
    })

    it('handles data fetching errors', async () => {
      mockDataFetching.fetchEmployees.mockRejectedValue(
        new Error('Failed to fetch employees')
      )

      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText(/error loading employees/i)).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('filters employees by name', async () => {
      const user = userEvent.setup()

      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search employees/i)
      
      await user.type(searchInput, 'John')

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
        expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
      })
    })

    it('filters employees by role', async () => {
      const user = userEvent.setup()

      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search employees/i)
      
      await user.type(searchInput, 'Product Manager')

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument()
        expect(screen.queryByText('John Smith')).not.toBeInTheDocument()
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
      })
    })

    it('filters employees by department', async () => {
      const user = userEvent.setup()

      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search employees/i)
      
      await user.type(searchInput, 'Engineering')

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
        expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
      })
    })

    it('shows no results message when search returns empty', async () => {
      const user = userEvent.setup()

      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search employees/i)
      
      await user.type(searchInput, 'NonexistentEmployee')

      await waitFor(() => {
        expect(screen.getByText(/no employees found/i)).toBeInTheDocument()
        expect(screen.queryByText('John Smith')).not.toBeInTheDocument()
      })
    })

    it('clears search and shows all employees when input is cleared', async () => {
      const user = userEvent.setup()

      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search employees/i)
      
      // Search to filter
      await user.type(searchInput, 'John')
      await waitFor(() => {
        expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
      })

      // Clear search
      await user.clear(searchInput)
      
      // Should show all employees again
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
        expect(screen.getByText('Jane Doe')).toBeInTheDocument()
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
      })
    })
  })

  describe('Employee Selection', () => {
    it('navigates to analytics page when employee is clicked', async () => {
      const user = userEvent.setup()

      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
      })

      // Click on employee
      const employeeCard = screen.getByText('John Smith').closest('[data-testid="employee-card"]') ||
                           screen.getByText('John Smith').closest('div')

      await user.click(employeeCard!)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/employee-analytics/1')
      })
    })

    it('shows employee details on hover', async () => {
      const user = userEvent.setup()

      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
      })

      const employeeCard = screen.getByText('John Smith').closest('div')
      
      await user.hover(employeeCard!)

      await waitFor(() => {
        expect(screen.getByText('john.smith@company.com')).toBeInTheDocument()
        expect(screen.getByText('Senior Developer')).toBeInTheDocument()
        expect(screen.getByText('Engineering')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Accessibility', () => {
    it('provides proper ARIA labels for screen readers', async () => {
      // Use custom render that already provides router context
      render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search employees/i)
      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('search'))
      
      const employeeList = screen.getByRole('list') || screen.getByTestId('employee-list')
      expect(employeeList).toHaveAttribute('aria-label', expect.stringContaining('employee'))
    })

    it('handles large employee lists efficiently', async () => {
      // Create a large mock dataset
             const largeEmployeeList = Array.from({ length: 100 }, (_, index) => ({
         id: `emp-${index}`,
         name: `Employee ${index}`,
         email: `employee${index}@company.com`,
         role: 'Developer',
         department: 'Engineering',
         overallScore: Math.round((Math.random() * 10) * 10) / 10,
         active: true,
         hire_date: '2023-01-01',
         created_at: '2023-01-01T10:00:00Z',
         latestQuarter: 'Q4 2023'
       }))

      mockDataFetching.fetchEmployees.mockResolvedValue(largeEmployeeList)

      const { container } = render(<EmployeeSelection />)

      await waitFor(() => {
        expect(screen.getByText('Employee 0')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Should render without performance issues
      expect(container.querySelectorAll('[data-testid="employee-card"]').length).toBeGreaterThan(0)
    })
  })
}) 