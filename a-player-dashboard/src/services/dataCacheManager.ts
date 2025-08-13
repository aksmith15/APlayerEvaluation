/**
 * Data Cache Manager
 * 
 * Manages specialized cache instances for different types of application data.
 * Provides high-level caching strategies for employee evaluation system.
 */

import { SmartCache } from './smartCache';
import type { Person, WeightedEvaluationScore } from '../types/database';
import type { Quarter } from '../types/evaluation';
import type { CoreGroupAnalyticsResponse } from '../types/evaluation';

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  EMPLOYEE_DATA: 10 * 60 * 1000,     // 10 minutes - employee profiles change rarely
  QUARTER_DATA: 30 * 60 * 1000,      // 30 minutes - quarters are static
  EVALUATION_DATA: 5 * 60 * 1000,    // 5 minutes - evaluation scores can update
  CORE_GROUP_DATA: 5 * 60 * 1000,    // 5 minutes - analytics data can update
  CHART_DATA: 15 * 60 * 1000,        // 15 minutes - computed chart data
} as const;

// Cache instances
export const employeeCache = new SmartCache<Person>('employees', {
  maxSize: 200,
  defaultTTL: CACHE_TTL.EMPLOYEE_DATA,
  persistToStorage: true,
});

const employeeListCache = new SmartCache<Person[]>('employee-lists', {
  maxSize: 10,
  defaultTTL: CACHE_TTL.EMPLOYEE_DATA,
  persistToStorage: true,
});

export const quarterCache = new SmartCache<Quarter[]>('quarters', {
  maxSize: 10,
  defaultTTL: CACHE_TTL.QUARTER_DATA,
  persistToStorage: true,
});

export const evaluationCache = new SmartCache<WeightedEvaluationScore[]>('evaluations', {
  maxSize: 100,
  defaultTTL: CACHE_TTL.EVALUATION_DATA,
  persistToStorage: true,
});

export const coreGroupCache = new SmartCache<CoreGroupAnalyticsResponse>('coreGroups', {
  maxSize: 50,
  defaultTTL: CACHE_TTL.CORE_GROUP_DATA,
  persistToStorage: true,
});

export const chartDataCache = new SmartCache<any>('chartData', {
  maxSize: 100,
  defaultTTL: CACHE_TTL.CHART_DATA,
  persistToStorage: true,
});

/**
 * Employee Data Caching
 */
export const EmployeeCacheService = {
  async getEmployee(employeeId: string, fetchFn: () => Promise<Person>): Promise<Person> {
    return employeeCache.getOrSet(
      `employee-${employeeId}`,
      fetchFn,
      CACHE_TTL.EMPLOYEE_DATA
    );
  },

  async getEmployeeList(fetchFn: () => Promise<Person[]>): Promise<Person[]> {
    return employeeListCache.getOrSet(
      'employee-list',
      fetchFn,
      CACHE_TTL.EMPLOYEE_DATA
    );
  },

  invalidateEmployee(employeeId: string): void {
    employeeCache.delete(`employee-${employeeId}`);
    employeeListCache.delete('employee-list'); // Invalidate list when individual changes
  },

  invalidateAllEmployees(): void {
    employeeCache.clear();
    employeeListCache.clear();
  },
};

/**
 * Quarter Data Caching
 */
export const QuarterCacheService = {
  async getQuarters(fetchFn: () => Promise<Quarter[]>): Promise<Quarter[]> {
    return quarterCache.getOrSet(
      'quarters-list',
      fetchFn,
      CACHE_TTL.QUARTER_DATA
    );
  },

  async getAvailableQuarters(employeeId: string, fetchFn: () => Promise<Quarter[]>): Promise<Quarter[]> {
    return quarterCache.getOrSet(
      `available-quarters-${employeeId}`,
      fetchFn,
      CACHE_TTL.QUARTER_DATA
    );
  },

  invalidateQuarters(): void {
    quarterCache.clear();
  },
};

/**
 * Evaluation Data Caching
 */
