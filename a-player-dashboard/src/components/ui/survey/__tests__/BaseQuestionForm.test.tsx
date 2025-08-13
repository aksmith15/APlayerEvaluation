/**
 * BaseQuestionForm Component Tests
 * Tests for the extracted base question form component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseQuestionForm } from '../BaseQuestionForm';
import { COMPREHENSIVE_ATTRIBUTE_DEFINITIONS } from '../constants-simple';

describe('BaseQuestionForm', () => {
  const mockQuestion = COMPREHENSIVE_ATTRIBUTE_DEFINITIONS.character[0];
  const mockResponses = {};

  const mockProps = {
    question: mockQuestion,
    responses: mockResponses,
    onResponseChange: vi.fn(),
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    isFirst: false,
    isLast: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders question text and description', () => {
    render(<BaseQuestionForm {...mockProps} />);

    expect(screen.getByText(mockQuestion.question_text)).toBeInTheDocument();
    if (mockQuestion.description) {
      expect(screen.getByText(mockQuestion.description)).toBeInTheDocument();
    }
  });

  it('renders navigation buttons', () => {
    render(<BaseQuestionForm {...mockProps} />);

    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
  });

  it('hides previous button when isFirst is true', () => {
    render(<BaseQuestionForm {...mockProps} isFirst={true} />);

    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('shows finish button when isLast is true', () => {
    render(<BaseQuestionForm {...mockProps} isLast={true} />);

    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
  });

  it('handles text input responses', async () => {
    const user = userEvent.setup();
    const textQuestion = {
      ...mockQuestion,
      question_type: 'text'
    };

    render(<BaseQuestionForm {...mockProps} question={textQuestion} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Test response');

    await waitFor(() => {
      expect(mockProps.onResponseChange).toHaveBeenCalledWith(
        textQuestion.id,
        'Test response'
      );
    });
  });

  it('handles radio button responses', async () => {
    const user = userEvent.setup();
    const radioQuestion = {
      ...mockQuestion,
      question_type: 'radio',
      options: ['Option 1', 'Option 2', 'Option 3']
    };

    render(<BaseQuestionForm {...mockProps} question={radioQuestion} />);

    const option = screen.getByLabelText('Option 2');
    await user.click(option);

    expect(mockProps.onResponseChange).toHaveBeenCalledWith(
      radioQuestion.id,
      'Option 2'
    );
  });

  it('handles checkbox responses', async () => {
    const user = userEvent.setup();
    const checkboxQuestion = {
      ...mockQuestion,
      question_type: 'checkbox',
      options: ['Option 1', 'Option 2', 'Option 3']
    };

    render(<BaseQuestionForm {...mockProps} question={checkboxQuestion} />);

    const checkbox1 = screen.getByLabelText('Option 1');
    const checkbox2 = screen.getByLabelText('Option 2');

    await user.click(checkbox1);
    await user.click(checkbox2);

    expect(mockProps.onResponseChange).toHaveBeenCalledWith(
      checkboxQuestion.id,
      ['Option 1']
    );
    expect(mockProps.onResponseChange).toHaveBeenCalledWith(
      checkboxQuestion.id,
      ['Option 1', 'Option 2']
    );
  });

  it('calls onNext when next button is clicked', async () => {
    const user = userEvent.setup();
    render(<BaseQuestionForm {...mockProps} />);

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    expect(mockProps.onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onPrevious when previous button is clicked', async () => {
    const user = userEvent.setup();
    render(<BaseQuestionForm {...mockProps} />);

    const previousButton = screen.getByRole('button', { name: /previous/i });
    await user.click(previousButton);

    expect(mockProps.onPrevious).toHaveBeenCalledTimes(1);
  });

  it('displays existing response values', () => {
    const responsesWithValue = {
      [mockQuestion.id]: 'Existing response'
    };

    const textQuestion = {
      ...mockQuestion,
      question_type: 'text'
    };

    render(
      <BaseQuestionForm 
        {...mockProps} 
        question={textQuestion}
        responses={responsesWithValue} 
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Existing response');
  });

  it('applies correct accessibility attributes', () => {
    render(<BaseQuestionForm {...mockProps} />);

    const questionHeading = screen.getByRole('heading');
    expect(questionHeading).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toHaveAttribute('type', 'button');
  });

  it('handles required questions properly', () => {
    const requiredQuestion = {
      ...mockQuestion,
      required: true
    };

    render(<BaseQuestionForm {...mockProps} question={requiredQuestion} />);

    // Should show required indicator
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
