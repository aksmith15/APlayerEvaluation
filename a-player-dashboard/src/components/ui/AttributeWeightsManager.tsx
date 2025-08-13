import React, { useState, useEffect, memo } from 'react';
import { 
  fetchAttributeWeights, 
  updateAttributeWeights, 
  fetchWeightDistribution,
  calculateWeightImpact,
  validateWeight 
} from '../../services/attributeWeightsService';
import type { AttributeWeight, AttributeWeightUpdate, WeightDistribution } from '../../types/database';
import { Button, Card, LoadingSpinner } from './';

// Default attribute ranking - Quality of Work, Reliability, Accountability for Action first
const DEFAULT_ATTRIBUTE_RANKING = [
  "Quality of Work",
  "Reliability", 
  "Accountability for Action",
  "Communication Skills",
  "Leadership",
  "Problem Solving Ability",
  "Teamwork",
  "Taking Initiative",
  "Adaptability",
  "Continuous Improvement"
];

// Industry Templates for different business contexts
interface IndustryTemplate {
  name: string;
  description: string;
  guidance: string;
  attributeRanking: string[]; // Ordered from most important to least important
}

const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  sales: {
    name: "Sales Team",
    description: "Optimized for sales representatives and account managers",
    guidance: "Sales roles require strong communication skills and initiative to drive revenue. Leadership and accountability are critical for managing client relationships and hitting targets.",
    attributeRanking: [
      "Quality of Work",
      "Reliability",
      "Accountability for Action",
      "Communication Skills",
      "Taking Initiative", 
      "Leadership",
      "Adaptability",
      "Problem Solving Ability",
      "Teamwork",
      "Continuous Improvement"
    ]
  },
  operations: {
    name: "Operations Team", 
    description: "Designed for operations managers and process specialists",
    guidance: "Operations roles prioritize reliability and process excellence. Quality of work and continuous improvement are essential for optimizing workflows and maintaining efficiency.",
    attributeRanking: [
      "Quality of Work",
      "Reliability",
      "Accountability for Action",
      "Continuous Improvement",
      "Problem Solving Ability",
      "Teamwork",
      "Adaptability",
      "Communication Skills",
      "Taking Initiative",
      "Leadership"
    ]
  },
  fieldWorkers: {
    name: "Field Workers",
    description: "Tailored for construction, electricians, and hands-on technical roles",
    guidance: "Field work demands accountability and reliability above all. Quality work and problem-solving are essential for safety and project success, while adaptability helps handle unexpected on-site challenges.",
    attributeRanking: [
      "Quality of Work",
      "Reliability",
      "Accountability for Action",
      "Adaptability",
      "Taking Initiative",
      "Problem Solving Ability",
      "Teamwork",
      "Communication Skills",
      "Continuous Improvement",
      "Leadership"
    ]
  },
  executive: {
    name: "Executive Team",
    description: "Configured for C-level executives and senior leadership",
    guidance: "Executive roles require visionary leadership and strategic accountability. Taking initiative and adaptability are crucial for driving organizational change and growth.",
    attributeRanking: [
      "Quality of Work",
      "Reliability",
      "Accountability for Action",
      "Leadership",
      "Taking Initiative",
      "Adaptability", 
      "Communication Skills",
      "Problem Solving Ability",
      "Continuous Improvement",
      "Teamwork"
    ]
  }
};

interface AttributeWeightsManagerProps {
  onWeightsUpdated?: () => void;
}

