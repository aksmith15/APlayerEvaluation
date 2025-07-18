import React from 'react';
import type { QuarterOption } from '../../types/database';

interface QuarterRangeSelectorProps {
  availableQuarters: QuarterOption[];
  startQuarter: string;
  endQuarter: string;
  onStartQuarterChange: (quarterId: string) => void;
  onEndQuarterChange: (quarterId: string) => void;
  isLoading?: boolean;
}

export const QuarterRangeSelector: React.FC<QuarterRangeSelectorProps> = ({
  availableQuarters,
  startQuarter,
  endQuarter,
  onStartQuarterChange,
  onEndQuarterChange,
  isLoading = false
}) => {
  // Filter end quarters to only show quarters after or equal to start quarter
  const validEndQuarters = availableQuarters.filter(quarter => {
    const startIndex = availableQuarters.findIndex(q => q.quarter_id === startQuarter);
    const currentIndex = availableQuarters.findIndex(q => q.quarter_id === quarter.quarter_id);
    return currentIndex >= startIndex;
  });

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <label htmlFor="start-quarter" className="text-sm font-medium text-secondary-700">
          From:
        </label>
        <select
          id="start-quarter"
          value={startQuarter}
          onChange={(e) => onStartQuarterChange(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {availableQuarters.map(quarter => (
            <option key={quarter.quarter_id} value={quarter.quarter_id}>
              {quarter.quarter_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <label htmlFor="end-quarter" className="text-sm font-medium text-secondary-700">
          To:
        </label>
        <select
          id="end-quarter"
          value={endQuarter}
          onChange={(e) => onEndQuarterChange(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validEndQuarters.map(quarter => (
            <option key={quarter.quarter_id} value={quarter.quarter_id}>
              {quarter.quarter_name}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Selection Buttons */}
      <div className="flex items-center space-x-2 border-l border-secondary-200 pl-4">
        <span className="text-sm text-secondary-600">Quick:</span>
        <button
          onClick={() => {
            if (availableQuarters.length >= 4) {
              const quarters = availableQuarters.slice(-4);
              onStartQuarterChange(quarters[0].quarter_id);
              onEndQuarterChange(quarters[quarters.length - 1].quarter_id);
            }
          }}
          disabled={isLoading || availableQuarters.length < 4}
          className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last 4
        </button>
        <button
          onClick={() => {
            if (availableQuarters.length >= 2) {
              const quarters = availableQuarters.slice(-2);
              onStartQuarterChange(quarters[0].quarter_id);
              onEndQuarterChange(quarters[quarters.length - 1].quarter_id);
            }
          }}
          disabled={isLoading || availableQuarters.length < 2}
          className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last 2
        </button>
        <button
          onClick={() => {
            if (availableQuarters.length > 0) {
              onStartQuarterChange(availableQuarters[0].quarter_id);
              onEndQuarterChange(availableQuarters[availableQuarters.length - 1].quarter_id);
            }
          }}
          disabled={isLoading || availableQuarters.length === 0}
          className="px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          All
        </button>
      </div>
    </div>
  );
}; 