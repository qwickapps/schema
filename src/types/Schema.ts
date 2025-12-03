/**
 * Schema Definition Types for QwickApps React Framework
 * 
 * Provides standardized schema definitions that can be used across
 * data binding, CMS admin UI, and data persistence layers.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

/**
 * Core data types representing actual data structure
 */
export enum DataType {
  STRING = 'string',
  INTEGER = 'integer', 
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array'
}

/**
 * UI input field types for editor suggestions
 * Based on existing ContentTypes.FieldType but focused on schema building
 */
export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  EMAIL = 'email',
  URL = 'url',
  IMAGE = 'image',
  FILE = 'file',
  DATE = 'date',
  DATE_TIME = 'datetime',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  COLOR = 'color',
  // Complex field types
  FORM = 'form',
  REPEATER = 'repeater',
  MODEL_REPEATER = 'model_repeater'
}

/**
 * Validation rules for field values
 */
export interface ValidationRules {
  /** Minimum length for strings or minimum value for numbers */
  min?: number;
  /** Maximum length for strings or maximum value for numbers */
  max?: number;
  /** Regular expression pattern */
  pattern?: RegExp;
  /** Custom validation function */
  custom?: (value: any) => boolean | string;
  /** Options for select fields */
  options?: Array<{ label: string; value: any }>;
}

/**
 * Editor configuration for UI generation
 */
export interface EditorConfig {
  /** UI field type to use */
  field_type: FieldType;
  /** Display label */
  label: string;
  /** Help description */
  description: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional help text */
  help_text?: string;
  /** Validation rules */
  validation?: ValidationRules;
}

/**
 * Field definition within a schema
 */
export interface FieldDefinition {
  /** Field name */
  name: string;
  
  /** Core data type */
  data_type: DataType;
  
  /** Whether field is required */
  required: boolean;
  
  /** Default value for the field when not provided */
  defaultValue?: any;
  
  /** For OBJECT and ARRAY types - defines the structure */
  type?: DataType | SchemaDefinition | string; // DataType.STRING or modelSchema or "modelName"
  
  /** Editor configuration for UI generation */
  editor?: EditorConfig;
}

/**
 * Schema of a a model within a schema, typically used for inline
 * definition of object and array fields. If this definition can
 * be reused, it should be extracted into a separate model
 * schema and use the `uses` property to reference it.
 */
export interface SchemaModel {
  /** Model name */
  name: string;
  /** Model fields */
  fields: FieldDefinition[];
}

/**
 * Schema definition for a domain model or view model.
 */
export interface SchemaDefinition {
  /** Model name */
  name: string;
  
  /** Schema version */
  version: string;
  
  /** Schema description (added for CMS compatibility) */
  description?: string;
  
  /** Dependencies on other schemas */
  uses?: string[];

  /** Inline model definitions */
  models?: {
    [modelName: string]: SchemaModel;
  };
  
  /** Main model fields */
  fields: FieldDefinition[];
}