/**
 * CompetenceTab Component - Stage 12.2
 * Detailed competence analysis with split layout: clustered bar chart + insights panel
 * Attributes: Reliability, Accountability for Action, Quality of Work
 */

import React, { useState, useEffect } from 'react';
import { fetchCompetenceAnalysis } from '../../services/coreGroupService';
import { generateCompetenceAnalysisFromData } from '../../services/competencePatternAnalysis';
import { ClusteredBarChart } from './ClusteredBarChart';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Card } from './Card';
import type { DetailedCoreGroupAnalysis, CoreGroupTabProps, CoreGroupInsight } from '../../types/evaluation';
import type { CompetenceAnalysisResult } from '../../services/competencePatternAnalysis';

interface CompetenceTabProps extends CoreGroupTabProps {}

export const CompetenceTab: React.FC<CompetenceTabProps> = ({
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
  const [patternAnalysis, setPatternAnalysis] = useState<CompetenceAnalysisResult | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Loading competence analysis for employee ${employeeId} in quarter ${quarterId}`);
        const analysisData = await fetchCompetenceAnalysis(employeeId, quarterId);
        
        setData(analysisData);
        onDataLoad?.(analysisData);

        // Generate pattern analysis
        if (analysisData && employeeName) {
          try {
            const pattern = generateCompetenceAnalysisFromData(analysisData, employeeName);
            setPatternAnalysis(pattern);
            console.log('✅ Competence pattern analysis generated:', pattern?.title);
          } catch (patternError) {
            console.warn('⚠️ Could not generate competence pattern analysis:', patternError);
          }
        }
      } catch (err) {
        console.error('Error loading competence analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to load competence analysis');
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
          <div className="text-lg font-medium mb-2">No Competence Data Available</div>
          <p className="text-sm">
            No evaluation data found for {employeeName} in {quarterName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="competence-tab-content space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎯</span>
            <div>
              <h2 className="text-xl font-semibold text-secondary-800">
                Competence Analysis
              </h2>
              <p className="text-sm text-secondary-600">
                Execution & Delivery • {data.attributes.length} attributes evaluated
              </p>
            </div>
          </div>
        </div>
        
        {/* Attribute Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {data.attributes.map(attr => (
            <div key={attr.attributeName} className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
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
            <h3 className="text-lg font-medium text-secondary-800">Score Breakdown</h3>
            <p className="text-sm text-secondary-600">
              Self, peer, and manager evaluations for competence attributes
            </p>
          </div>
          
          <div className="h-80">
            <ClusteredBarChart
              data={chartData}
              height={320}
              showLegend={true}
              title=""
              showHelperText={false}
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
          
          {/* Helper Text */}
          <div className="text-xs text-secondary-500 text-center mt-3">
            Hover over bars to see full attribute names • Use the dropdown above to filter by evaluation type
          </div>
        </Card>

        {/* Right Side: Insights Panel */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-secondary-800">Insights & Recommendations</h3>
            <p className="text-sm text-secondary-600">
              Auto-generated development insights for competence attributes
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
                <p className="text-sm">No specific insights generated for this competence profile.</p>
              </div>
            )}
          </div>

          {/* Action Items Summary */}
          {data.insights.some(i => i.actionable) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Key Action Items</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {data.insights
                  .filter(i => i.actionable)
                  .slice(0, 3)
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

      {/* Pattern Analysis Section */}
      {patternAnalysis && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-secondary-800 flex items-center">
              <span className="mr-2">{patternAnalysis.riskIcon}</span>
              Competence Pattern Analysis
            </h3>
            <p className="text-sm text-secondary-600">
              Intelligent analysis of accountability, quality, and reliability patterns
            </p>
          </div>

          {/* Pattern Title */}
          <div className={`mb-4 p-4 rounded-lg border-l-4 ${
            patternAnalysis.riskLevel === 'low' ? 'bg-green-50 border-l-green-400' :
            patternAnalysis.riskLevel === 'medium' ? 'bg-yellow-50 border-l-yellow-400' :
            patternAnalysis.riskLevel === 'high' ? 'bg-orange-50 border-l-orange-400' :
            'bg-red-50 border-l-red-400'
          }`}>
            <h4 className="text-lg font-semibold text-secondary-800 mb-2">
              {patternAnalysis.title} ({patternAnalysis.pattern})
            </h4>
            <p className="text-secondary-700 leading-relaxed">
              {patternAnalysis.insight}
            </p>
          </div>

          {/* Perception Gaps */}
          {patternAnalysis.perceptionGaps.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h5 className="font-semibold text-amber-800 mb-2">⚠️ Perception Insights</h5>
              <div className="space-y-2">
                {patternAnalysis.perceptionGaps.map((gap, index) => (
                  <div key={index} className="text-sm text-amber-700">
                    {gap.type === 'overconfident' ? '📈' : '📉'} {' '}
                    {gap.type === 'overconfident' 
                      ? `May be overconfident in ${gap.attribute} (self-rates ${gap.gap} points higher)`
                      : `Undervalues their ${gap.attribute} (self-rates ${gap.gap} points lower)`
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-semibold text-blue-800 mb-2">🎯 Immediate</h5>
              <p className="text-sm text-blue-700">{patternAnalysis.recommendations.immediate}</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h5 className="font-semibold text-purple-800 mb-2">📚 Development</h5>
              <p className="text-sm text-purple-700">{patternAnalysis.recommendations.development}</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="font-semibold text-green-800 mb-2">🤝 Coaching</h5>
              <p className="text-sm text-green-700">{patternAnalysis.recommendations.coaching}</p>
            </div>
          </div>

          {/* Risk Level */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-secondary-700">Performance Risk Level:</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              patternAnalysis.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
              patternAnalysis.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              patternAnalysis.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {patternAnalysis.riskIcon} {patternAnalysis.riskLevel.charAt(0).toUpperCase() + patternAnalysis.riskLevel.slice(1)}
            </span>
          </div>
        </Card>
      )}

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
      case 'strength': return '💪';
      case 'development': return '📈';
      case 'awareness': return '🎯';
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