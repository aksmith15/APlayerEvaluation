/**
 * Chart Components Export File
 * 
 * This file provides direct access to chart components for static imports.
 * Using this approach instead of index.ts exports enables better code splitting
 * by allowing Vite to optimize chart library bundles separately.
 * 
 * Usage:
 * - For dynamic loading: Use LazyChart component
 * - For static imports: Import directly from this file
 */

export { RadarChart } from './RadarChart';
export { ClusteredBarChart } from './ClusteredBarChart';
export { HistoricalClusteredBarChart } from './HistoricalClusteredBarChart';
export { TrendLineChart } from './TrendLineChart';
