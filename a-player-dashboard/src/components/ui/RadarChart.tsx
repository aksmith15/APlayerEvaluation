import React from 'react';
import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface AttributeData {
  attribute: string;
  manager: number;
  peer: number;
  self: number;
  weighted: number;
  hasManager: boolean;
  hasPeer: boolean;
  hasSelf: boolean;
  completion: number;
}

interface RadarChartProps {
  data: AttributeData[];
  height?: number;
}

type EvaluationType = 'total' | 'manager' | 'peer' | 'self';

const evaluationTypes = [
  { value: 'total' as EvaluationType, label: 'Total Score', color: '#F59E0B', description: 'Weighted average of all evaluations' },
  { value: 'manager' as EvaluationType, label: 'Manager', color: '#10B981', description: 'Manager evaluation scores' },
  { value: 'peer' as EvaluationType, label: 'Peer', color: '#EF4444', description: 'Peer evaluation scores' },
  { value: 'self' as EvaluationType, label: 'Self', color: '#8B5CF6', description: 'Self evaluation scores' }
];

export const RadarChart: React.FC<RadarChartProps> = React.memo(({ 
  data, 
  height = 400
}) => {
  const [selectedType, setSelectedType] = React.useState<EvaluationType>('total');

  // Transform data for radar chart based on selected type
  const chartData = data.map(item => {
    let value = 0;
    let available = false;
    
    switch (selectedType) {
      case 'total':
        value = item.weighted;
        available = item.completion > 0;
        break;
      case 'manager':
        value = item.manager;
        available = item.hasManager;
        break;
      case 'peer':
        value = item.peer;
        available = item.hasPeer;
        break;
      case 'self':
        value = item.self;
        available = item.hasSelf;
        break;
    }

    return {
      attribute: item.attribute.length > 12 ? item.attribute.substring(0, 12) + '...' : item.attribute,
      fullAttribute: item.attribute,
      value: available ? value : null,
      available
    };
  });

  const selectedEvaluation = evaluationTypes.find(type => type.value === selectedType)!;
  const availableCount = chartData.filter(item => item.available).length;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-secondary-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-medium">No evaluation data available</p>
          <p className="text-sm">Data will appear when evaluations are completed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Evaluation Type Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900">Performance Overview</h3>
          <p className="text-sm text-secondary-600">{selectedEvaluation.description}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label htmlFor="evaluation-type" className="text-sm font-medium text-secondary-700">
            View:
          </label>
          <select
            id="evaluation-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as EvaluationType)}
            className="px-3 py-2 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {evaluationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsRadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid 
              stroke="#E5E7EB" 
              strokeWidth={1}
            />
            <PolarAngleAxis 
              dataKey="attribute" 
              tick={{ 
                fontSize: 12, 
                fill: '#6B7280',
                fontWeight: 500
              }}
              className="text-xs"
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 10]} 
              tick={{ 
                fontSize: 10, 
                fill: '#9CA3AF' 
              }}
              tickCount={6}
            />
            <Radar
              name={selectedEvaluation.label}
              dataKey="value"
              stroke={selectedEvaluation.color}
              fill={selectedEvaluation.color}
              fillOpacity={0.15}
              strokeWidth={3}
              dot={{ 
                fill: selectedEvaluation.color, 
                strokeWidth: 2, 
                stroke: '#fff',
                r: 5
              }}
              connectNulls={false}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>

        {/* Legend and Stats */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedEvaluation.color }}
              />
              <span className="font-medium text-secondary-700">{selectedEvaluation.label}</span>
            </div>
          </div>
          
          <div className="text-secondary-600">
            <span className="font-medium">Performance attributes on a scale of 1-10</span>
            <br />
            <span>
              Showing {availableCount} of {data.length} {selectedType} evaluation{availableCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

RadarChart.displayName = 'RadarChart'; 