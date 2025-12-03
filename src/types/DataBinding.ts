/**
 * Data Binding Types for Schema-Driven Component System
 * 
 * Minimal types needed for data binding with Model constraints
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

/**
 * Props that can be added to any component to enable data binding
 */
export interface DataBindingProps {
  /** Data source identifier - slug-based format (e.g., "/home/hero", "company/tagline") */
  dataSource?: string;
}

/**
 * Metadata about the data binding resolution
 */
export interface DataBindingMeta {
  /** Whether data is currently loading */
  loading?: boolean;
  /** Any error that occurred during data loading */
  error?: Error | null;
  /** The resolved data source identifier */
  dataSource?: string;
  /** Whether the data came from cache */
  cached?: boolean;
  /** Prefixed metadata properties to avoid conflicts */
  $loading?: boolean;
  $error?: Error | null;
  $dataSource?: string;
  $cached?: boolean;
}

/**
 * Data binding configuration options
 */
export interface DataBindingOptions {
  /** Enable caching for this data source */
  cache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Fallback data when source is unavailable */
  fallback?: any;
  /** Enable strict mode validation */
  strict?: boolean;
}

/**
 * Interface for components that support data binding
 */
export interface WithDataBinding {
  /** Data source identifier for CMS-driven content (slug-based format) */
  dataSource?: string;
  /** Data binding configuration options */
  bindingOptions?: DataBindingOptions;
}

/**
 * Result type for data binding hook
 */
export interface DataBindingResult<T> {
  /** Resolved data merged with fallback props */
  data: T | undefined;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Data source used */
  dataSource?: string;
  /** Whether data came from cache */
  cached?: boolean;
}