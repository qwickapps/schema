/**
 * Data Provider Interface - Enhanced with Model constraints and slug-based lookups
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { Model } from '../models';

/**
 * Standardized data response wrapper
 */
export interface DataResponse<T> {
  data: T | undefined;
  loading?: boolean;
  error?: Error;
  cached?: boolean;
  meta?: {
    schema: string;
    version: string;
    slug?: string;
    total?: number;
    offset?: number;
    limit?: number;
  };
}

/**
 * Query options for select operations
 */
export interface SelectOptions {
  offset?: number;
  limit?: number;
  sort?: 'asc' | 'desc' | 'none';
  orderBy?: string;
  filters?: Record<string, any>;
}

/**
 * Enhanced data provider interface with Model constraints and slug-based lookups
 */
export interface IDataProvider {
  /**
   * Get single data item by slug
   * @param slug - Unique slug identifier (e.g., "/home/hero", "/products/featured", "company")
   * @returns Promise resolving to data instance conforming to Model or undefined
   */
  get<T extends Model>(slug: string): Promise<DataResponse<T>>;

  /**
   * Select multiple data items with query options
   * @param schema - Schema name for filtering
   * @param options - Query options (offset, limit, sort, filters)
   * @returns Promise resolving to array of data instances conforming to Model
   */
  select<T extends Model>(
    schema: string,
    options?: SelectOptions
  ): Promise<DataResponse<T[]>>;
}

export interface ICachedDataProvider extends IDataProvider {
  /**
   * Clear provider-specific cache (optional)
   * @param key - Optional specific cache key to clear
   */
  clearCache?(key?: string): void;
}
