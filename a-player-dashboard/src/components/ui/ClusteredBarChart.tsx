import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useChartPerformance } from '../../hooks/usePerformanceMonitoring';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload?: { fullAttribute?: string };
  }>;
  label?: string;
}

interface LegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

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

interface ClusteredBarChartProps {
  data: AttributeData[];
  height?: number;
  showLegend?: boolean;
  title?: string;
  showHelperText?: boolean;
}

type EvaluationType = 'all' | 'manager' | 'peer' | 'self' | 'weighted';

const evaluationTypes = [
  { value: 'all' as EvaluationType, label: 'All Types', description: 'Show all evaluation types side by side' },
  { value: 'weighted' as EvaluationType, label: 'Weighted Final', description: 'Weighted average of all evaluations', color: '#f59e0b' },
  { value: 'manager' as EvaluationType, label: 'Manager', description: 'Manager evaluation scores', color: '#059669' },
  { value: 'peer' as EvaluationType, label: 'Peer', description: 'Peer evaluation scores', color: '#dc2626' },
  { value: 'self' as EvaluationType, label: 'Self', description: 'Self evaluation scores', color: '#7c3aed' }
];

// Chart configuration based on UI/UX documentation
const chartConfig = {
  margin: { top: 20, right: 30, bottom: 75, left: 40 },
  colors: {
    manager: '#059669',    // Green - Manager scores
    peer: '#dc2626',       // Red - Peer scores  
    self: '#7c3aed',       // Purple - Self scores
    weighted: '#f59e0b'    // Amber - Weighted final scores
  },
  barSize: 20,
  categoryGap: '20%'
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    // Find the full attribute name from the data
    const fullName = payload[0]?.payload?.fullAttribute || label;
    
    return (
      <div className="bg-white p-3 border border-secondary-200 rounded-lg shadow-lg">
        <p className="font-medium text-secondary-800 mb-2">{fullName}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {entry.value.toFixed(1)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend = ({ payload }: LegendProps) => {
  if (!payload) return null;
  
  return (
    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-secondary-200">
      {payload.map((entry, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-secondary-700">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Function to create smart abbreviations for attributes
const createSmartLabel = (attribute: string): string => {
  // Handle undefined/null attribute names
  if (!attribute || typeof attribute !== 'string') {
    return 'Unknown';
  }
  
  // Clean up the attribute name first
  const cleanName = attribute
    .replace(/_/g, ' ')  // Remove underscores
    .replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()); // Proper case
  
  // Create abbreviations for common attributes
  const abbreviationMap: { [key: string]: string } = {
    'accountability': 'Account.',
    'adaptability': 'Adapt.',
    'communication': 'Comm.',
    'continuous learning': 'Learning',
    'continuous_learning': 'Learning',
    'initiative': 'Initiative',
    'leadership': 'Leader.',
    'problem solving': 'Problem',
    'problem_solving': 'Problem',
    'quality': 'Quality',
    'reliability': 'Reliable',
    'teamwork': 'Team',
    'technical skills': 'Technical',
    'collaboration': 'Collab.',
    'innovation': 'Innovation'
  };
  
  // Check for exact matches first
  const lowerName = cleanName.toLowerCase();
  if (abbreviationMap[lowerName]) {
    return abbreviationMap[lowerName];
  }
  
  // If no predefined abbreviation, create one
  if (cleanName.length > 10) {
    // For multi-word attributes, take first word + abbreviated second
    const words = cleanName.split(' ');
    if (words.length > 1) {
      return words[0] + ' ' + words[1].substring(0, 3) + '.';
    }
    // For single long words, take first 8 characters + period
    return cleanName.substring(0, 8) + '.';
  }
  
  return cleanName;
};

export const ClusteredBarChart: React.FC<ClusteredBarChartProps> = React.memo(({ 
  data, 
  height = 400,
  showLegend = true,
  title,
  showHelperText = true
}) => {
  const [selectedType, setSelectedType] = React.useState<EvaluationType>('all');
  
  // Performance monitoring for chart rendering
  const { measureChartOperation } = useChartPerformance('ClusteredBarChart', true);

  // Memoize expensive data transformations with performance tracking
  const chartData = React.useMemo(() => {
    return measureChartOperation(() => {
      // Safety check for data
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      // Transform data for chart - create smart labels and keep full names
      const baseChartData = data.map(item => ({
        ...item,
        attribute: createSmartLabel(item?.attribute),
      fullAttribute: item?.attribute ? item.attribute.replace(/_/g, ' ').replace(/\b\w+/g, word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ) : 'Unknown Attribute'
    }));

    // Filter data based on selected evaluation type
    return selectedType === 'all' ? baseChartData : baseChartData;
    });
  }, [data, selectedType, measureChartOperation]);

  const selectedEvaluation = React.useMemo(() => 
    evaluationTypes.find(type => type.value === selectedType)!,
    [selectedType]
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-secondary-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
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
      {/* Header with Evaluation Type Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900">
            {title || 'Evaluation Breakdown'}
          </h3>
          <p className="text-sm text-secondary-600">
            {selectedEvaluation.description}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label htmlFor="chart-evaluation-type" className="text-sm font-medium text-secondary-700">
            View:
          </label>
          <select
            id="chart-evaluation-type"
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
      
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={chartConfig.margin}
            barCategoryGap={chartConfig.categoryGap}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#f1f5f9"
              strokeWidth={1}
            />
            <XAxis 
              dataKey="attribute"
              tick={{ 
                fontSize: 12, 
                fill: '#64748b'
              }}
              height={70}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis 
              domain={[0, 10]}
              tickCount={6}
              tick={{ 
                fontSize: 12, 
                fill: '#64748b' 
              }}
              label={{ 
                value: 'Score (1-10)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#64748b', fontSize: '12px' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && selectedType === 'all' && <Legend content={<CustomLegend />} />}
            
            {/* Conditionally render bars based on selected type */}
            {(selectedType === 'all' || selectedType === 'manager') && (
              <Bar 
                dataKey="manager" 
                name="Manager"
                fill={chartConfig.colors.manager}
                radius={[2, 2, 0, 0]}
                maxBarSize={selectedType === 'all' ? chartConfig.barSize : 40}
              />
            )}
            {(selectedType === 'all' || selectedType === 'peer') && (
              <Bar 
                dataKey="peer" 
                name="Peer"
                fill={chartConfig.colors.peer}
                radius={[2, 2, 0, 0]}
                maxBarSize={selectedType === 'all' ? chartConfig.barSize : 40}
              />
            )}
            {(selectedType === 'all' || selectedType === 'self') && (
              <Bar 
                dataKey="self" 
                name="Self"
                fill={chartConfig.colors.self}
                radius={[2, 2, 0, 0]}
                maxBarSize={selectedType === 'all' ? chartConfig.barSize : 40}
              />
            )}
            {(selectedType === 'all' || selectedType === 'weighted') && (
              <Bar 
                dataKey="weighted" 
                name="Weighted Final"
                fill={chartConfig.colors.weighted}
                radius={[2, 2, 0, 0]}
                maxBarSize={selectedType === 'all' ? chartConfig.barSize : 40}
              />
            )}
                    </BarChart>
        </ResponsiveContainer>
      </div>
      
      {showHelperText && (
        <div className="text-xs text-secondary-500 text-center mt-2">
          Hover over bars to see full attribute names • Use the dropdown above to filter by evaluation type
        </div>
      )}
    </div>
  );
});

ClusteredBarChart.displayName = 'ClusteredBarChart'; 