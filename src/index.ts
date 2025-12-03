/**
 * @qwickapps/schema - Pure TypeScript schema system for data binding
 * 
 * Decorator-based schema system with runtime validation, type safety,
 * and single source of truth for data models, validation, and UI metadata.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

// Ensure reflect-metadata is imported for decorators
import 'reflect-metadata';

// Core decorators
export * from './decorators';

// Base Model class
export { Model } from './models/Model';
export type { ValidationResult } from './models/Model';

// Type utilities
export * from './types/ModelProps';

// Core types and interfaces
export * from './types';

// Schema builders for fluent API (legacy support)
export * from './builders';

// Data provider implementations
export * from './providers';

// Re-export commonly used types for convenience
export type {
  DataBindingMeta,
  DataBindingOptions, DataBindingProps, DataResponse, DataType, FieldDefinition, FieldType,
  IDataProvider,
  SchemaDefinition, WithDataBinding
} from './types';

// Decorator system types
export type {
  EditorConfig, FieldMetadata, SchemaMetadata
} from './decorators';

export type {
  SchemaProps, OptionalSchemaData, PartialSchemaData,
  RequiredSchemaData
} from './types';