/**
 * Compound Components Export Index
 * Centralized exports for all compound component patterns
 */

// Tab System
export { Tabs, TabList, Tab, TabPanels, useTabContext, useActiveTab } from './TabSystem';

// Higher-Order Components
export { 
  withLoadingState, 
  withChartLoading, 
  withDataTableLoading, 
  withFormLoading,
  useLoadingState,
  createSkeletonLoader 
} from '../hoc/withLoadingState';
