/**
 * Conditional Question Form Component
 * Handles follow-up questions based on the numerical score given
 */

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../';
import type { AttributeDefinition, SurveyQuestion } from '../../../types/database';

interface ConditionalQuestionFormProps {
  attributeDefinition: AttributeDefinition;
  currentScore: number;
  currentIndex: number;
  totalAttributes: number;
  savedResponses: Record<string, any>;
  onResponseChange: (questionId: string, value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstAttribute: boolean;
  isLastAttribute: boolean;
}

export const ConditionalQuestionForm: React.FC<ConditionalQuestionFormProps> = ({
  attributeDefinition,
  currentScore,
  currentIndex,
  totalAttributes,
  savedResponses,
  onResponseChange,
  onNext,
  onPrevious,
  isFirstAttribute,
  isLastAttribute
}) => {
  const [responses, setResponses] = useState<Record<string, any>>({});

  // Load saved responses on mount
  useEffect(() => {
    if (savedResponses) {
      setResponses(savedResponses);
    }
  }, [savedResponses]);

  const handleResponseChange = (questionId: string, value: any) => {
    const newResponses = { ...responses, [questionId]: value };
    setResponses(newResponses);
    onResponseChange(questionId, value);
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const currentValue = responses[question.id] || '';

    switch (question.question_type) {
      case 'single_select':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="mr-3 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-secondary-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            rows={4}
            className="w-full p-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Please provide specific examples and details..."
          />
        );

      default:
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            rows={4}
            className="w-full p-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Please provide specific examples and details..."
          />
        );
    }
  };

  // Get conditional questions based on current score
  const getConditionalQuestions = (): SurveyQuestion[] => {
    if (!attributeDefinition.conditional_question_sets) return [];

    // Score ranges: 8-10 (excellent), 7 (good), 4-6 (below expectation), 1-3 (poor)
    // Find the appropriate question set based on score range
    const questionSet = attributeDefinition.conditional_question_sets.find(set => {
      if (currentScore >= 9) return set.score_range === '9-10';
      if (currentScore >= 6) return set.score_range === '6-8';
      return set.score_range === '1-5';
    });

    return questionSet?.questions || [];
  };

  const conditionalQuestions = getConditionalQuestions();

  // Check if all required questions are answered
  const allQuestionsAnswered = conditionalQuestions.length === 0 || conditionalQuestions.every(
    question => responses[question.id] && responses[question.id].toString().trim() !== ''
  );

  const getScoreRangeLabel = (score: number): { label: string; color: string; description: string } => {
    if (score >= 8) {
      return {
        label: 'Excellent Performance',
        color: 'text-green-700 bg-green-50 border-green-200',
        description: 'Please provide specific examples of exceptional performance'
      };
    } else if (score === 7) {
      return {
        label: 'Good Performance',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        description: 'Please provide examples of their strengths in this area'
      };
    } else if (score >= 4) {
      return {
        label: 'Below Expectation',
        color: 'text-orange-700 bg-orange-50 border-orange-200',
        description: 'Please identify specific areas for improvement'
      };
    } else {
      return {
        label: 'Poor Performance',
        color: 'text-red-700 bg-red-50 border-red-200',
        description: 'Please describe the main issues that need attention'
      };
    }
  };

  const scoreInfo = getScoreRangeLabel(currentScore);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="p-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-secondary-900">
                Follow-up Questions
              </h1>
              <span className="text-sm text-secondary-600">
                Attribute {currentIndex + 1} of {totalAttributes}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalAttributes) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Attribute Header */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              {attributeDefinition.name}
            </h2>
            <p className="text-blue-800">
              {attributeDefinition.definition}
            </p>
          </div>

          {/* Score Summary */}
          <div className={`mb-8 p-4 border rounded-lg ${scoreInfo.color}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">
                Your Score: {currentScore}/10 - {scoreInfo.label}
              </h3>
              <span className="text-2xl font-bold">{currentScore}</span>
            </div>
            <p className="text-sm opacity-90">
              {scoreInfo.description}
            </p>
          </div>

          {/* Conditional Questions or No Questions Message */}
          {conditionalQuestions.length > 0 ? (
            <div className="space-y-8">
              {conditionalQuestions.map((question, index) => (
                <div key={question.id} className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-secondary-900 mb-4">
                        {question.question_text}
                      </h3>
                      {renderQuestion(question)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                No Additional Questions
              </h3>
              <p className="text-secondary-600">
                You can proceed to the next attribute.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-secondary-200">
            <Button
              variant="ghost"
              onClick={onPrevious}
              disabled={isFirstAttribute}
            >
              ← Previous
            </Button>

            <div className="text-center">
              <p className="text-sm text-secondary-600">
                {conditionalQuestions.length === 0 ? 
                  "Ready to continue" :
                  allQuestionsAnswered ? 
                    "All questions answered" : 
                    "Please answer all questions to continue"
                }
              </p>
            </div>

            <Button
              onClick={onNext}
              disabled={conditionalQuestions.length > 0 && !allQuestionsAnswered}
            >
              {isLastAttribute ? 'Complete Survey' : 'Next Attribute →'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
