import React from 'react';
import type { LetterGrade as LetterGradeType } from '../../utils/calculations';
import { getGradeScale } from '../../utils/calculations';

interface LetterGradeProps {
  grade: LetterGradeType;
  score?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
  className?: string;
}

export const LetterGrade: React.FC<LetterGradeProps> = ({
  grade,
  score,
  size = 'md',
  showTooltip = true,
  className = ''
}) => {
  const gradeScale = getGradeScale(grade);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };

  const gradeStyles = {
    A: 'bg-green-500 text-white border-green-600',
    B: 'bg-blue-500 text-white border-blue-600',
    C: 'bg-yellow-500 text-white border-yellow-600',
    D: 'bg-orange-500 text-white border-orange-600',
    F: 'bg-red-500 text-white border-red-600'
  };

  const component = (
    <div 
      className={`
        inline-flex items-center justify-center 
        rounded-full border-2 font-bold
        ${sizeClasses[size]} 
        ${gradeStyles[grade]}
        ${className}
      `}
      title={showTooltip ? `${gradeScale?.description} ${score ? `(${score})` : ''}` : undefined}
    >
      {grade}
    </div>
  );

  return component;
};

interface LetterGradeWithLabelProps extends LetterGradeProps {
  label?: string;
  showScore?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export const LetterGradeWithLabel: React.FC<LetterGradeWithLabelProps> = ({
  grade,
  score,
  size = 'md',
  showTooltip = true,
  className = '',
  label,
  showScore = true,
  layout = 'horizontal'
}) => {
  const gradeScale = getGradeScale(grade);

  if (layout === 'vertical') {
    return (
      <div className={`text-center ${className}`}>
        <LetterGrade 
          grade={grade} 
          score={score} 
          size={size} 
          showTooltip={showTooltip}
          className="mb-1"
        />
        {label && (
          <div className="text-xs text-gray-600 font-medium">{label}</div>
        )}
        {showScore && score && (
          <div className="text-xs text-gray-500">{score}</div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LetterGrade 
        grade={grade} 
        score={score} 
        size={size} 
        showTooltip={showTooltip}
      />
      <div className="flex flex-col">
        {label && (
          <span className="text-sm font-medium text-gray-900">{label}</span>
        )}
        {showScore && score && (
          <span className="text-xs text-gray-500">Score: {score}</span>
        )}
        {showTooltip && gradeScale && (
          <span className="text-xs text-gray-500">{gradeScale.description}</span>
        )}
      </div>
    </div>
  );
};

interface GradeComparisonProps {
  currentGrade: LetterGradeType;
  currentScore: number;
  previousGrade?: LetterGradeType;
  previousScore?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const GradeComparison: React.FC<GradeComparisonProps> = ({
  currentGrade,
  currentScore,
  previousGrade,
  previousScore,
  size = 'md'
}) => {
  const getTrendIcon = () => {
    if (!previousScore) return null;
    
    if (currentScore > previousScore) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (currentScore < previousScore) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="text-center">
        <LetterGrade grade={currentGrade} score={currentScore} size={size} />
        <div className="text-xs text-gray-600 mt-1">Current</div>
      </div>
      
      {previousGrade && (
        <>
          <div className="flex flex-col items-center">
            {getTrendIcon()}
            <div className="text-xs text-gray-500 mt-1">
              {previousScore && currentScore !== previousScore 
                ? `${currentScore > previousScore ? '+' : ''}${(currentScore - previousScore).toFixed(1)}`
                : 'Same'
              }
            </div>
          </div>
          
          <div className="text-center">
            <LetterGrade grade={previousGrade} score={previousScore} size={size} />
            <div className="text-xs text-gray-600 mt-1">Previous</div>
          </div>
        </>
      )}
    </div>
  );
}; 