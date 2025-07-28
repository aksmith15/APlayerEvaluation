import React, { useState, useEffect } from 'react';
import { 
  fetchAttributeWeights, 
  updateAttributeWeights, 
  resetAttributeWeights,
  fetchWeightDistribution,
  calculateWeightImpact,
  getDefaultCompanyWeights,
  validateWeight 
} from '../../services/attributeWeightsService';
import type { AttributeWeight, AttributeWeightUpdate, WeightDistribution } from '../../types/database';
import { Button, Card, LoadingSpinner } from './';

interface AttributeWeightsManagerProps {
  onWeightsUpdated?: () => void;
}

export const AttributeWeightsManager: React.FC<AttributeWeightsManagerProps> = ({
  onWeightsUpdated
}) => {
  const [weights, setWeights] = useState<AttributeWeight[]>([]);
  const [distribution, setDistribution] = useState<WeightDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});

  // Load current weights on component mount
  useEffect(() => {
    loadWeights();
  }, []);

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
      
      // Initialize local weights state
      const localState: Record<string, number> = {};
      weightsData.forEach(weight => {
        localState[weight.attribute_name] = weight.weight;
      });
      setLocalWeights(localState);
      
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

  const handleResetToDefaults = async () => {
    if (!confirm('Reset all weights to your company defaults? This will override current settings.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const defaultWeights = getDefaultCompanyWeights();
      await updateAttributeWeights(defaultWeights);
      await loadWeights();
      setHasChanges(false);
      
      if (onWeightsUpdated) {
        onWeightsUpdated();
      }
    } catch (err) {
      console.error('Error resetting weights:', err);
      setError('Failed to reset attribute weights');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToEqual = async () => {
    if (!confirm('Reset all weights to 1.0 (equal importance)? This will override current settings.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await resetAttributeWeights();
      await loadWeights();
      setHasChanges(false);
      
      if (onWeightsUpdated) {
        onWeightsUpdated();
      }
    } catch (err) {
      console.error('Error resetting weights:', err);
      setError('Failed to reset attribute weights');
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
            <h2 className="text-2xl font-bold text-gray-900">Attribute Importance Weights</h2>
            <p className="text-gray-600 mt-1">
              Configure how much each attribute contributes to overall performance scores
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handleResetToEqual}
              disabled={saving}
            >
              Equal Weights (1.0)
            </Button>
            <Button
              variant="secondary"
              onClick={handleResetToDefaults}
              disabled={saving}
            >
              Company Defaults
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

        {/* Attribute Weight Controls */}
        <div className="space-y-4">
          {weights
            .sort((a, b) => (localWeights[b.attribute_name] || b.weight) - (localWeights[a.attribute_name] || a.weight))
            .map((weight, index) => {
              const currentWeight = localWeights[weight.attribute_name] || weight.weight;
              const distributionItem = distribution.find(d => d.attribute_name === weight.attribute_name);
              const percentage = distributionItem?.normalized_percentage || 0;

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
                      <div className="text-sm text-gray-600">{percentage}% of total</div>
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
                      {/* Visual weight indicator */}
                      <div 
                        className="absolute top-0 left-0 h-2 bg-blue-500 rounded-lg pointer-events-none"
                        style={{ width: `${(currentWeight / 5.0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 min-w-[2rem]">5.0</span>
                    
                    {/* Direct numeric input */}
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
}; 