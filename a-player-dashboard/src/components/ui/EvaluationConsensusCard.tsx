/**
 * EvaluationConsensusCard Component
 * Right card in TopAnalyticsGrid showing evaluation consensus analysis
 * Displays: Radar chart comparing Self/Peer/Manager ratings + consensus metrics
 */

import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from './Card';
import type { CoreGroupAnalyticsResponse } from '../../types/evaluation';

interface EvaluationConsensusCardProps {
  data: CoreGroupAnalyticsResponse;
  className?: string;
}

export const EvaluationConsensusCard: React.FC<EvaluationConsensusCardProps> = ({
  data,
  className = ''
}) => {
  // Transform data for the radar chart
  const radarData = [
    {
      coreGroup: 'Competence',
      emoji: '🎯',
      Manager: data.coreGroups.competence.manager,
      Peer: data.coreGroups.competence.peer,
      Self: data.coreGroups.competence.self,
      fullMark: 10
    },
    {
      coreGroup: 'Character',
      emoji: '👥',
      Manager: data.coreGroups.character.manager,
      Peer: data.coreGroups.character.peer,
      Self: data.coreGroups.character.self,
      fullMark: 10
    },
    {
      coreGroup: 'Curiosity',
      emoji: '🚀',
      Manager: data.coreGroups.curiosity.manager,
      Peer: data.coreGroups.curiosity.peer,
      Self: data.coreGroups.curiosity.self,
      fullMark: 10
    }
  ];

  // Custom tooltip for radar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = radarData.find(item => item.coreGroup === label);
      return (
        <div className="bg-white p-4 border border-secondary-200 rounded-lg shadow-lg">
          <p className="font-semibold text-secondary-800 mb-2">
            {data?.emoji} {label}
          </p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                <span className="font-medium">{entry.dataKey}:</span> {entry.value.toFixed(1)}/10
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate consensus metrics
  const consensusMetrics = [
    {
      label: 'Self vs Others Gap',
      value: (
        (data.evaluatorConsensus.consensusMetrics.competence.self_vs_others_gap +
         data.evaluatorConsensus.consensusMetrics.character.self_vs_others_gap +
         data.evaluatorConsensus.consensusMetrics.curiosity.self_vs_others_gap) / 3
      ),
      description: 'Difference between self-assessment and external perspectives',
      threshold: 1.0
    },
    {
      label: 'Manager vs Peer Gap',
      value: (
        (data.evaluatorConsensus.consensusMetrics.competence.manager_vs_peer_gap +
         data.evaluatorConsensus.consensusMetrics.character.manager_vs_peer_gap +
         data.evaluatorConsensus.consensusMetrics.curiosity.manager_vs_peer_gap) / 3
      ),
      description: 'Alignment between management and peer perspectives',
      threshold: 1.0
    },
    {
      label: 'Overall Variance',
      value: (
        (data.evaluatorConsensus.consensusMetrics.competence.consensus_variance +
         data.evaluatorConsensus.consensusMetrics.character.consensus_variance +
         data.evaluatorConsensus.consensusMetrics.curiosity.consensus_variance) / 3
      ),
      description: 'Overall consensus across all evaluator types',
      threshold: 2.0
    }
  ];

  // Get consensus level indicator
  const getConsensusLevel = (value: number, threshold: number) => {
    if (value <= threshold * 0.5) return { level: 'High', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (value <= threshold) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Low', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  // Overall consensus assessment
  const avgGap = consensusMetrics[0].value;
  const overallConsensus = getConsensusLevel(avgGap, 1.0);

  return (
    <Card className={`${className}`}>
      {/* Card Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-secondary-800 mb-2">
          Evaluation Consensus
        </h3>
        <p className="text-sm text-secondary-600">
          Alignment between Self, Peer, and Manager perspectives
        </p>
      </div>

      {/* Radar Chart */}
      <div className="mb-6" style={{ height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis 
              dataKey="coreGroup" 
              tick={{ fontSize: 12, fill: '#64748B' }}
              className="text-xs"
            />
            <PolarRadiusAxis 
              angle={90}
              domain={[0, 10]}
              tick={{ fontSize: 10, fill: '#64748B' }}
              tickCount={4}
            />
            <Radar
              name="Manager"
              dataKey="Manager"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Peer"
              dataKey="Peer"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Self"
              dataKey="Self"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Evaluator Averages */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="text-lg font-bold text-red-600">
            {data.evaluatorConsensus.managerAverage.toFixed(1)}
          </div>
          <div className="text-xs text-red-600 font-medium">Manager</div>
          <div className="text-xs text-secondary-500">Average</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="text-lg font-bold text-green-600">
            {data.evaluatorConsensus.peerAverage.toFixed(1)}
          </div>
          <div className="text-xs text-green-600 font-medium">Peer</div>
          <div className="text-xs text-secondary-500">Average</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div className="text-lg font-bold text-purple-600">
            {data.evaluatorConsensus.selfAverage.toFixed(1)}
          </div>
          <div className="text-xs text-purple-600 font-medium">Self</div>
          <div className="text-xs text-secondary-500">Average</div>
        </div>
      </div>

      {/* Consensus Metrics */}
      <div className="space-y-3">
        {consensusMetrics.map((metric, index) => {
          const consensus = getConsensusLevel(metric.value, metric.threshold);
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium text-secondary-800">
                  {metric.label}
                </div>
                <div className="text-xs text-secondary-500">
                  {metric.description}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-secondary-800">
                  {metric.value.toFixed(1)}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${consensus.color} ${consensus.bgColor}`}>
                  {consensus.level}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Consensus Summary */}
      <div className="mt-6 pt-4 border-t border-secondary-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-secondary-600">Overall Consensus:</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${overallConsensus.color} ${overallConsensus.bgColor}`}>
            {overallConsensus.level} Alignment
          </div>
        </div>
      </div>

      {/* Consensus Insights */}
      <div className="mt-4">
        {avgGap > 1.5 ? (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ Significant perspective gaps detected. Consider calibration discussions.
          </div>
        ) : avgGap < 0.5 ? (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
            ✅ Strong consensus across evaluators. Reliable assessment foundation.
          </div>
        ) : (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            📊 Moderate consensus. Normal variation in perspectives.
          </div>
        )}
      </div>
    </Card>
  );
};