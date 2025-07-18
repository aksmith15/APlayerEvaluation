import React, { useState, memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { QuarterRangeSelector } from './QuarterRangeSelector';
import type { QuarterOption } from '../../types/database';

interface HistoricalAttributeData {
  attribute: string;
  quarters: Array<{
    quarterId: string;
    quarterName: string;
    quarterShortName: string; // e.g., "Q1 2024"
    managerScore: number;
    peerScore: number;
    selfScore: number;
    weightedScore: number;
    hasData: boolean;
  }>;
}

interface HistoricalClusteredBarChartProps {
  data: HistoricalAttributeData[];
  height?: number;
  title?: string;
  // Quarter range selection
  availableQuarters?: QuarterOption[];
  startQuarter?: string;
  endQuarter?: string;
  onStartQuarterChange?: (quarterId: string) => void;
  onEndQuarterChange?: (quarterId: string) => void;
  isLoadingQuarters?: boolean;
  showQuarterSelector?: boolean;
  employeeName?: string;
}

type EvaluationType = 'weighted' | 'manager' | 'peer' | 'self';
type ViewType = 'by-quarter' | 'by-attribute';

const evaluationTypes = [
  { value: 'weighted' as EvaluationType, label: 'Weighted Final', color: '#f59e0b' },
  { value: 'manager' as EvaluationType, label: 'Manager', color: '#059669' },
  { value: 'peer' as EvaluationType, label: 'Peer', color: '#dc2626' },
  { value: 'self' as EvaluationType, label: 'Self', color: '#7c3aed' }
];

const viewTypes = [
  { value: 'by-quarter' as ViewType, label: 'By Quarter', description: 'Compare quarters for each attribute' },
  { value: 'by-attribute' as ViewType, label: 'By Attribute', description: 'Compare attributes across time' }
];

// Chart configuration
const chartConfig = {
  margin: { top: 20, right: 30, bottom: 85, left: 40 },
  colors: {
    manager: '#059669',
    peer: '#dc2626', 
    self: '#7c3aed',
    weighted: '#f59e0b'
  },
  barSize: 25,
  categoryGap: '15%'
};

// Smart abbreviation for attribute names to fit in charts
const createSmartLabel = (attribute: string): string => {
  const abbreviations: Record<string, string> = {
    'accountability': 'Account.',
    'communication': 'Comm.',
    'continuous_learning': 'Learning',
    'problem_solving': 'Problem',
    'leadership': 'Leader.',
    'collaboration': 'Collab.',
    'technical_skills': 'Technical',
    'innovation': 'Innovation',
    'reliability': 'Reliable',
    'adaptability': 'Adapt.',
    'initiative': 'Initiative',
    'quality_focus': 'Quality'
  };
  
  return abbreviations[attribute.toLowerCase()] || 
         attribute.charAt(0).toUpperCase() + attribute.slice(1).substring(0, 7);
};

// Custom tooltip for historical data
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    
    return (
      <div className="bg-white p-4 border border-secondary-200 rounded-lg shadow-lg">
        <p className="font-semibold text-secondary-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 mb-1">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-secondary-600">
              {entry.name}: <span className="font-medium">{entry.value.toFixed(1)}</span>
            </span>
          </div>
        ))}
        {data?.completion && (
          <p className="text-xs text-secondary-500 mt-2 border-t pt-2">
            Completion: {data.completion.toFixed(0)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const HistoricalClusteredBarChart: React.FC<HistoricalClusteredBarChartProps> = memo(({
  data,
  height = 400,
  title = "Historical Performance Comparison",
  availableQuarters = [],
  startQuarter = '',
  endQuarter = '',
  onStartQuarterChange,
  onEndQuarterChange,
  isLoadingQuarters = false,
  showQuarterSelector = true,
  employeeName
}) => {
  const [selectedEvaluationType, setSelectedEvaluationType] = useState<EvaluationType>('weighted');
  const [viewType, setViewType] = useState<ViewType>('by-quarter');

  // Memoize expensive data transformations
  const chartData = useMemo(() => {
    if (viewType === 'by-quarter') {
      // Group by quarters, show attributes as separate bars
      const quarterData: Record<string, any> = {};
      
      data.forEach(attributeData => {
        attributeData.quarters.forEach(quarter => {
          if (!quarter.hasData) return;
          
          const quarterKey = quarter.quarterShortName;
          if (!quarterData[quarterKey]) {
            quarterData[quarterKey] = {
              quarter: quarterKey,
              quarterFull: quarter.quarterName
            };
          }
          
          const attributeKey = createSmartLabel(attributeData.attribute);
          const scoreKey = `${selectedEvaluationType}Score`;
          quarterData[quarterKey][attributeKey] = quarter[scoreKey as keyof typeof quarter] || 0;
        });
      });
      
      return Object.values(quarterData);
    } else {
      // Group by attributes, show quarters as separate bars
      return data.map(attributeData => {
        const item: any = {
          attribute: createSmartLabel(attributeData.attribute),
          fullAttribute: attributeData.attribute.replace(/_/g, ' ').replace(/\b\w+/g, word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
        };
        
        attributeData.quarters.forEach(quarter => {
          if (quarter.hasData) {
            const quarterKey = quarter.quarterShortName;
            const scoreKey = `${selectedEvaluationType}Score`;
            item[quarterKey] = quarter[scoreKey as keyof typeof quarter] || 0;
          }
        });
        
        return item;
      });
    }
  }, [data, viewType, selectedEvaluationType]);

  // Memoize data keys for bars
  const dataKeys = useMemo(() => {
    if (chartData.length === 0) return [];
    
    if (viewType === 'by-quarter') {
      // Get all attribute keys (smart labels)
      const allKeys = new Set<string>();
      chartData.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'quarter' && key !== 'quarterFull') {
            allKeys.add(key);
          }
        });
      });
      return Array.from(allKeys);
    } else {
      // Get all quarter keys
      const allKeys = new Set<string>();
      chartData.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== 'attribute' && key !== 'fullAttribute') {
            allKeys.add(key);
          }
        });
      });
      return Array.from(allKeys).sort();
    }
  }, [chartData, viewType]);

  // Generate colors for quarters/attributes
  const colors = useMemo(() => {
    const uniqueItems = dataKeys;
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
    return uniqueItems.reduce((acc, item, index) => {
      acc[item] = colors[index % colors.length];
      return acc;
    }, {} as Record<string, string>);
  }, [dataKeys]);

  const currentEvalType = evaluationTypes.find(t => t.value === selectedEvaluationType);

  return (
    <div className="w-full">
      {/* Header with controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">{title}</h3>
            {employeeName && (
              <p className="text-sm text-secondary-600">
                {employeeName} • {startQuarter && endQuarter ? 'Range' : 'All'} quarters • {currentEvalType?.label} scores
              </p>
            )}
          </div>
        </div>

        {/* Quarter Range Selector */}
        {showQuarterSelector && (
          <div className="mb-4">
            <QuarterRangeSelector
              availableQuarters={availableQuarters}
              startQuarter={startQuarter}
              endQuarter={endQuarter}
              onStartQuarterChange={onStartQuarterChange || (() => {})}
              onEndQuarterChange={onEndQuarterChange || (() => {})}
              isLoading={isLoadingQuarters}
            />
          </div>
        )}

        {/* Control panels */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* View Type Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              View Type
            </label>
            <div className="flex rounded-lg border border-secondary-300 overflow-hidden">
              {viewTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setViewType(type.value)}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewType === type.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-secondary-700 hover:bg-secondary-50'
                  }`}
                  title={type.description}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Evaluation Type Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Score Type
            </label>
            <select
              value={selectedEvaluationType}
              onChange={(e) => setSelectedEvaluationType(e.target.value as EvaluationType)}
              className="w-full input-field"
            >
              {evaluationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-secondary-200 p-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              margin={chartConfig.margin}
              barCategoryGap={chartConfig.categoryGap}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey={viewType === 'by-quarter' ? 'quarter' : 'attribute'}
                angle={-25}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis 
                domain={[0, 10]}
                tick={{ fontSize: 12, fill: '#64748b' }}
                label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {dataKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[key]}
                  name={key}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-secondary-500">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No historical data available</p>
              <p className="text-sm">Select a quarter range with evaluation data to view comparisons</p>
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="mt-3 text-xs text-secondary-500 text-center">
        {viewType === 'by-quarter' 
          ? 'Compare performance attributes across different quarters'
          : 'Compare quarters for each performance attribute'}
      </div>
    </div>
  );
});

HistoricalClusteredBarChart.displayName = 'HistoricalClusteredBarChart'; 