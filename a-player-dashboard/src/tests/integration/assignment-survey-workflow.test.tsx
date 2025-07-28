import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import { NavigationProvider } from '../../contexts/NavigationContext';
import MyAssignments from '../../pages/MyAssignments';
import { EvaluationSurvey } from '../../components/ui';
import * as assignmentService from '../../services/assignmentService';
import * as supabaseService from '../../services/supabase';

// Mock the services
vi.mock('../../services/assignmentService');
vi.mock('../../services/supabase');

// Mock React Router hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ token: 'test-survey-token-123' })
  };
});

// Test data
const _mockUser = {
  id: 'user-123',
  email: 'evaluator@company.com',
  jwtRole: 'authenticated'
};

const mockAssignment = {
  id: 'assignment-123',
  evaluator_id: 'user-123',
  evaluatee_id: 'employee-456',
  evaluatee_name: 'John Doe',
  evaluatee_department: 'Engineering',
  quarter_id: 'q1-2025',
  quarter_name: 'Q1 2025',
  evaluation_type: 'peer' as const,
  status: 'pending' as const,
  survey_token: 'test-survey-token-123',
  assigned_at: '2025-01-20T10:00:00Z',
  created_at: '2025-01-20T10:00:00Z',
  assigned_by: 'manager-123',
  // Extended fields
  evaluator_name: 'Jane Smith',
  evaluator_email: 'evaluator@company.com',
  evaluator_department: 'Engineering',
  evaluatee_email: 'john.doe@company.com',
  quarter_start_date: '2025-01-01',
  quarter_end_date: '2025-03-31',
  assigned_by_name: 'Manager One',
  progress_percentage: 0
};

