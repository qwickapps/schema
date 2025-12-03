/**
 * Pure cache provider interface - Single Responsibility: Caching only
 */

export interface ICacheProvider<T> {
  /** Get cached value by key */
  get(key: string): T | null;
  /** Set cached value with optional TTL */
  set(key: string, value: T, ttl?: number): void;
  /** Clear cache entry or all entries */
  clear(key?: string): void;
  /** Get cache statistics */
  getStats?(): { size: number; maxSize: number; keys: string[]; };
}
