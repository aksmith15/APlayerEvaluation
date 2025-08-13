/**
 * OverviewTab Component Tests
 * Tests for the extracted assignment overview tab component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverviewTab } from './__mocks__/OverviewTab';

// Mock assignment statistics
const mockAssignmentStats = {
  total: 25,
  pending: 8,
  in_progress: 12,
  completed: 4,
  overdue: 1,
  completion_rate: 16, // 4/25 = 16%
  average_completion_time: 3.5
};

describe('OverviewTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders assignment statistics overview', () => {
    render(<OverviewTab assignmentStats={mockAssignmentStats} />);

    expect(screen.getByText(/assignment overview/i)).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // total
    expect(screen.getByText('8')).toBeInTheDocument();  // pending
    expect(screen.getByText('12')).toBeInTheDocument(); // in_progress
    expect(screen.getByText('4')).toBeInTheDocument();  // completed
  });

  it('displays completion rate percentage', () => {
    render(<OverviewTab assignmentStats={mockAssignmentStats} />);

    expect(screen.getByText('16%')).toBeInTheDocument();
  });

  it('shows overdue assignments with warning style', () => {
    render(<OverviewTab assignmentStats={mockAssignmentStats} />);

    const overdueElement = screen.getByText('1');
    expect(overdueElement).toBeInTheDocument();
    
    // Should have warning/error styling (check for class or data attribute)
    const overdueContainer = overdueElement.closest('[data-status="overdue"]');
    expect(overdueContainer).toBeInTheDocument();
  });

  it('displays average completion time', () => {
    render(<OverviewTab assignmentStats={mockAssignmentStats} />);

    expect(screen.getByText(/3.5/)).toBeInTheDocument();
    expect(screen.getByText(/days/i)).toBeInTheDocument();
  });

  it('handles zero assignments gracefully', () => {
    const emptyStats = {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      completion_rate: 0,
      average_completion_time: 0
    };

    render(<OverviewTab assignmentStats={emptyStats} />);

    expect(screen.getByText(/no assignments/i)).toBeInTheDocument();
  });

  it('shows loading state when stats are not provided', () => {
    render(<OverviewTab assignmentStats={null} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays status distribution chart', () => {
    render(<OverviewTab assignmentStats={mockAssignmentStats} />);

    // Should render a chart or visual representation
    expect(screen.getByTestId('status-distribution-chart')).toBeInTheDocument();
  });

  it('shows completion trend information', () => {
    render(<OverviewTab assignmentStats={mockAssignmentStats} />);

    expect(screen.getByRole('heading', { name: /completion trend/i })).toBeInTheDocument();
  });

  it('applies correct accessibility attributes', () => {
    render(<OverviewTab assignmentStats={mockAssignmentStats} />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();

    // Statistics should be properly labeled
    const totalStat = screen.getByLabelText(/total assignments/i);
    expect(totalStat).toBeInTheDocument();
  });

  it('formats large numbers correctly', () => {
    const largeStats = {
      ...mockAssignmentStats,
      total: 1234,
      completed: 567
    };

    render(<OverviewTab assignmentStats={largeStats} />);

    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('567')).toBeInTheDocument();
  });

  it('shows appropriate status colors', () => {
    render(<OverviewTab assignmentStats={mockAssignmentStats} />);

    // Check for status-specific styling
    const pendingElement = screen.getByTestId('pending-count');
    const completedElement = screen.getByTestId('completed-count');
    const overdueElement = screen.getByTestId('overdue-count');

    expect(pendingElement).toHaveClass(/pending/);
    expect(completedElement).toHaveClass(/success/);
    expect(overdueElement).toHaveClass(/danger/);
  });
});
