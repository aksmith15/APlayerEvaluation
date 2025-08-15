/**
 * CuriosityTab Component - Stage 12.4
 * Detailed curiosity analysis with split layout: clustered bar chart + insights panel
 * Attributes: Problem Solving Ability, Adaptability, Taking Initiative, Continuous Improvement (4 attributes)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { fetchCuriosityAnalysis } from '../../services/coreGroupService';
import { LazyChart } from './LazyChart';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Card } from './Card';
import type { DetailedCoreGroupAnalysis, CoreGroupTabProps, CoreGroupInsight } from '../../types/evaluation';

interface CuriosityTabProps extends CoreGroupTabProps {}

export const CuriosityTab: React.FC<CuriosityTabProps> = ({
  employeeId,
  quarterId,
  employeeName = '',
  quarterName = '',
  initialData = null,
  onDataLoad
}) => {
  const [data, setData] = useState<DetailedCoreGroupAnalysis | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Loading curiosity analysis for employee ${employeeId} in quarter ${quarterId}`);
        const analysisData = await fetchCuriosityAnalysis(employeeId, quarterId);
        
        setData(analysisData);
        onDataLoad?.(analysisData);
      } catch (err) {
        console.error('Error loading curiosity analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to load curiosity analysis');
      } finally {
        setLoading(false);
      }
    };

    // Only load data if we don't have initial data and have valid IDs
    if (employeeId && quarterId && !initialData) {
      loadData();
    } else if (initialData) {
      // If we have initial data, just call onDataLoad to sync with parent
      onDataLoad?.(initialData);
      setLoading(false);
    }
  }, [employeeId, quarterId, initialData]);

  // Transform data for clustered bar chart (4 attributes) - memoized to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    return data?.attributes.map(attr => ({
      attribute: attr.attributeName,  // ClusteredBarChart expects 'attribute' not 'name'
      manager: attr.scores.manager,
      peer: attr.scores.peer,
      self: attr.scores.self,
      weighted: attr.scores.weighted,
      // Additional properties for tooltips (match ClusteredBarChart types)
      hasManager: attr.evaluatorCoverage.hasManager,
      hasPeer: attr.evaluatorCoverage.hasPeer,
      hasSelf: attr.evaluatorCoverage.hasSelf,
      completion: 0
    })) || [];
  }, [data?.attributes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!data || !data.attributes.length) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <div className="text-lg font-medium mb-2">No Curiosity Data Available</div>
          <p className="text-sm">
            No evaluation data found for {employeeName} in {quarterName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="curiosity-tab-content space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚀</span>
            <div>
              <h2 className="text-xl font-semibold text-secondary-800">
                Curiosity Analysis
              </h2>
              <p className="text-sm text-secondary-600">
                Growth & Innovation • {data.attributes.length} attributes evaluated
              </p>
            </div>
          </div>
        </div>
        
        {/* Attribute Legend - 4 attributes in 2x2 grid */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          {data.attributes.map(attr => (
            <div key={attr.attributeName} className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-secondary-600">{attr.attributeName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Split Layout: Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Clustered Bar Chart */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-secondary-800">Innovation & Growth Scores</h3>
            <p className="text-sm text-secondary-600">
              Self, peer, and manager evaluations for curiosity attributes
            </p>
          </div>
          
          {/* Enhanced chart height for 4 attributes */}
          <div className="h-96">
            <LazyChart
              chartType="clustered-bar"
              data={chartData}
              height={384}
              showLegend={true}
              title=""
              showHelperText={false}
            />
          </div>
          
          {/* Score Summary Cards - 2x2 grid for 4 attributes */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {data.attributes.map(attr => (
              <div key={attr.attributeName} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-secondary-600 mb-1">
                  {attr.attributeName}
                </div>
                <div className="text-lg font-semibold text-secondary-800">
                  {attr.scores.weighted.toFixed(1)}
                </div>
                <div className="text-xs text-secondary-500">
                  Weighted Score
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Side: Insights Panel */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-secondary-800">Innovation Insights</h3>
            <p className="text-sm text-secondary-600">
              Auto-generated growth mindset and innovation development insights
            </p>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data.insights.length > 0 ? (
              data.insights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))
            ) : (
              <div className="text-center py-8 text-secondary-500">
                <div className="text-lg mb-2">🤔</div>
                <p className="text-sm">No specific insights generated for this curiosity profile.</p>
              </div>
            )}
          </div>

          {/* Innovation Potential Summary */}
          {data.insights.some(i => i.type === 'strength') && (
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800 mb-2">🚀 Innovation Strengths</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                {data.insights
                  .filter(i => i.type === 'strength')
                  .slice(0, 3)
                  .map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      <span>{insight.title}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Growth Opportunities */}
          {data.insights.some(i => i.actionable && i.type === 'development') && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="text-sm font-medium text-orange-800 mb-2">📈 Growth Opportunities</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                {data.insights
                  .filter(i => i.actionable && i.type === 'development')
                  .slice(0, 2)
                  .map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>{insight.title}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Learning Agility Indicator */}
          {data.attributes.length >= 3 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">🧠 Learning Agility</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-700">
                    {(data.attributes.reduce((acc, attr) => acc + attr.scores.weighted, 0) / data.attributes.length).toFixed(1)}
                  </div>
                  <div className="text-xs text-blue-600">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-700">
                    {data.attributes.filter(attr => attr.scores.weighted >= 8.0).length}/{data.attributes.length}
                  </div>
                  <div className="text-xs text-blue-600">High Performance</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Metadata Footer */}
      <div className="text-xs text-secondary-400 border-t border-gray-100 pt-4">
        Analysis generated on {new Date(data.metadata.calculatedAt).toLocaleDateString()} • 
        {data.metadata.attributeCount} attributes evaluated • 
        Employee: {employeeName} • Quarter: {quarterName}
      </div>
    </div>
  );
};

/**
 * Individual Insight Card Component
 */
interface InsightCardProps {
  insight: CoreGroupInsight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getInsightIcon = (type: CoreGroupInsight['type']) => {
    switch (type) {
      case 'strength': return '⭐';
      case 'development': return '🌱';
      case 'awareness': return '🔍';
      case 'coaching': return '🎯';
      default: return '💡';
    }
  };

  const getInsightColor = (type: CoreGroupInsight['type']) => {
    switch (type) {
      case 'strength': return 'bg-green-50 border-green-200 text-green-800';
      case 'development': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'awareness': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'coaching': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: CoreGroupInsight['priority']) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  return (
    <div className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <span className="text-lg mr-2">{getInsightIcon(insight.type)}</span>
          <h4 className="font-medium text-sm">{insight.title}</h4>
        </div>
        {getPriorityBadge(insight.priority)}
      </div>
      
      <p className="text-sm mb-3 leading-relaxed">{insight.content}</p>
      
      {insight.attributes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {insight.attributes.map(attr => (
            <span
              key={attr}
              className="px-2 py-1 text-xs bg-white bg-opacity-60 rounded border"
            >
              {attr}
            </span>
          ))}
        </div>
      )}
      
      {insight.actionable && (
        <div className="mt-3 text-xs font-medium opacity-75">
          ⚡ Actionable Insight
        </div>
      )}
    </div>
  );
};