/**
 * Shared UI Components - Barrel Export
 * Centralized exports for basic UI components
 */

// Basic UI components
export { Button } from '../../../components/ui/Button';
export { Card } from '../../../components/ui/Card';
export { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
export { ErrorMessage } from '../../../components/ui/ErrorMessage';
export { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
export { EmptyState } from '../../../components/ui/EmptyState';
export { SkeletonLoader } from '../../../components/ui/SkeletonLoader';

// Navigation components
export { Breadcrumb } from '../../../components/ui/Breadcrumb';
export { KeyboardShortcuts } from '../../../components/ui/KeyboardShortcuts';

// Form components
export { SearchInput } from '../../../components/ui/SearchInput';
export { QuarterRangeSelector } from '../../../components/ui/QuarterRangeSelector';

// Data display
export { LetterGrade } from '../../../components/ui/LetterGrade';
export { EvaluationConsensusCard } from '../../../components/ui/EvaluationConsensusCard';

// Compound components
export { 
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  useTabContext, 
  useActiveTab 
} from '../../../components/ui/compound/TabSystem';

// Higher-order components
export { 
  withLoadingState, 
  withChartLoading, 
  withDataTableLoading, 
  withFormLoading,
  useLoadingState,
  createSkeletonLoader 
} from '../../../components/ui/hoc/withLoadingState';

// PDF components
export { PDFViewer } from '../../../components/ui/PDFViewer';
export { GeneratePDFButton } from '../../../components/ui/GeneratePDFButton';
