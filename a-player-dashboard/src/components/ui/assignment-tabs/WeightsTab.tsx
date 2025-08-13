/**
 * Weights Tab Component
 * Wrapper for attribute weights management functionality
 */

import React, { Suspense } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';

// Lazy load the AttributeWeightsManager
const LazyAttributeWeightsManager = React.lazy(() => 
  import('../AttributeWeightsManager').then(module => ({ default: module.AttributeWeightsManager }))
);

interface WeightsTabProps {}

export const WeightsTab: React.FC<WeightsTabProps> = () => {
  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingSpinner message="Loading attribute weights manager..." />}>
        <LazyAttributeWeightsManager />
      </Suspense>
    </div>
  );
};
