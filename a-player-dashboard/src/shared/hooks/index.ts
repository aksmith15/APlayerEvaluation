/**
 * Shared Hooks - Barrel Export
 * Centralized exports for shared hooks
 */

export { useDataFetch } from '../../hooks/useDataFetch';
export { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';

// Performance Context hooks
export { usePerformance, useComponentPerformance } from '../../contexts/PerformanceContext';

// Utility hooks
export * from '../../utils/useDataFetching';
export * from '../../utils/useResponsive';


