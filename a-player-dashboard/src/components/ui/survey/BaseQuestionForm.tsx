/**
 * Base Question Form Component
 * Handles the base questions phase of the survey for each attribute
 */

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../';
import type { AttributeDefinition, SurveyQuestion } from '../../../types/database';

interface BaseQuestionFormProps {
  attributeDefinition: AttributeDefinition;
  currentIndex: number;
  totalAttributes: number;
  savedResponses: Record<string, any>;
  onResponseChange: (questionId: string, value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstAttribute: boolean;
  isLastAttribute: boolean;
}

export const BaseQuestionForm: React.FC<BaseQuestionFormProps> = ({
  attributeDefinition,
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
            placeholder="Enter your response..."
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="w-full p-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter your response..."
          />
        );
    }
  };

  // Check if all required questions are answered
  const allQuestionsAnswered = attributeDefinition.base_questions?.every(
    question => responses[question.id] && responses[question.id].toString().trim() !== ''
  ) || false;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="p-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-secondary-900">
                Base Questions
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

          {/* Questions */}
          <div className="space-y-8">
            {attributeDefinition.base_questions?.map((question, index) => (
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
                {allQuestionsAnswered ? 
                  "All questions answered" : 
                  "Please answer all questions to continue"
                }
              </p>
            </div>

            <Button
              onClick={onNext}
              disabled={!allQuestionsAnswered}
            >
              {isLastAttribute ? 'Continue to Scoring' : 'Next →'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