export const AttributeWeightsManager: React.FC<AttributeWeightsManagerProps> = memo(({
  onWeightsUpdated
}) => {
  const [weights, setWeights] = useState<AttributeWeight[]>([]);
  const [distribution, setDistribution] = useState<WeightDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});
  
  // New state for drag-and-drop ranking
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [attributeRanking, setAttributeRanking] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [useRankingMode, setUseRankingMode] = useState(true);

  // Load current weights on component mount
  useEffect(() => {
    loadWeights();
  }, []);

  // Initialize ranking from current weights when data loads
  // (Weight redistribution logic moved to loadWeights function for better timing)

  // Convert ranking to weights (top item gets 1.9, others scale down)
  const convertRankingToWeights = (ranking: string[]): Record<string, number> => {
    const weightMap: Record<string, number> = {};
    const maxWeight = 1.9;
    const minWeight = 1.0;
    const totalItems = ranking.length;
    
    ranking.forEach((attributeName, index) => {
      // Linear scaling from maxWeight to minWeight
      const weightRange = maxWeight - minWeight;
      const weight = maxWeight - (weightRange * index / (totalItems - 1));
      weightMap[attributeName] = Math.round(weight * 10) / 10; // Round to 1 decimal
    });
    
    return weightMap;
  };

  const loadWeights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [weightsData, distributionData] = await Promise.all([
        fetchAttributeWeights(),
        fetchWeightDistribution()
      ]);
      
      setWeights(weightsData);
      setDistribution(distributionData);
      
      // Create default ranking with Quality of Work, Reliability, Accountability for Action as top 3
      const attributeNames = weightsData.map(w => w.attribute_name);
      const orderedRanking = DEFAULT_ATTRIBUTE_RANKING.filter(attr => attributeNames.includes(attr));
      const remainingAttributes = attributeNames.filter(attr => !DEFAULT_ATTRIBUTE_RANKING.includes(attr));
      const finalRanking = [...orderedRanking, ...remainingAttributes];
      
      // Set the ranking
      setAttributeRanking(finalRanking);
      
      // Redistribute weights according to the new ranking
      const redistributedWeights = convertRankingToWeights(finalRanking);
      setLocalWeights(redistributedWeights);
      setHasChanges(true); // Mark as having changes so user can save the new distribution
      
    } catch (err) {
      console.error('Error loading weights:', err);
      setError('Failed to load attribute weights');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (attributeName: string, newWeight: number) => {
    const validation = validateWeight(newWeight);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid weight value');
      return;
    }

    setLocalWeights(prev => ({
      ...prev,
      [attributeName]: newWeight
    }));
    setHasChanges(true);
    setError(null);
  };

  // Handle ranking changes
  const handleRankingChange = (newRanking: string[]) => {
    setAttributeRanking(newRanking);
    const newWeights = convertRankingToWeights(newRanking);
    setLocalWeights(newWeights);
    setHasChanges(true);
    setSelectedTemplate(null); // Clear template selection when manually changing ranking
  };

  // Apply industry template
  const applyTemplate = (templateKey: string) => {
    const template = INDUSTRY_TEMPLATES[templateKey];
    if (!template) return;
    
    setSelectedTemplate(templateKey);
    setAttributeRanking(template.attributeRanking);
    const newWeights = convertRankingToWeights(template.attributeRanking);
    setLocalWeights(newWeights);
    setHasChanges(true);
    setError(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null) return;
    
    const newRanking = [...attributeRanking];
    const draggedAttribute = newRanking[draggedItem];
    
    // Remove the dragged item
    newRanking.splice(draggedItem, 1);
    // Insert it at the new position
    newRanking.splice(dropIndex, 0, draggedAttribute);
    
    handleRankingChange(newRanking);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      // Create updates array from local changes
      const updates: AttributeWeightUpdate[] = Object.entries(localWeights).map(([attributeName, weight]) => ({
        attribute_name: attributeName,
        weight,
        description: weights.find(w => w.attribute_name === attributeName)?.description
      }));

      await updateAttributeWeights(updates);
      await loadWeights(); // Reload to get fresh data
      setHasChanges(false);
      
      if (onWeightsUpdated) {
        onWeightsUpdated();
      }
    } catch (err) {
      console.error('Error saving weights:', err);
      setError('Failed to save attribute weights');
    } finally {
      setSaving(false);
    }
  };



  const impact = calculateWeightImpact(weights);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading attribute weights...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Attribute Importance Ranking</h2>
            <div className="mt-2 space-y-1">
              <p className="text-gray-600">
                Drag and drop attributes to rank their importance. Higher positions get more weight in evaluations.
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-orange-700 font-medium">Company-Wide Impact:</span>
                <span className="text-gray-700">Changes affect all employees and future evaluations</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700 font-medium">PDF Report Order:</span>
                <span className="text-gray-700">Higher ranked attributes appear first in Strengths sections</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setUseRankingMode(!useRankingMode)}
              disabled={saving}
            >
              {useRankingMode ? 'Advanced Mode' : 'Ranking Mode'}
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={!hasChanges || saving}
              variant={hasChanges ? "primary" : "secondary"}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

                 {error && (
           <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
             <div className="flex items-center justify-between">
               <span className="text-red-800">{error}</span>
               <button
                 onClick={() => setError(null)}
                 className="text-red-600 hover:text-red-800 text-sm"
               >
                 Dismiss
               </button>
             </div>
           </div>
         )}

        {/* Industry Templates */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Quick Start Templates</h3>
          <p className="text-sm text-blue-700 mb-4">
            Choose a template based on your industry or role type to get recommended attribute rankings.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(INDUSTRY_TEMPLATES).map(([key, template]) => (
              <div 
                key={key} 
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedTemplate === key 
                    ? 'border-blue-500 bg-blue-100' 
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
                onClick={() => applyTemplate(key)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  {selectedTemplate === key && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <p className="text-xs text-gray-500">{template.guidance}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weight Impact Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{impact.totalWeight}</div>
            <div className="text-sm text-gray-600">Total Weight</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{impact.averageWeight}</div>
            <div className="text-sm text-gray-600">Average Weight</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{impact.highestWeight.attribute}</div>
            <div className="text-sm text-gray-600">Highest Priority ({impact.highestWeight.weight})</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{impact.lowestWeight.attribute}</div>
            <div className="text-sm text-gray-600">Lowest Priority ({impact.lowestWeight.weight})</div>
          </div>
        </div>

        {/* Drag and Drop Ranking Interface */}
        {useRankingMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Attribute Priority Ranking</h3>
              <div className="text-sm text-gray-600">
                Drag to reorder • Top = {(localWeights[attributeRanking[0]] || 1.9).toFixed(1)} weight • Bottom = {(localWeights[attributeRanking[attributeRanking.length - 1]] || 1.0).toFixed(1)} weight
              </div>
            </div>
            
            <div className="space-y-2">
              {attributeRanking.map((attributeName, index) => {
                const currentWeight = localWeights[attributeName] || weights.find(w => w.attribute_name === attributeName)?.weight || 1.0;
                
                // Calculate live percentage based on current local weights
                const totalCurrentWeight = Object.values(localWeights).length > 0 
                  ? Object.values(localWeights).reduce((sum, weight) => sum + weight, 0)
                  : weights.reduce((sum, w) => sum + w.weight, 0);
                const livePercentage = totalCurrentWeight > 0 ? Math.round((currentWeight / totalCurrentWeight) * 100) : 0;
                
                return (
                  <div
                    key={attributeName}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`border rounded-lg p-4 bg-white cursor-move transition-all duration-200 ${
                      draggedItem === index ? 'opacity-50 transform scale-95' : 'hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Drag Handle */}
                        <div className="flex flex-col space-y-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        </div>
                        
                        {/* Priority Badge */}
                        <div className={`w-8 h-8 rounded text-white text-sm flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-red-500' : 
                          index === 1 ? 'bg-orange-500' : 
                          index === 2 ? 'bg-yellow-500' : 
                          index <= 4 ? 'bg-green-500' : 
                          'bg-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Attribute Info */}
                        <div>
                          <h3 className="font-medium text-gray-900">{attributeName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Weight: {currentWeight.toFixed(1)}</span>
                            <span>{livePercentage}% of total</span>
                            <span className="text-xs text-gray-500">
                              {currentWeight >= 1.8 ? 'Critical Priority' :
                               currentWeight >= 1.6 ? 'High Priority' : 
                               currentWeight >= 1.4 ? 'Medium Priority' :
                               currentWeight >= 1.2 ? 'Standard Priority' : 'Low Priority'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Weight Indicator Bar - Shows relative weight more proportionally */}
                      <div className="w-24 h-4 bg-gray-200 rounded-full relative">
                        {(() => {
                          // Calculate min and max percentages in current ranking for better scaling
                          const allPercentages = attributeRanking.map(name => {
                            const weight = localWeights[name] || weights.find(w => w.attribute_name === name)?.weight || 1.0;
                            return Math.round((weight / totalCurrentWeight) * 100);
                          });
                          const minPercentage = Math.min(...allPercentages);
                          const maxPercentage = Math.max(...allPercentages);
                          const range = maxPercentage - minPercentage;
                          
                          // Scale bar from 20% to 100% based on relative position within the range
                          const relativePosition = range > 0 ? (livePercentage - minPercentage) / range : 0.5;
                          const barWidth = 20 + (relativePosition * 80); // 20% minimum, scales to 100%
                          
                          return (
                            <div 
                              className="h-4 bg-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Advanced Numeric Controls */
          <div className="space-y-4">
            {weights
              .sort((a, b) => (localWeights[b.attribute_name] || b.weight) - (localWeights[a.attribute_name] || a.weight))
              .map((weight, index) => {
                const currentWeight = localWeights[weight.attribute_name] || weight.weight;
                
                // Calculate live percentage for advanced mode too
                const totalCurrentWeight = Object.values(localWeights).length > 0 
                  ? Object.values(localWeights).reduce((sum, w) => sum + w, 0)
                  : weights.reduce((sum, w) => sum + w.weight, 0);
                const livePercentage = totalCurrentWeight > 0 ? Math.round((currentWeight / totalCurrentWeight) * 100) : 0;

                return (
                  <div key={weight.attribute_name} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded text-white text-xs flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-red-500' : 
                          index === 1 ? 'bg-orange-500' : 
                          index === 2 ? 'bg-yellow-500' : 
                          index <= 4 ? 'bg-green-500' : 
                          'bg-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{weight.attribute_name}</h3>
                          {weight.description && (
                            <p className="text-sm text-gray-600">{weight.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{currentWeight}</div>
                        <div className="text-sm text-gray-600">{livePercentage}% of total</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {currentWeight >= 3.0 ? 'Critical Priority' :
                           currentWeight >= 2.0 ? 'High Priority' : 
                           currentWeight >= 1.5 ? 'Medium Priority' :
                           currentWeight >= 1.0 ? 'Standard Priority' : 'Low Priority'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 min-w-[2rem]">0.1</span>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min="0.1"
                          max="5.0"
                          step="0.1"
                          value={currentWeight}
                          onChange={(e) => handleWeightChange(weight.attribute_name, parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div 
                          className="absolute top-0 left-0 h-2 bg-blue-500 rounded-lg pointer-events-none"
                          style={{ width: `${(currentWeight / 5.0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 min-w-[2rem]">5.0</span>
                      
                      <input
                        type="number"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={currentWeight}
                        onChange={(e) => handleWeightChange(weight.attribute_name, parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Save Changes Reminder */}
        {hasChanges && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-yellow-800 font-medium">You have unsaved changes</span>
              </div>
              <Button
                onClick={handleSaveChanges}
                disabled={saving}
                size="sm"
                variant="primary"
              >
                {saving ? 'Saving...' : 'Save Now'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Weight Distribution Visualization */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight Distribution</h3>
        <div className="space-y-2">
          {distribution
            .sort((a, b) => b.weight - a.weight)
            .map((item) => (
              <div key={item.attribute_name} className="flex items-center">
                <div className="w-32 text-sm text-gray-700 truncate">{item.attribute_name}</div>
                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-4 relative">
                  <div 
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${item.normalized_percentage}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {item.normalized_percentage}%
                  </span>
                </div>
                <div className="w-12 text-right text-sm font-medium text-gray-900">
                  {item.weight}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}); 