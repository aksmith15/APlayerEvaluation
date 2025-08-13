/**
 * Cached Data Service
 * 
 * Provides cached versions of data fetching functions with intelligent invalidation.
 * This service wraps existing data fetchers with smart caching capabilities.
 */

import { ChartDataCacheService, GlobalCacheService } from './dataCacheManager';
import * as originalDataFetching from './dataFetching';

/**
 * Enhanced chart data with persistence
 */
export const ChartDataService = {
  /**
   * Cache chart data transformations to avoid recalculation
   */
  async getCachedChartData<T>(
    key: string,
    computeFn: () => T | Promise<T>,
    ttl?: number
  ): Promise<T> {
    return ChartDataCacheService.getChartData(key, async () => {
      const result = await computeFn();
      return result;
    }, ttl);
  },

  /**
   * Cache radar chart data
   */
  async getRadarChartData(
    employeeId: string,
    quarterId: string,
    evaluationScores: any[]
  ): Promise<any[]> {
    const cacheKey = `radar-${employeeId}-${quarterId}`;
    
    return this.getCachedChartData(cacheKey, () => {
      // Transform evaluation scores to radar chart format
      return evaluationScores.map(score => ({
        attribute: score.attribute_name.replace(/_/g, ' '),
        manager: score.manager_score || 0,
        peer: score.peer_score || 0,
        self: score.self_score || 0,
        weighted: score.weighted_final_score || 0,
      }));
    });
  },

  /**
   * Cache clustered bar chart data
   */
  async getClusteredBarChartData(
    employeeId: string,
    quarterId: string,
    evaluationScores: any[]
  ): Promise<any[]> {
    const cacheKey = `clustered-bar-${employeeId}-${quarterId}`;
    
    return this.getCachedChartData(cacheKey, () => {
      return evaluationScores.map(score => ({
        attribute: score.attribute_name,
        manager: score.manager_score || 0,
        peer: score.peer_score || 0,
        self: score.self_score || 0,
        weighted: score.weighted_final_score || 0,
        hasManager: score.has_manager_eval,
        hasPeer: score.has_peer_eval,
        hasSelf: score.has_self_eval,
        completion: score.completion_percentage || 0,
      }));
    });
  },

  /**
   * Cache trend line data
   */
  async getTrendLineData(
    employeeId: string,
    trendData: any[]
  ): Promise<any[]> {
    const cacheKey = `trend-${employeeId}`;
    
    return this.getCachedChartData(cacheKey, () => {
      return trendData.map(trend => ({
        quarter: trend.quarter_id,
        quarterName: trend.quarter_name,
        averageScore: trend.final_quarter_score || 0,
        completionRate: trend.completion_percentage || 0,
        quarterDate: trend.quarter_start_date,
      }));
    });
  },

  /**
   * Invalidate chart data for specific employee
   */
  invalidateEmployeeCharts(employeeId: string): void {
    ChartDataCacheService.invalidateChartData(employeeId);
  },

  /**
   * Invalidate chart data for specific quarter
   */
  invalidateQuarterCharts(quarterId: string): void {
    ChartDataCacheService.invalidateChartData(quarterId);
  },
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidationService = {
  /**
   * Invalidate all data for an employee when their data changes
   */
  invalidateEmployee(employeeId: string): void {
    GlobalCacheService.invalidateEmployee(employeeId);
  },

  /**
   * Invalidate all data for a quarter when evaluation data changes
   */
  invalidateQuarter(quarterId: string): void {
    GlobalCacheService.invalidateQuarter(quarterId);
  },

  /**
   * Smart invalidation based on data type
   */
  smartInvalidate(changeType: 'employee' | 'evaluation' | 'quarter', id: string): void {
    switch (changeType) {
      case 'employee':
        this.invalidateEmployee(id);
        break;
      case 'quarter':
        this.invalidateQuarter(id);
        break;
      case 'evaluation':
        // For evaluation changes, we might need to invalidate both employee and quarter
        // This would be enhanced based on the actual change details
        console.log(`Smart invalidation for evaluation change: ${id}`);
        break;
    }
  },

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats() {
    return GlobalCacheService.getStats();
  },

  /**
   * Clear all caches (useful for debugging or data reset)
   */
  clearAllCaches(): void {
    GlobalCacheService.clearAll();
  },
};

/**
 * Enhanced data fetching with automatic caching
 */
export const CachedDataFetching = {
  /**
   * Fetch employees with caching (already implemented in dataFetching.ts)
   */
  fetchEmployees: originalDataFetching.fetchEmployees,

  /**
   * Fetch employee data with caching (already implemented in dataFetching.ts)
   */
  fetchEmployeeData: originalDataFetching.fetchEmployeeData,

  /**
   * Fetch quarters with caching (already implemented in dataFetching.ts)
   */
  fetchQuarters: originalDataFetching.fetchQuarters,

  /**
   * Fetch evaluation scores with caching (already implemented in dataFetching.ts)
   */
  fetchEvaluationScores: originalDataFetching.fetchEvaluationScores,

  /**
   * Additional cached data fetchers can be added here
   */
};

/**
 * Preloading service for performance optimization
 */
export const DataPreloadingService = {
  /**
   * Preload likely-to-be-accessed data for better UX
   */
  async preloadEmployeeData(employeeId: string, quarterId: string): Promise<void> {
    try {
      // Preload in parallel for better performance
      await Promise.allSettled([
        CachedDataFetching.fetchEmployeeData(employeeId),
        CachedDataFetching.fetchEvaluationScores(employeeId, quarterId),
        // Add more preloading as needed
      ]);
      
      console.log(`✅ Preloaded data for employee ${employeeId}, quarter ${quarterId}`);
    } catch (error) {
      console.warn('Data preloading failed:', error);
    }
  },

  /**
   * Preload quarter-related data
   */
  async preloadQuarterData(): Promise<void> {
    try {
      await CachedDataFetching.fetchQuarters();
      console.log('✅ Preloaded quarter data');
    } catch (error) {
      console.warn('Quarter preloading failed:', error);
    }
  },
};
