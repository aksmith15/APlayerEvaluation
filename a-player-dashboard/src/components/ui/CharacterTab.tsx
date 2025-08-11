/**
 * CharacterTab Component - Stage 12.3
 * Detailed character analysis with split layout: clustered bar chart + insights panel
 * Attributes: Leadership, Communication Skills, Teamwork
 */

import React, { useState, useEffect } from 'react';
import { fetchCharacterAnalysis } from '../../services/coreGroupService';
import { ClusteredBarChart } from './ClusteredBarChart';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Card } from './Card';
import type { DetailedCoreGroupAnalysis, CoreGroupTabProps, CoreGroupInsight } from '../../types/evaluation';

interface CharacterTabProps extends CoreGroupTabProps {}

export const CharacterTab: React.FC<CharacterTabProps> = ({
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
        
        console.log(`Loading character analysis for employee ${employeeId} in quarter ${quarterId}`);
        const analysisData = await fetchCharacterAnalysis(employeeId, quarterId);
        
        setData(analysisData);
        onDataLoad?.(analysisData);
      } catch (err) {
        console.error('Error loading character analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to load character analysis');
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

  // Transform data for clustered bar chart
  const chartData = data?.attributes.map(attr => ({
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
          <div className="text-lg font-medium mb-2">No Character Data Available</div>
          <p className="text-sm">
            No evaluation data found for {employeeName} in {quarterName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="character-tab-content space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-3">👥</span>
            <div>
              <h2 className="text-xl font-semibold text-secondary-800">
                Character Analysis
              </h2>
              <p className="text-sm text-secondary-600">
                Leadership & Interpersonal • {data.attributes.length} attributes evaluated
              </p>
            </div>
          </div>
        </div>
        
        {/* Attribute Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {data.attributes.map(attr => (
            <div key={attr.attributeName} className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
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
            <h3 className="text-lg font-medium text-secondary-800">Leadership & Interpersonal Scores</h3>
            <p className="text-sm text-secondary-600">
              Self, peer, and manager evaluations for character attributes
            </p>
          </div>
          
          <div className="h-80">
            <ClusteredBarChart
              data={chartData}
              height={320}
              showLegend={true}
              title=""
            />
          </div>
          
          {/* Score Summary Cards */}
          <div className="mt-4 grid grid-cols-3 gap-3">
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
            <h3 className="text-lg font-medium text-secondary-800">Leadership Insights</h3>
            <p className="text-sm text-secondary-600">
              Auto-generated leadership and interpersonal development insights
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
                <p className="text-sm">No specific insights generated for this character profile.</p>
              </div>
            )}
          </div>

          {/* Leadership Potential Summary */}
          {data.insights.some(i => i.type === 'strength') && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">🌟 Leadership Highlights</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {data.insights
                  .filter(i => i.type === 'strength')
                  .slice(0, 3)
                  .map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span>{insight.title}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Development Focus */}
          {data.insights.some(i => i.actionable) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">📈 Development Focus</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {data.insights
                  .filter(i => i.actionable && i.type === 'development')
                  .slice(0, 2)
                  .map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>{insight.title}</span>
                    </li>
                  ))}
              </ul>
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
      case 'strength': return '👑';
      case 'development': return '🎯';
      case 'awareness': return '🤝';
      case 'coaching': return '👨‍🏫';
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