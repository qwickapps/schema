/**
 * Decorators for Schema Definition
 * 
 * Provides decorators for defining data models with metadata for
 * validation, UI generation, and schema extraction.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import 'reflect-metadata';
import { DataType, FieldType } from '../types/Schema';

/**
 * Field metadata stored by @Field decorator
 */
export interface FieldMetadata {
  name: string;
  dataType?: DataType;
  required?: boolean;
  defaultValue?: any;
  type?: DataType | string; // For nested objects/arrays
}

/**
 * Editor configuration for UI generation
 */
export interface EditorConfig {
  name: string;
  field_type: FieldType;
  label: string;
  description: string;
  placeholder?: string;
  help_text?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
    options?: Array<{ label: string; value: any }>;
  };
}

/**
 * Schema metadata stored by @Schema decorator
 */
export interface SchemaMetadata {
  name: string;
  version?: string;
  description?: string;
}

/**
 * @Field decorator - Defines data modeling metadata
 */
export function Field(options: Partial<FieldMetadata> = {}) {
  return function (target: any, propertyKey: string) {
    if (!target.constructor._fields) {
      target.constructor._fields = [];
    }
    
    // Infer data type from TypeScript metadata if not provided
    const designType = (Reflect as any).getMetadata('design:type', target, propertyKey);
    let dataType = options.dataType;
    
    if (!dataType && designType) {
      if (designType === String) dataType = DataType.STRING;
      else if (designType === Number) dataType = DataType.NUMBER;
      else if (designType === Boolean) dataType = DataType.BOOLEAN;
      else if (designType === Array) dataType = DataType.ARRAY;
      else if (designType === Object) dataType = DataType.OBJECT;
    }
    
    target.constructor._fields.push({
      name: propertyKey,
      dataType,
      required: options.required ?? false,
      defaultValue: options.defaultValue,
      type: options.type,
      ...options
    });
  };
}

/**
 * @Editor decorator - Defines UI/editor configuration
 */
export function Editor(config: Omit<EditorConfig, 'name'>) {
  return function (target: any, propertyKey: string) {
    if (!target.constructor._editors) {
      target.constructor._editors = [];
    }
    
    target.constructor._editors.push({
      name: propertyKey,
      ...config
    });
  };
}

/**
 * @Schema decorator - Defines schema-level metadata
 */
export function Schema(nameOrOptions: string | SchemaMetadata, version?: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    if (typeof nameOrOptions === 'string') {
      constructor.prototype.constructor._schema = {
        name: nameOrOptions,
        version: version || '1.0.0'
      };
    } else {
      constructor.prototype.constructor._schema = {
        version: '1.0.0',
        ...nameOrOptions
      };
    }
    return constructor;
  };
}

// Re-export validator types
export type {
  ValidatorType,
  ValidatorMetadata,
  ValidatorOptions,
  TransformMetadata,
  ClassValidatorMetadata
} from './validators';

// Re-export validator decorators and utilities
export {
  // String validators
  Email,
  Url,
  Uuid,
  Regex,
  MinLength,
  MaxLength,
  // Number validators
  Min,
  Max,
  Int,
  Positive,
  Negative,
  // Transform
  Transform,
  // Cross-field validator
  Validate,
  // Utilities
  validateValue,
  applyTransforms,
  runValidators,
  runClassValidators
} from './validators';