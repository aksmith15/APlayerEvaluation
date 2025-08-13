/**
 * SurveyIntro Component Tests
 * Tests for the extracted survey introduction component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SurveyIntro } from './__mocks__/SurveyIntro';
import type { EvaluationAssignmentWithDetails } from '../../../../types/database';

// Mock assignment data
const mockAssignment: EvaluationAssignmentWithDetails = {
  id: 'test-assignment-id',
  evaluatee_name: 'John Doe',
  quarter_name: 'Q1 2024',
  created_at: '2024-01-15T10:00:00Z',
  evaluator_id: 'evaluator-1',
  evaluatee_id: 'evaluatee-1',
  quarter_id: 'quarter-1',
  status: 'pending',
  due_date: '2024-02-15T23:59:59Z',
  survey_token: 'test-token'
};

describe('SurveyIntro', () => {
  const mockProps = {
    assignment: mockAssignment,
    onStart: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders survey introduction with assignment details', () => {
    render(<SurveyIntro {...mockProps} />);

    expect(screen.getByText(/evaluation survey/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Q1 2024')).toBeInTheDocument();
  });

  it('displays formatted creation date', () => {
    render(<SurveyIntro {...mockProps} />);
    
    // Should display formatted date
    expect(screen.getByText(/january 15, 2024/i)).toBeInTheDocument();
  });

  it('shows start survey button', () => {
    render(<SurveyIntro {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: /start survey/i });
    expect(startButton).toBeInTheDocument();
  });

  it('calls onStart when start button is clicked', () => {
    render(<SurveyIntro {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: /start survey/i });
    fireEvent.click(startButton);
    
    expect(mockProps.onStart).toHaveBeenCalledTimes(1);
  });

  it('handles null assignment gracefully', () => {
    render(<SurveyIntro assignment={null} onStart={mockProps.onStart} />);
    
    expect(screen.getByText(/no assignment data/i)).toBeInTheDocument();
  });

  it('displays survey instructions', () => {
    render(<SurveyIntro {...mockProps} />);
    
    expect(screen.getByText(/please provide honest/i)).toBeInTheDocument();
    expect(screen.getByText(/evaluation will take/i)).toBeInTheDocument();
  });

  it('shows progress information', () => {
    render(<SurveyIntro {...mockProps} />);
    
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    expect(screen.getByText(/introduction/i)).toBeInTheDocument();
  });

  it('applies correct accessibility attributes', () => {
    render(<SurveyIntro {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: /start survey/i });
    expect(startButton).toHaveAttribute('type', 'button');
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });
});