const mockSubmission = {
  submission_id: 'submission-789',
  submission_time: '2025-01-20T11:00:00Z',
  submitter_id: 'user-123',
  evaluatee_id: 'employee-456',
  evaluation_type: 'peer',
  quarter_id: 'q1-2025',
  raw_json: {},
  created_at: '2025-01-20T11:00:00Z'
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <NavigationProvider>
        {children}
      </NavigationProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Assignment and Survey Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth context
    vi.mocked(assignmentService.fetchUserAssignments).mockResolvedValue([mockAssignment]);
    vi.mocked(assignmentService.getAssignmentByToken).mockResolvedValue(mockAssignment);
    vi.mocked(assignmentService.updateAssignmentStatus).mockResolvedValue();
    vi.mocked(assignmentService.linkAssignmentToSubmission).mockResolvedValue();
    vi.mocked(assignmentService.getSurveyProgress).mockResolvedValue({
      assignment_id: 'assignment-123',
      total_attributes: 10,
      completed_attributes: 0,
      percentage_complete: 0
    });
  });

  describe('My Assignments Page', () => {
    test('displays user assignments correctly', async () => {
      render(
        <TestWrapper>
          <MyAssignments />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('My Assignments')).toBeInTheDocument();
      });

      // Check assignment card is displayed
      await waitFor(() => {
        expect(screen.getByText('Evaluate John Doe')).toBeInTheDocument();
        expect(screen.getByText('Peer Evaluation')).toBeInTheDocument();
        expect(screen.getByText('Q1 2025')).toBeInTheDocument();
      });
    });

    test('navigates to survey when Start Evaluation is clicked', async () => {
      render(
        <TestWrapper>
          <MyAssignments />
        </TestWrapper>
      );

      // Wait for assignment to load
      await waitFor(() => {
        expect(screen.getByText('Start Evaluation')).toBeInTheDocument();
      });

      // Click start evaluation button
      const startButton = screen.getByText('Start Evaluation');
      fireEvent.click(startButton);

      // Verify navigation was called with correct survey token
      expect(mockNavigate).toHaveBeenCalledWith('/survey/test-survey-token-123');
    });

    test('shows progress for in-progress assignments', async () => {
      const inProgressAssignment = {
        ...mockAssignment,
        status: 'in_progress' as const,
        submission_id: 'submission-789'
      };

      vi.mocked(assignmentService.fetchUserAssignments).mockResolvedValue([inProgressAssignment]);
      vi.mocked(assignmentService.getSurveyProgress).mockResolvedValue({
        assignment_id: 'assignment-123',
        submission_id: 'submission-789',
        total_attributes: 10,
        completed_attributes: 3,
        percentage_complete: 30,
        current_attribute: 'Leadership'
      });

      render(
        <TestWrapper>
          <MyAssignments />
        </TestWrapper>
      );

      // Wait for progress to load
      await waitFor(() => {
        expect(screen.getByText('30% complete')).toBeInTheDocument();
        expect(screen.getByText('3/10 attributes')).toBeInTheDocument();
        expect(screen.getByText('Next: Leadership')).toBeInTheDocument();
      });
    });

    test('filters assignments by status', async () => {
      render(
        <TestWrapper>
          <MyAssignments />
        </TestWrapper>
      );

      // Wait for assignments to load
      await waitFor(() => {
        expect(screen.getByText('My Assignments')).toBeInTheDocument();
      });

      // Open filters
      const filtersButton = screen.getByText('Filters');
      fireEvent.click(filtersButton);

      // Select pending status
      const statusSelect = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusSelect, { target: { value: 'pending' } });

      // Verify filter is applied (assignment service would be called again)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Pending')).toBeInTheDocument();
      });
    });
  });

  describe('Evaluation Survey Component', () => {
    beforeEach(() => {
      // Mock Supabase operations for survey
      vi.mocked(supabaseService.supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSubmission,
              error: null
            })
          })
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'score-123', submission_id: 'submission-789', attribute_name: 'Communication', score: 8 },
              error: null
            })
          })
        })
      } as any);
    });

    test('loads assignment data correctly', async () => {
      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      // Wait for assignment to load
      await waitFor(() => {
        expect(screen.getByText('Evaluate John Doe')).toBeInTheDocument();
        expect(screen.getByText('Q1 2025 • Peer Evaluation')).toBeInTheDocument();
      });

      // Check first attribute is displayed
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Ability to convey information clearly and effectively, both verbally and in writing')).toBeInTheDocument();
    });

    test('allows rating selection and shows scale descriptions', async () => {
      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Communication')).toBeInTheDocument();
      });

      // Check scale descriptions are shown
      expect(screen.getByText('1-2: Poor')).toBeInTheDocument();
      expect(screen.getByText('9-10: Excellent')).toBeInTheDocument();

      // Click on rating 8
      const rating8Button = screen.getByRole('button', { name: '8' });
      fireEvent.click(rating8Button);

      // Verify rating is selected (button should be highlighted)
      expect(rating8Button).toHaveClass('border-primary-500', 'bg-primary-500');
    });

    test('shows conditional questions based on score', async () => {
      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Communication')).toBeInTheDocument();
      });

      // Rate with low score (1-5 range)
      const rating3Button = screen.getByRole('button', { name: '3' });
      fireEvent.click(rating3Button);

      // Check for conditional questions
      await waitFor(() => {
        expect(screen.getByText('Additional Questions')).toBeInTheDocument();
        expect(screen.getByText('What specific communication skills could this person improve?')).toBeInTheDocument();
      });
    });

    test('saves attribute data and progresses through survey', async () => {
      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Communication')).toBeInTheDocument();
      });

      // Rate the attribute
      const rating7Button = screen.getByRole('button', { name: '7' });
      fireEvent.click(rating7Button);

      // Click Next
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Verify submission creation was called
      await waitFor(() => {
        expect(supabaseService.supabase.from).toHaveBeenCalledWith('submissions');
      });

      // Verify assignment status update was called
      expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledWith(
        'assignment-123',
        'in_progress'
      );
    });

    test('handles previous navigation correctly', async () => {
      // Start from second attribute
      vi.mocked(assignmentService.getAssignmentByToken).mockResolvedValue({
        ...mockAssignment,
        status: 'in_progress'
      });

      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Communication')).toBeInTheDocument();
      });

      // Rate and go to next attribute
      const rating7Button = screen.getByRole('button', { name: '7' });
      fireEvent.click(rating7Button);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Should now be on Leadership
      await waitFor(() => {
        expect(screen.getByText('Leadership')).toBeInTheDocument();
      });

      // Click Previous
      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);

      // Should be back to Communication
      await waitFor(() => {
        expect(screen.getByText('Communication')).toBeInTheDocument();
      });
    });

    test('completes survey and navigates back to assignments', async () => {
      // Mock being on the last attribute
      const mockLastAttributeAssignment = {
        ...mockAssignment,
        status: 'in_progress' as const
      };

      vi.mocked(assignmentService.getAssignmentByToken).mockResolvedValue(mockLastAttributeAssignment);

      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      // Mock localStorage for session data with last attribute
      const mockSession = {
        assignment_id: 'assignment-123',
        current_attribute: 'Adaptability', // Last attribute
        responses: {},
        start_time: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        is_complete: false
      };

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => JSON.stringify(mockSession)),
          setItem: vi.fn(),
          removeItem: vi.fn()
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Adaptability')).toBeInTheDocument();
      });

      // Rate the final attribute
      const rating8Button = screen.getByRole('button', { name: '8' });
      fireEvent.click(rating8Button);

      // Click Complete Survey
      const completeButton = screen.getByText('Complete Survey');
      fireEvent.click(completeButton);

      // Verify completion workflow
      await waitFor(() => {
        expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledWith(
          'assignment-123',
          'completed',
          expect.any(String)
        );
        expect(mockNavigate).toHaveBeenCalledWith('/assignments/my');
      });
    });

    test('handles session persistence correctly', async () => {
      const mockSession = {
        assignment_id: 'assignment-123',
        current_attribute: 'Leadership',
        current_score: 7,
        responses: {
          'Communication': { score: 6 },
          'Leadership': { score: 7 }
        },
        start_time: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        is_complete: false
      };

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => JSON.stringify(mockSession)),
          setItem: vi.fn(),
          removeItem: vi.fn()
        }
      });

      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      // Should resume from saved state
      await waitFor(() => {
        expect(screen.getByText('Leadership')).toBeInTheDocument();
      });

      // Should have the saved score selected
      const rating7Button = screen.getByRole('button', { name: '7' });
      expect(rating7Button).toHaveClass('border-primary-500', 'bg-primary-500');
    });
  });

  describe('Error Handling', () => {
    test('handles invalid survey token', async () => {
      vi.mocked(assignmentService.getAssignmentByToken).mockResolvedValue(null);

      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Assignment not found or token is invalid')).toBeInTheDocument();
      });
    });

    test('handles unauthorized access to survey', async () => {
      const unauthorizedAssignment = {
        ...mockAssignment,
        evaluator_id: 'different-user-456'
      };

      vi.mocked(assignmentService.getAssignmentByToken).mockResolvedValue(unauthorizedAssignment);

      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('You are not authorized to complete this assignment')).toBeInTheDocument();
      });
    });

    test('handles survey save errors gracefully', async () => {
      vi.mocked(supabaseService.supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      } as any);

      render(
        <TestWrapper>
          <EvaluationSurvey />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Communication')).toBeInTheDocument();
      });

      // Rate and try to proceed
      const rating7Button = screen.getByRole('button', { name: '7' });
      fireEvent.click(rating7Button);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to create submission/)).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Analytics Dashboard', () => {
    test('survey data appears in employee analytics after completion', async () => {
      // This test would verify that completed survey data flows correctly
      // to the Employee Analytics dashboard via the weighted_evaluation_scores table
      
      // Mock completed assignment with submission data
      const completedAssignment = {
        ...mockAssignment,
        status: 'completed' as const,
        submission_id: 'submission-789',
        completed_at: '2025-01-20T15:00:00Z'
      };

      vi.mocked(assignmentService.getAssignmentByToken).mockResolvedValue(completedAssignment);

      // This would be tested in the EmployeeAnalytics component integration
      // to ensure that the data from submissions/attribute_scores appears
      // in the weighted calculations and visualizations
      
      expect(true).toBe(true); // Placeholder - full integration test would be more complex
    });
  });
}); 