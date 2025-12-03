/**
 * Cached Data Provider - Wrapper for any IDataProvider with caching
 * 
 * Provides transparent caching layer over any data provider implementation.
 * Supports TTL-based expiration and manual cache management.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { Model } from '../models';
import { DataResponse, ICachedDataProvider, ICacheProvider, IDataProvider, SelectOptions } from '../types';
import { MemoryCacheProvider } from './MemoryCacheProvider';


/**
 * Configuration for cached data provider
 */
export interface CachedDataProviderConfig {
  /** Default TTL in milliseconds (default: 5 minutes) */
  defaultTTL?: number;
  /** Maximum cache size (default: 100 entries) */
  maxSize?: number;
  /** Enable debug logging */
  enableLogging?: boolean;
}

/**
 * Cache options union type for CachedDataProvider constructor
 */
export type CacheOptions = 
  | false  // No caching
  | true   // Default caching with MemoryCacheProvider
  | CachedDataProviderConfig  // MemoryCacheProvider with custom config
  | ICacheProvider<any>;  // Custom cache provider

/**
 * Wraps any IDataProvider with transparent caching
 */
export class CachedDataProvider implements ICachedDataProvider {
  private cacheProvider: ICacheProvider<any> | null;
  private provider: IDataProvider;
  private config: Required<CachedDataProviderConfig>;

  constructor(
    provider: IDataProvider,
    cacheOptions: CacheOptions = true
  ) {
    this.provider = provider;
    
    // Handle different cache option types
    if (cacheOptions === false) {
      // No caching
      this.cacheProvider = null;
      this.config = {
        defaultTTL: 5 * 60 * 1000,
        maxSize: 100,
        enableLogging: false
      };
    } else if (cacheOptions === true) {
      // Default MemoryCacheProvider
      this.cacheProvider = new MemoryCacheProvider();
      this.config = {
        defaultTTL: 5 * 60 * 1000,
        maxSize: 100,
        enableLogging: false
      };
    } else if ('get' in cacheOptions && 'set' in cacheOptions) {
      // Custom ICacheProvider
      this.cacheProvider = cacheOptions;
      this.config = {
        defaultTTL: 5 * 60 * 1000,
        maxSize: 100,
        enableLogging: false
      };
    } else {
      // CachedDataProviderConfig - create MemoryCacheProvider with config
      const config = cacheOptions as CachedDataProviderConfig;
      this.cacheProvider = new MemoryCacheProvider({
        maxSize: config.maxSize,
        defaultTtl: config.defaultTTL,
        enableLogging: config.enableLogging
      });
      this.config = {
        defaultTTL: config.defaultTTL ?? 5 * 60 * 1000,
        maxSize: config.maxSize ?? 100,
        enableLogging: config.enableLogging ?? false
      };
    }
  }

  /**
   * Get single data item by slug with caching
   */
  async get<T extends Model>(slug: string): Promise<DataResponse<T>> {
    // If no caching, directly return from provider
    if (!this.cacheProvider) {
      return await this.provider.get<T>(slug);
    }

    const cacheKey = `get:${slug}`;

    // Check cache first
    const cached = this.cacheProvider.get(cacheKey);
    if (cached) {
      this.log(`Cache hit for get(${slug})`);
      const baseResponse = await this.provider.get<T>(slug);
      return {
        ...baseResponse,
        data: cached,
        cached: true
      };
    }

    this.log(`Cache miss for get(${slug}), fetching from provider`);

    // Fetch from underlying provider
    const response = await this.provider.get<T>(slug);

    // Cache the result if successful
    if (response.data) {
      this.cacheProvider.set(cacheKey, response.data, this.config.defaultTTL);
    }

    return {
      ...response,
      cached: false
    };
  }

  /**
   * Select multiple data items with query options and caching
   */
  async select<T extends Model>(
    schema: string,
    options: SelectOptions = {}
  ): Promise<DataResponse<T[]>> {
    // If no caching, directly return from provider
    if (!this.cacheProvider) {
      return await this.provider.select<T>(schema, options);
    }

    const cacheKey = `select:${schema}:${JSON.stringify(options)}`;

    // Check cache first
    const cached = this.cacheProvider.get(cacheKey);
    if (cached) {
      this.log(`Cache hit for select(${schema})`);
      const baseResponse = await this.provider.select<T>(schema, options);
      return {
        ...baseResponse,
        data: cached,
        cached: true
      };
    }

    this.log(`Cache miss for select(${schema}), fetching from provider`);

    // Fetch from underlying provider
    const response = await this.provider.select<T>(schema, options);

    // Cache the result if successful
    if (response.data) {
      this.cacheProvider.set(cacheKey, response.data, this.config.defaultTTL);
    }

    return {
      ...response,
      cached: false
    };
  }

  /**
   * Clear cache with optional key pattern
   */
  clearCache(key?: string): void {
    if (!this.cacheProvider) {
      this.log('No cache provider, nothing to clear');
      return;
    }

    if (key) {
      // Clear specific key or pattern
      if (key.includes('*')) {
        // For pattern matching, we need to check if the cache provider supports getStats
        const stats = this.cacheProvider.getStats?.();
        if (stats) {
          const pattern = key.replace(/\*/g, '.*');
          const regex = new RegExp(pattern);
          for (const cacheKey of stats.keys) {
            if (regex.test(cacheKey)) {
              this.cacheProvider.clear(cacheKey);
              this.log(`Cleared cache key: ${cacheKey}`);
            }
          }
        } else {
          this.log('Cache provider does not support pattern clearing');
        }
      } else {
        this.cacheProvider.clear(key);
        this.log(`Cleared cache key: ${key}`);
      }
    } else {
      // Clear all cache
      this.cacheProvider.clear();
      this.log('Cleared all cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    if (!this.cacheProvider) {
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        maxSize: this.config.maxSize,
        defaultTTL: this.config.defaultTTL,
        cachingEnabled: false
      };
    }

    const stats = this.cacheProvider.getStats?.();
    return {
      totalEntries: stats?.size ?? 0,
      validEntries: stats?.size ?? 0, // Assume all are valid since ICacheProvider handles expiration
      expiredEntries: 0,
      maxSize: stats?.maxSize ?? this.config.maxSize,
      defaultTTL: this.config.defaultTTL,
      cachingEnabled: true,
      keys: stats?.keys ?? []
    };
  }

  /**
   * Manually set cache entry with custom TTL
   */
  setCacheEntryManually<T>(key: string, data: T, ttl?: number): void {
    if (!this.cacheProvider) {
      this.log('No cache provider, cannot set cache entry manually');
      return;
    }
    this.cacheProvider.set(key, data, ttl || this.config.defaultTTL);
    this.log(`Manually set cache entry: ${key} (TTL: ${ttl || this.config.defaultTTL}ms)`);
  }


  /**
   * Debug logging
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[CachedDataProvider] ${message}`);
    }
  }
}