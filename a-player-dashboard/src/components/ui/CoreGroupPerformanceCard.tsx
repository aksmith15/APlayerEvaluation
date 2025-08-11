/**
 * CoreGroupPerformanceCard Component
 * Left card in TopAnalyticsGrid showing core group performance with bar chart and KPIs
 * Displays: Competence, Character, Curiosity scores with visual indicators
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from './Card';
import type { CoreGroupAnalyticsResponse } from '../../types/evaluation';

interface CoreGroupPerformanceCardProps {
  data: CoreGroupAnalyticsResponse;
  className?: string;
}

export const CoreGroupPerformanceCard: React.FC<CoreGroupPerformanceCardProps> = ({
  data,
  className = ''
}) => {
  // Transform data for the bar chart
  const chartData = [
    {
      name: 'Competence',
      score: data.coreGroups.competence.overall,
      self: data.coreGroups.competence.self,
      peer: data.coreGroups.competence.peer,
      manager: data.coreGroups.competence.manager,
      emoji: '🎯',
      color: '#3B82F6', // Blue
      attributes: data.coreGroups.competence.attribute_count,
      completion: data.coreGroups.competence.completion_percentage
    },
    {
      name: 'Character',
      score: data.coreGroups.character.overall,
      self: data.coreGroups.character.self,
      peer: data.coreGroups.character.peer,
      manager: data.coreGroups.character.manager,
      emoji: '👥',
      color: '#10B981', // Green
      attributes: data.coreGroups.character.attribute_count,
      completion: data.coreGroups.character.completion_percentage
    },
    {
      name: 'Curiosity',
      score: data.coreGroups.curiosity.overall,
      self: data.coreGroups.curiosity.self,
      peer: data.coreGroups.curiosity.peer,
      manager: data.coreGroups.curiosity.manager,
      emoji: '🚀',
      color: '#8B5CF6', // Purple
      attributes: data.coreGroups.curiosity.attribute_count,
      completion: data.coreGroups.curiosity.completion_percentage
    }
  ];

  // Custom tooltip for the bar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-secondary-200 rounded-lg shadow-lg">
          <p className="font-semibold text-secondary-800 mb-2">
            {data.emoji} {label}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-secondary-700">
              <span className="font-medium">Overall Score:</span> {data.score.toFixed(1)}/10
            </p>
            <div className="border-t border-secondary-200 pt-2 mt-2">
              <p className="text-blue-600">Manager: {data.manager.toFixed(1)}</p>
              <p className="text-green-600">Peer: {data.peer.toFixed(1)}</p>
              <p className="text-purple-600">Self: {data.self.toFixed(1)}</p>
            </div>
            <div className="border-t border-secondary-200 pt-2 mt-2 text-xs text-secondary-500">
              <p>{data.attributes} attributes • {data.completion.toFixed(0)}% complete</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Performance level classification
  const getPerformanceLevel = (score: number) => {
    if (score >= 8.0) return { level: 'High', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (score >= 6.0) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Low', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  // Calculate overall average
  const overallAverage = (
    data.coreGroups.competence.overall +
    data.coreGroups.character.overall +
    data.coreGroups.curiosity.overall
  ) / 3;

  return (
    <Card className={`core-group-performance-card ${className}`}>
      {/* Card Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-secondary-800 mb-2">
          Core Group Performance
        </h3>
        <p className="text-sm text-secondary-600">
          Strategic performance across the three core areas
        </p>
      </div>

      {/* Bar Chart */}
      <div className="mb-6" style={{ height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barCategoryGap="25%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis 
              dataKey="name"
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis 
              domain={[0, 10]}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={{ stroke: '#E2E8F0' }}
              label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748B', fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="score" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              stroke="#2563EB"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-3 gap-4">
        {chartData.map((group) => {
          const performance = getPerformanceLevel(group.score);
          return (
            <div 
              key={group.name}
              className={`${performance.bgColor} rounded-lg p-4 text-center border`}
              style={{ borderColor: group.color + '20' }}
            >
              <div className="text-2xl mb-1">{group.emoji}</div>
              <div className="text-lg font-bold text-secondary-800">
                {group.score.toFixed(1)}
              </div>
              <div className={`text-xs font-medium ${performance.color} mb-1`}>
                {performance.level}
              </div>
              <div className="text-xs text-secondary-500">
                {group.completion.toFixed(0)}% complete
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Summary */}
      <div className="mt-6 pt-4 border-t border-secondary-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-secondary-600">Overall Average:</span>
            <span className="ml-2 text-lg font-semibold text-secondary-800">
              {overallAverage.toFixed(1)}/10
            </span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceLevel(overallAverage).color} ${getPerformanceLevel(overallAverage).bgColor}`}>
            {getPerformanceLevel(overallAverage).level} Performer
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="mt-4 text-xs text-secondary-500">
        <div className="flex items-center justify-between">
          <span>
            Strongest: {chartData.reduce((max, group) => group.score > max.score ? group : max).emoji} 
            {chartData.reduce((max, group) => group.score > max.score ? group : max).name}
          </span>
          <span>
            Focus Area: {chartData.reduce((min, group) => group.score < min.score ? group : min).emoji}
            {chartData.reduce((min, group) => group.score < min.score ? group : min).name}
          </span>
        </div>
      </div>
    </Card>
  );
};