/**
 * Scoring Form Component
 * Handles the numerical scoring phase for each attribute
 */

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../';
import { ATTRIBUTE_SCALE_TITLES } from './constants-simple';
import type { AttributeDefinition } from '../../../types/database';

interface ScoringFormProps {
  attribute: string;
  attributeDefinition: AttributeDefinition;
  currentIndex: number;
  totalAttributes: number;
  currentScore: number | null;
  onScoreChange: (score: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstAttribute: boolean;
  isLastAttribute: boolean;
}

export const ScoringForm: React.FC<ScoringFormProps> = ({
  attribute,
  attributeDefinition,
  currentIndex,
  totalAttributes,
  currentScore,
  onScoreChange,
  onNext,
  onPrevious,
  isFirstAttribute,
  isLastAttribute
}) => {
  const [selectedScore, setSelectedScore] = useState<number | null>(currentScore);

  useEffect(() => {
    setSelectedScore(currentScore);
  }, [currentScore]);

  const handleScoreSelect = (score: number) => {
    setSelectedScore(score);
    onScoreChange(score);
  };

  const getScoreLabel = (score: number): { label: string; description: string; color: string } => {
    if (score >= 8) {
      return {
        label: 'Excellent',
        description: ATTRIBUTE_SCALE_TITLES[attribute]?.excellent || 'Exceptional performance',
        color: 'text-green-700 bg-green-50 border-green-200'
      };
    } else if (score >= 6) {
      return {
        label: 'Good',
        description: ATTRIBUTE_SCALE_TITLES[attribute]?.good || 'Good performance',
        color: 'text-blue-700 bg-blue-50 border-blue-200'
      };
    } else if (score >= 4) {
      return {
        label: 'Below Expectation',
        description: ATTRIBUTE_SCALE_TITLES[attribute]?.below_expectation || 'Below expectations',
        color: 'text-orange-700 bg-orange-50 border-orange-200'
      };
    } else {
      return {
        label: 'Poor',
        description: ATTRIBUTE_SCALE_TITLES[attribute]?.poor || 'Poor performance',
        color: 'text-red-700 bg-red-50 border-red-200'
      };
    }
  };

  const renderScoreButton = (score: number) => {
    const isSelected = selectedScore === score;
    const { label, description, color } = getScoreLabel(score);
    
    return (
      <button
        key={score}
        onClick={() => handleScoreSelect(score)}
        className={`
          p-4 border-2 rounded-lg text-left transition-all duration-200
          ${isSelected 
            ? `${color} border-current shadow-md scale-105` 
            : 'bg-white border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
          }
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">{score}</span>
          {isSelected && (
            <div className="w-6 h-6 bg-current rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs opacity-80">{description}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="p-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-secondary-900">
                Scoring
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

          {/* Scoring Instructions */}
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">
              Scoring Instructions
            </h3>
            <p className="text-sm text-yellow-800">
              Based on your previous answers, please rate this person's performance on a scale of 1-10 
              for <strong>{attributeDefinition.name}</strong>. Select the score that best reflects your assessment.
            </p>
          </div>

          {/* Score Selection Grid */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-secondary-900 mb-4">
              Select a Score (1-10)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => renderScoreButton(score))}
            </div>
          </div>

          {/* Selected Score Summary */}
          {selectedScore && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Your Score: {selectedScore}/10 - {getScoreLabel(selectedScore).label}
              </h4>
              <p className="text-sm text-blue-800">
                {getScoreLabel(selectedScore).description}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-secondary-200">
            <Button
              variant="ghost"
              onClick={onPrevious}
              disabled={isFirstAttribute}
            >
              ← Previous
            </Button>

            <div className="text-center">
              <p className="text-sm text-secondary-600">
                {selectedScore ? 
                  `Score selected: ${selectedScore}/10` : 
                  "Please select a score to continue"
                }
              </p>
            </div>

            <Button
              onClick={onNext}
              disabled={selectedScore === null}
            >
              {isLastAttribute ? 'Continue to Follow-up' : 'Next →'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
