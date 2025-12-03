/**
 * JSON-based Data Provider Implementation
 * 
 * Provides data from JSON objects/arrays with caching support.
 * Useful for development, testing, and static content scenarios.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import { Model } from '../models';
import { DataResponse, IDataProvider, SelectOptions } from '../types';

/**
 * JSON-based data provider for development and testing
 */
export class JsonDataProvider implements IDataProvider {
  private data: Record<string, any>;

  /**
   * Constructor
   * @param data - Initial data object
   * @param resolve_mustache - Whether to resolve mustache templates in data (default: true)
   */
  constructor(data: Record<string, any> = {}, resolve_mustache: boolean = true, max_passes: number = 1) {
    data = this.convertDottedNotation(data.data || data);
    if (resolve_mustache) {
      // Resolve mustache templates in all data
      const { MustacheTemplateProvider } = require('./MustacheTemplateProvider');
      const mustacheProvider = new MustacheTemplateProvider(max_passes);
      for (const key of Object.keys(data)) {
        const item = data[key];
        if (typeof item === 'string') {
          data[key] = mustacheProvider.resolve(item, data);
        } else if (typeof item === 'object') {
          const itemStr = JSON.stringify(item);
          const resolvedStr = mustacheProvider.resolve(itemStr, data);
          data[key] = JSON.parse(resolvedStr);
        }
      }
    }

    this.data = data;
  }

  /**
   * Get single data item by slug
   */
  async get<T extends Model>(slug: string): Promise<DataResponse<T>> {
    // Navigate slug path in data object
    const value = this.getValueByPath(slug);

    if (value === undefined) {
      return { data: undefined };
    }

    // If value is an array, return the first item for get() operation
    const instance: T = Array.isArray(value) ? <T>value[0] : <T>value;

    return {
      data: instance,
      cached: false,
      meta: {
        schema: this.inferModelName(slug),
        version: '1.0.0',
        slug
      }
    };
  }

  /**
   * Select multiple data items with query options
   */
  async select<T extends Model>(
    schema: string,
    options: SelectOptions = {}
  ): Promise<DataResponse<T[]>> {
    const cacheKey = `select:${schema}:${JSON.stringify(options)}`;

    // Find all items matching the schema
    const items = this.findItemsBySchema(schema);

    // Apply query options
    let filteredItems = items;

    // Apply filters
    if (options.filters) {
      filteredItems = this.applyFilters(filteredItems, options.filters);
    }

    // Apply sorting
    if (options.sort && options.sort !== 'none' && options.orderBy) {
      filteredItems = this.applySorting(filteredItems, options.orderBy, options.sort);
    }

    // Apply pagination
    const total = filteredItems.length;
    const offset = options.offset || 0;
    const limit = options.limit || total;
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    const instances: T[] = paginatedItems.map((item) => (<T>item));

    return {
      data: instances,
      cached: false,
      meta: {
        schema,
        version: '1.0.0',
        total,
        offset,
        limit: Math.min(limit, instances.length)
      }
    };
  }

  /**
   * Update the data source
   */
  updateData(newData: Record<string, any>): void {
    this.data = this.convertDottedNotation(newData);
  }

  /**
   * Convert dotted notation keys to nested object structure
   * e.g., { 'company.tagline': {...} } becomes { company: { tagline: {...} } }
   */
  private convertDottedNotation(data: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (key.includes('.')) {
        // Split the key by dots and create nested structure
        const parts = key.split('.');
        let current = result;
        
        // Navigate/create the nested structure
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        // Set the final value
        const finalKey = parts[parts.length - 1];
        current[finalKey] = value;
      } else {
        // No dots, set directly but check if value has nested objects with dots
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = this.convertDottedNotation(value);
        } else {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Get value by dot-notation path (e.g., "products.1.name")
   */
  private getValueByPath(path: string): any {
    const parts = path.replace(/^\//, '').split(/[/.]/);
    let current = this.data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array indices
      if (Array.isArray(current) && !isNaN(Number(part))) {
        current = current[Number(part)];
      } else if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, any>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Find all items that match a schema name
   */
  private findItemsBySchema(schema: string): any[] {
    const items: any[] = [];

    // Check if there's a direct array for this schema
    if (this.data[schema] && Array.isArray(this.data[schema])) {
      items.push(...this.data[schema]);
    }

    // Search through all data for items with matching modelName/schema
    this.searchObjectForSchema(this.data, schema, items);

    return items;
  }

  /**
   * Recursively search object for items matching schema
   */
  private searchObjectForSchema(obj: any, schema: string, results: any[]): void {
    if (typeof obj !== 'object' || obj === null) return;

    if (Array.isArray(obj)) {
      obj.forEach(item => this.searchObjectForSchema(item, schema, results));
    } else {
      // Check if this object matches the schema
      if (obj.modelName === schema || obj.schema === schema) {
        results.push(obj);
      }

      // Recurse into nested objects
      Object.values(obj).forEach(value => {
        this.searchObjectForSchema(value, schema, results);
      });
    }
  }

  /**
   * Apply filters to items
   */
  private applyFilters(items: any[], filters: Record<string, any>): any[] {
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        const itemValue = this.getValueByPath.call({ data: item }, key);
        return itemValue === value;
      });
    });
  }

  /**
   * Apply sorting to items
   */
  private applySorting(items: any[], orderBy: string, sort: 'asc' | 'desc'): any[] {
    return [...items].sort((a, b) => {
      const aValue = this.getValueByPath.call({ data: a }, orderBy);
      const bValue = this.getValueByPath.call({ data: b }, orderBy);

      if (aValue < bValue) return sort === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Infer model name from slug path
   */
  private inferModelName(slug: string): string {
    const parts = slug.replace(/^\//, '').split('/');
    return parts[0] || 'unknown';
  }

  /**
   * Generate slug for item
   */
  private generateSlug(schema: string, index: number): string {
    return `/${schema.toLowerCase()}/${index}`;
  }
}