export const EvaluationCacheService = {
  async getEvaluationScores(
    employeeId: string,
    quarterId: string,
    fetchFn: () => Promise<WeightedEvaluationScore[]>
  ): Promise<WeightedEvaluationScore[]> {
    return evaluationCache.getOrSet(
      `evaluations-${employeeId}-${quarterId}`,
      fetchFn,
      CACHE_TTL.EVALUATION_DATA
    );
  },

  async getHistoricalScores(
    employeeId: string,
    startQuarter: string,
    endQuarter: string,
    fetchFn: () => Promise<WeightedEvaluationScore[]>
  ): Promise<WeightedEvaluationScore[]> {
    return evaluationCache.getOrSet(
      `historical-${employeeId}-${startQuarter}-${endQuarter}`,
      fetchFn,
      CACHE_TTL.EVALUATION_DATA
    );
  },

  invalidateEmployee(employeeId: string): void {
    evaluationCache.invalidatePattern(new RegExp(`^(evaluations|historical)-${employeeId}-`));
  },

  invalidateQuarter(quarterId: string): void {
    evaluationCache.invalidatePattern(new RegExp(`-${quarterId}($|-)`));
  },

  invalidateAll(): void {
    evaluationCache.clear();
  },
};

/**
 * Core Group Analytics Caching
 */
export const CoreGroupCacheService = {
  async getCoreGroupAnalytics(
    employeeId: string,
    quarterId: string,
    fetchFn: () => Promise<CoreGroupAnalyticsResponse>
  ): Promise<CoreGroupAnalyticsResponse> {
    return coreGroupCache.getOrSet(
      `coregroup-${employeeId}-${quarterId}`,
      fetchFn,
      CACHE_TTL.CORE_GROUP_DATA
    );
  },

  invalidateEmployee(employeeId: string): void {
    coreGroupCache.invalidatePattern(new RegExp(`^coregroup-${employeeId}-`));
  },

  invalidateQuarter(quarterId: string): void {
    coreGroupCache.invalidatePattern(new RegExp(`-${quarterId}$`));
  },
};

/**
 * Chart Data Caching
 */
export const ChartDataCacheService = {
  async getChartData<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return chartDataCache.getOrSet(
      `chart-${key}`,
      computeFn,
      ttl ?? CACHE_TTL.CHART_DATA
    );
  },

  setChartData<T>(key: string, data: T, ttl?: number): void {
    chartDataCache.set(`chart-${key}`, data, ttl ?? CACHE_TTL.CHART_DATA);
  },

  invalidateChartData(pattern: string): void {
    chartDataCache.invalidatePattern(new RegExp(`chart-.*${pattern}.*`));
  },

  clearChartData(): void {
    chartDataCache.clear();
  },
};

/**
 * Global Cache Management
 */
export const GlobalCacheService = {
  /**
   * Get comprehensive cache statistics
   */
  getStats() {
    return {
      employees: employeeCache.getStats(),
      quarters: quarterCache.getStats(),
      evaluations: evaluationCache.getStats(),
      coreGroups: coreGroupCache.getStats(),
      chartData: chartDataCache.getStats(),
    };
  },

  /**
   * Clear all caches
   */
  clearAll(): void {
    employeeCache.clear();
    quarterCache.clear();
    evaluationCache.clear();
    coreGroupCache.clear();
    chartDataCache.clear();
  },

  /**
   * Invalidate data for specific employee across all caches
   */
  invalidateEmployee(employeeId: string): void {
    EmployeeCacheService.invalidateEmployee(employeeId);
    EvaluationCacheService.invalidateEmployee(employeeId);
    CoreGroupCacheService.invalidateEmployee(employeeId);
    ChartDataCacheService.invalidateChartData(employeeId);
  },

  /**
   * Invalidate data for specific quarter across all caches
   */
  invalidateQuarter(quarterId: string): void {
    EvaluationCacheService.invalidateQuarter(quarterId);
    CoreGroupCacheService.invalidateQuarter(quarterId);
    ChartDataCacheService.invalidateChartData(quarterId);
  },

  /**
   * Smart cache warming for likely-to-be-accessed data
   */
  async warmCache(employeeId: string, quarterId: string) {
    try {
      // This would be called with actual fetch functions in real usage
      console.log(`Warming cache for employee ${employeeId}, quarter ${quarterId}`);
      // Implementation would depend on available fetch functions
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  },
};
