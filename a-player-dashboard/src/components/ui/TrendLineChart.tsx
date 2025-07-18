import React, { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QuarterRangeSelector } from './QuarterRangeSelector';
import type { QuarterOption } from '../../types/database';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: TrendDataPoint;
  }>;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: TrendDataPoint;
}

interface TrendDataPoint {
  quarter: string;
  quarterName: string;
  averageScore: number;
  completionRate: number;
  quarterDate: string;
}

interface TrendLineChartProps {
  data: TrendDataPoint[];
  height?: number;
  title?: string;
  employeeName?: string;
  // Quarter range selection props
  availableQuarters?: QuarterOption[];
  startQuarter?: string;
  endQuarter?: string;
  onStartQuarterChange?: (quarterId: string) => void;
  onEndQuarterChange?: (quarterId: string) => void;
  isLoadingQuarters?: boolean;
  showQuarterSelector?: boolean;
}

// Chart configuration based on UI/UX documentation
const trendLineConfig = {
  margin: { top: 20, right: 30, bottom: 40, left: 40 },
  line: {
    stroke: '#3b82f6',
    strokeWidth: 3,
    dot: {
      fill: '#3b82f6',
      strokeWidth: 2,
      r: 4
    }
  },
  grid: {
    horizontal: true,
    vertical: false,
    stroke: '#f1f5f9'
  }
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-secondary-200 rounded-lg shadow-lg">
        <p className="font-medium text-secondary-800 mb-2">{data.quarterName}</p>
        <p className="text-sm text-primary-600">
          <span className="font-medium">Average Score:</span> {data.averageScore.toFixed(1)}
        </p>
        <p className="text-sm text-secondary-600">
          <span className="font-medium">Completion:</span> {data.completionRate.toFixed(0)}%
        </p>
        {data.quarterDate && (
          <p className="text-xs text-secondary-500 mt-1">
            {new Date(data.quarterDate).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Custom dot component for enhanced visual feedback
const CustomDot = (props: CustomDotProps) => {
  const { cx, cy, payload } = props;
  
  if (!payload) return null;
  
  // Different dot colors based on performance level
  let fillColor = trendLineConfig.line.dot.fill;
  if (payload.averageScore >= 7.5) {
    fillColor = '#10b981'; // High performance - green
  } else if (payload.averageScore >= 5.0) {
    fillColor = '#f59e0b'; // Medium performance - amber
  } else if (payload.averageScore < 5.0) {
    fillColor = '#ef4444'; // Low performance - red
  }
  
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={trendLineConfig.line.dot.r}
      fill={fillColor}
      stroke="#fff"
      strokeWidth={trendLineConfig.line.dot.strokeWidth}
    />
  );
};

export const TrendLineChart: React.FC<TrendLineChartProps> = memo(({ 
  data, 
  height = 400,
  title,
  employeeName,
  // Quarter range selection props
  availableQuarters = [],
  startQuarter = '',
  endQuarter = '',
  onStartQuarterChange,
  onEndQuarterChange,
  isLoadingQuarters = false,
  showQuarterSelector = false
}) => {
  // Memoize expensive calculations
  const { averageScore, trendDirection } = useMemo(() => {
    if (data.length === 0) return { averageScore: 0, trendDirection: 0 };
    
    const avg = data.reduce((sum, item) => sum + item.averageScore, 0) / data.length;
    const trend = data.length > 1 ? data[data.length - 1].averageScore - data[0].averageScore : 0;
    
    return { averageScore: avg, trendDirection: trend };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-secondary-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-medium">No trend data available</p>
          <p className="text-sm">Trends will appear with multiple quarter evaluations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Quarter Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900">
            {title || 'Performance Trends'}
          </h3>
          <p className="text-sm text-secondary-600">
            {employeeName ? `${employeeName}'s performance over time` : 'Performance trend analysis'}
          </p>
        </div>
        
        {showQuarterSelector && availableQuarters.length > 0 && onStartQuarterChange && onEndQuarterChange && (
          <QuarterRangeSelector
            availableQuarters={availableQuarters}
            startQuarter={startQuarter}
            endQuarter={endQuarter}
            onStartQuarterChange={onStartQuarterChange}
            onEndQuarterChange={onEndQuarterChange}
            isLoading={isLoadingQuarters}
          />
        )}
      </div>
      
      {/* Trend Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-secondary-50 rounded-lg p-3">
          <div className="text-sm font-medium text-secondary-700">Current Score</div>
          <div className="text-lg font-semibold text-secondary-900">
            {data[data.length - 1]?.averageScore.toFixed(1) || 'N/A'}
          </div>
        </div>
        <div className="bg-secondary-50 rounded-lg p-3">
          <div className="text-sm font-medium text-secondary-700">Average</div>
          <div className="text-lg font-semibold text-secondary-900">
            {averageScore.toFixed(1)}
          </div>
        </div>
        <div className="bg-secondary-50 rounded-lg p-3">
          <div className="text-sm font-medium text-secondary-700">Trend</div>
          <div className={`text-lg font-semibold flex items-center gap-1 ${
            trendDirection > 0 ? 'text-green-600' : 
            trendDirection < 0 ? 'text-red-600' : 
            'text-secondary-600'
          }`}>
            {trendDirection > 0 ? '↗' : trendDirection < 0 ? '↘' : '→'}
            {Math.abs(trendDirection).toFixed(1)}
          </div>
        </div>
      </div>
      
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={trendLineConfig.margin}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={trendLineConfig.grid.stroke}
              strokeWidth={1}
              horizontal={trendLineConfig.grid.horizontal}
              vertical={trendLineConfig.grid.vertical}
            />
            <XAxis 
              dataKey="quarter"
              tick={{ 
                fontSize: 12, 
                fill: '#64748b'
              }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              domain={[0, 10]}
              tickCount={6}
              tick={{ 
                fontSize: 12, 
                fill: '#64748b' 
              }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Line 
              type="monotone"
              dataKey="averageScore"
              stroke={trendLineConfig.line.stroke}
              strokeWidth={trendLineConfig.line.strokeWidth}
              dot={<CustomDot />}
              activeDot={{ 
                r: 6,
                fill: trendLineConfig.line.stroke,
                stroke: '#fff',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Performance Level Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-secondary-600">High (7.5+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-secondary-600">Medium (5.0-7.4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-secondary-600">Low (&lt;5.0)</span>
          </div>
        </div>

        {/* Data Points Summary */}
        <div className="mt-4 text-sm text-secondary-600 text-center">
          <span className="font-medium">Tracking Period:</span>
          <span className="ml-2">{data.length} quarters of evaluation data</span>
        </div>
      </div>
    </div>
  );
});

TrendLineChart.displayName = 'TrendLineChart'; 