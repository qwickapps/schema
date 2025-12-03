/**
 * MemoryCacheProvider - Pure memory caching with LRU eviction and TTL
 * 
 * Single Responsibility: Pure caching only
 * NO data fetching, NO template resolution - just caching
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { ICacheProvider } from '../types';

/**
 * Cache entry with timestamp for TTL support
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

/**
 * Configuration for MemoryCacheProvider
 */
export interface MemoryCacheConfig {
  /** Maximum number of entries (default: 100) */
  maxSize?: number;
  /** Default TTL in milliseconds (default: 5 minutes) */
  defaultTtl?: number;
  /** Enable debug logging */
  enableLogging?: boolean;
}

/**
 * Pure memory cache with LRU eviction and TTL support
 * 
 * Features:
 * - LRU (Least Recently Used) eviction when maxSize is reached
 * - TTL (Time To Live) support for automatic expiration
 * - Per-entry TTL override support
 * - Cache statistics
 * 
 * Usage:
 * ```typescript
 * const cache = new MemoryCacheProvider({ maxSize: 50, defaultTtl: 300000 });
 * cache.set('key1', data, 60000); // 1 minute TTL
 * const cached = cache.get('key1');
 * ```
 */
export class MemoryCacheProvider<T> implements ICacheProvider<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: Required<MemoryCacheConfig>;

  constructor(config: MemoryCacheConfig = {}) {
    this.config = {
      maxSize: 100,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      enableLogging: false,
      ...config
    };

    this.log('MemoryCacheProvider initialized', { config: this.config });
  }

  /**
   * Get cached value by key
   * Returns null if not found or expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.log(`Cache miss: ${key}`);
      return null;
    }

    // Check if expired
    const now = Date.now();
    const ttl = entry.ttl || this.config.defaultTtl;
    const isExpired = now - entry.timestamp > ttl;

    if (isExpired) {
      this.cache.delete(key);
      this.log(`Cache expired: ${key}`);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.log(`Cache hit: ${key}`);
    return entry.data;
  }

  /**
   * Set cached value with optional TTL
   */
  set(key: string, value: T, ttl?: number): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.log(`LRU evicted: ${oldestKey}`);
      }
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, entry);
    this.log(`Cache set: ${key}`, { ttl: ttl || this.config.defaultTtl });
  }

  /**
   * Clear cache entry or all entries
   */
  clear(key?: string): void {
    if (key) {
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.log(`Cache cleared: ${key}`);
      }
    } else {
      this.cache.clear();
      this.log('Cache cleared completely');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   * This can be called periodically to free memory
   */
  public cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const ttl = entry.ttl || this.config.defaultTtl;
      const isExpired = now - entry.timestamp > ttl;

      if (isExpired) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.log(`Cleanup removed ${removedCount} expired entries`);
    }

    return removedCount;
  }

  /**
   * Debug logging (only when enabled)
   */
  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[MemoryCacheProvider] ${message}`, data || '');
    }
  }
}