/**
 * Smart Cache Service
 * 
 * Provides intelligent caching with TTL, LRU eviction, storage persistence, and tenant-awareness.
 * Optimized for employee evaluation data with smart invalidation strategies.
 */

import { getCurrentCompanyId } from '../lib/tenantContext';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSize?: number; // Maximum number of items (LRU eviction)
  defaultTTL?: number; // Default TTL in milliseconds
  persistToStorage?: boolean; // Whether to persist to localStorage
  storagePrefix?: string; // Prefix for localStorage keys
  tenantAware?: boolean; // Whether to include company context in cache keys
}

export class SmartCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private readonly persistToStorage: boolean;
  private readonly storagePrefix: string;
  private readonly storageKey: string;
  private readonly tenantAware: boolean;

  constructor(
    name: string,
    config: CacheConfig = {}
  ) {
    this.maxSize = config.maxSize ?? 100;
    this.defaultTTL = config.defaultTTL ?? 5 * 60 * 1000; // 5 minutes default
    this.persistToStorage = config.persistToStorage ?? true;
    this.storagePrefix = config.storagePrefix ?? 'a-player-cache';
    this.storageKey = `${this.storagePrefix}-${name}`;
    this.tenantAware = config.tenantAware ?? true; // Default to tenant-aware

    // Load from storage if enabled (defer to prevent auth interference)
    if (this.persistToStorage) {
      // Defer localStorage operations to prevent auth blocking
      setTimeout(() => this.loadFromStorage(), 100);
    }

    // Cleanup expired items periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Generate tenant-aware cache key
   * Includes company context if tenantAware is enabled
   */
  private getTenantAwareKey(key: string): string {
    if (!this.tenantAware) {
      return key;
    }

    try {
      const companyId = getCurrentCompanyId();
      return companyId ? `${companyId}:${key}` : key;
    } catch {
      // If tenant context is not available, fall back to original key
      console.warn('[SmartCache] Tenant context not available, using non-tenant key:', key);
      return key;
    }
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const tenantKey = this.getTenantAwareKey(key);
    const item = this.cache.get(tenantKey);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    // Update access tracking
    item.accessCount++;
    item.lastAccessed = Date.now();
    
    return item.data;
  }

  /**
   * Set item in cache with optional TTL
   */
  set(key: string, data: T, ttl?: number): void {
    const tenantKey = this.getTenantAwareKey(key);
    const now = Date.now();
    const itemTTL = ttl ?? this.defaultTTL;

    // If at max capacity, remove LRU item
    if (this.cache.size >= this.maxSize && !this.cache.has(tenantKey)) {
      this.evictLRU();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: itemTTL,
      accessCount: 1,
      lastAccessed: now,
    };

    this.cache.set(tenantKey, item);
    this.saveToStorage();
  }

  /**
   * Check if cache has valid (non-expired) item
   */
  has(key: string): boolean {
    const tenantKey = this.getTenantAwareKey(key);
    const item = this.cache.get(tenantKey);
    if (!item || this.isExpired(item)) {
      if (item) {
        this.cache.delete(tenantKey);
        this.saveToStorage();
      }
      return false;
    }
    return true;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    const tenantKey = this.getTenantAwareKey(key);
    this.cache.delete(tenantKey);
    this.saveToStorage();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const items = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired: items.filter(item => this.isExpired(item)).length,
      totalAccesses: items.reduce((sum, item) => sum + item.accessCount, 0),
      averageAge: items.length > 0 
        ? items.reduce((sum, item) => sum + (now - item.timestamp), 0) / items.length 
        : 0,
    };
  }

  /**
   * Get or set pattern - fetch if not cached
   */
  async getOrSet<U extends T>(
    key: string,
    fetchFn: () => Promise<U>,
    ttl?: number
  ): Promise<U> {
    const cached = this.get(key);
    if (cached) {
      return cached as U;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache items matching pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.saveToStorage();
    }
    return count;
  }

  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestAccess) {
        oldestAccess = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const toDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        toDelete.push(key);
      }
    }

    if (toDelete.length > 0) {
      toDelete.forEach(key => this.cache.delete(key));
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    if (!this.persistToStorage) return;

    try {
      // Defer storage operations if localStorage is busy (e.g., during auth)
      requestIdleCallback(() => {
        try {
          const serializable = Array.from(this.cache.entries());
          localStorage.setItem(this.storageKey, JSON.stringify(serializable));
        } catch (error) {
          console.warn('Failed to save cache to storage:', error);
        }
      }, { timeout: 1000 });
    } catch (error) {
      console.warn('Failed to schedule cache save:', error);
    }
  }

  private loadFromStorage(): void {
    if (!this.persistToStorage) return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const entries: [string, CacheItem<T>][] = JSON.parse(stored);
        
        // Filter out expired items while loading
        const now = Date.now();
        for (const [key, item] of entries) {
          if (now - item.timestamp <= item.ttl) {
            this.cache.set(key, item);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }
}
