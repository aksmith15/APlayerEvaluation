/**
 * CoreGroupAnalysisTabs Component - Stage 12.5
 * Tab container system for detailed core group analysis
 * Contains: CompetenceTab, CharacterTab, CuriosityTab
 */

import React, { useState, useCallback, useEffect } from 'react';
import { CompetenceTab } from './CompetenceTab';
import { CharacterTab } from './CharacterTab';
import { CuriosityTab } from './CuriosityTab';
import { fetchCompetenceAnalysis, fetchCharacterAnalysis, fetchCuriosityAnalysis } from '../../services/coreGroupService';
import type { DetailedCoreGroupAnalysis } from '../../types/evaluation';

interface CoreGroupAnalysisTabsProps {
  employeeId: string;
  quarterId: string;
  employeeName?: string;
  quarterName?: string;
  className?: string;
}

type TabType = 'competence' | 'character' | 'curiosity';

export const CoreGroupAnalysisTabs: React.FC<CoreGroupAnalysisTabsProps> = ({
  employeeId,
  quarterId,
  employeeName = '',
  quarterName = '',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('competence');
  const [tabData, setTabData] = useState<Record<TabType, DetailedCoreGroupAnalysis | null>>({
    competence: null,
    character: null,
    curiosity: null
  });
  const [loading, setLoading] = useState(true);

  // Eager load summary data for all tabs to show header scores immediately
  useEffect(() => {
    const loadAllTabSummaries = async () => {
      if (!employeeId || !quarterId) return;
      
      try {
        setLoading(true);
        console.log('🚀 Pre-loading all core group tab summaries for header display');
        
        // Load all three core group analyses in parallel
        const [competenceData, characterData, curiosityData] = await Promise.all([
          fetchCompetenceAnalysis(employeeId, quarterId).catch(err => {
            console.warn('Failed to load competence data:', err);
            return null;
          }),
          fetchCharacterAnalysis(employeeId, quarterId).catch(err => {
            console.warn('Failed to load character data:', err);
            return null;
          }),
          fetchCuriosityAnalysis(employeeId, quarterId).catch(err => {
            console.warn('Failed to load curiosity data:', err);
            return null;
          })
        ]);

        // Update all tab data at once
        setTabData({
          competence: competenceData,
          character: characterData,
          curiosity: curiosityData
        });
        
        console.log('✅ All core group tab summaries loaded successfully');
      } catch (error) {
        console.error('Error loading core group tab summaries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllTabSummaries();
  }, [employeeId, quarterId]);

  // Handle data loading from individual tabs (fallback for any missed data)
  const handleTabDataLoad = useCallback((tab: TabType) => 
    (data: DetailedCoreGroupAnalysis) => {
      setTabData(prev => ({
        ...prev,
        [tab]: data
      }));
    }, []
  );

  const tabs = [
    {
      id: 'competence' as TabType,
      name: 'Competence',
      emoji: '🎯',
      description: 'Execution & Delivery',
      color: 'blue',
      attributes: ['Reliability', 'Accountability for Action', 'Quality of Work']
    },
    {
      id: 'character' as TabType,
      name: 'Character',
      emoji: '👥',
      description: 'Leadership & Interpersonal',
      color: 'green',
      attributes: ['Leadership', 'Communication Skills', 'Teamwork']
    },
    {
      id: 'curiosity' as TabType,
      name: 'Curiosity',
      emoji: '🚀',
      description: 'Growth & Innovation',
      color: 'purple',
      attributes: ['Problem Solving Ability', 'Adaptability', 'Taking Initiative', 'Continuous Improvement']
    }
  ];

  const getTabClasses = (tabId: TabType, color: string) => {
    const isActive = activeTab === tabId;
    const baseClasses = 'relative px-6 py-4 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (isActive) {
      const activeColors = {
        blue: 'bg-blue-100 text-blue-700 border-blue-300 focus:ring-blue-500',
        green: 'bg-green-100 text-green-700 border-green-300 focus:ring-green-500',
        purple: 'bg-purple-100 text-purple-700 border-purple-300 focus:ring-purple-500'
      };
      return `${baseClasses} ${activeColors[color as keyof typeof activeColors]} border-2`;
    }
    
    return `${baseClasses} bg-white text-secondary-600 border-2 border-gray-200 hover:border-gray-300 hover:text-secondary-700 focus:ring-gray-500`;
  };

  const getTabDataSummary = (tabId: TabType) => {
    const data = tabData[tabId];
    if (!data) return null;
    
    const avgScore = data.attributes.reduce((acc, attr) => acc + attr.scores.weighted, 0) / data.attributes.length;
    const strengthsCount = data.insights.filter(i => i.type === 'strength').length;
    const developmentCount = data.insights.filter(i => i.type === 'development').length;
    
    return {
      avgScore: avgScore.toFixed(1),
      strengthsCount,
      developmentCount,
      attributeCount: data.attributes.length
    };
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-800 mb-2">
              Detailed Attribute Breakdown
            </h2>
            <p className="text-secondary-600">
              Individual attribute scores and insights by core group • {employeeName} • {quarterName}
            </p>
          </div>
          
          {/* Quick Statistics */}
          <div className="hidden lg:flex items-center space-x-6 text-sm">
            {tabs.map(tab => {
              const summary = getTabDataSummary(tab.id);
              return (
                <div key={tab.id} className="text-center">
                  <div className="text-lg font-semibold text-secondary-800">
                    {summary?.avgScore || '--'}
                  </div>
                  <div className="text-xs text-secondary-500">
                    {tab.name} Avg
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tabs.map(tab => {
            const summary = getTabDataSummary(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={getTabClasses(tab.id, tab.color)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">{tab.emoji}</span>
                    <div className="text-left">
                      <div className="font-semibold">{tab.name}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </div>
                  
                  {summary && (
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold">{summary.avgScore}</div>
                      <div className="text-xs opacity-75">
                        {summary.attributeCount} attrs
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Active Tab Indicator */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-current rounded-b-lg opacity-50"></div>
                )}
                
                {/* Data Loading Indicator */}
                {summary && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Mobile Tab Attributes Preview */}
        <div className="md:hidden mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium text-secondary-600 mb-2">
            {tabs.find(t => t.id === activeTab)?.name} Attributes:
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.find(t => t.id === activeTab)?.attributes.map(attr => (
              <span
                key={attr}
                className="px-2 py-1 text-xs bg-white border rounded-md text-secondary-600"
              >
                {attr}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
        {activeTab === 'competence' && (
          <div className="p-6">
            <CompetenceTab
              employeeId={employeeId}
              quarterId={quarterId}
              employeeName={employeeName}
              quarterName={quarterName}
              initialData={tabData.competence}
              onDataLoad={handleTabDataLoad('competence')}
            />
          </div>
        )}
        
        {activeTab === 'character' && (
          <div className="p-6">
            <CharacterTab
              employeeId={employeeId}
              quarterId={quarterId}
              employeeName={employeeName}
              quarterName={quarterName}
              initialData={tabData.character}
              onDataLoad={handleTabDataLoad('character')}
            />
          </div>
        )}
        
        {activeTab === 'curiosity' && (
          <div className="p-6">
            <CuriosityTab
              employeeId={employeeId}
              quarterId={quarterId}
              employeeName={employeeName}
              quarterName={quarterName}
              initialData={tabData.curiosity}
              onDataLoad={handleTabDataLoad('curiosity')}
            />
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {Object.values(tabData).some(data => data !== null) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {tabs.map(tab => {
              const summary = getTabDataSummary(tab.id);
              if (!summary) return null;
              
              return (
                <div key={tab.id} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-lg mr-2">{tab.emoji}</span>
                    <span className="font-medium text-secondary-700">{tab.name}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-secondary-800">
                      {summary.avgScore}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {summary.strengthsCount} strengths • {summary.developmentCount} development areas
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};