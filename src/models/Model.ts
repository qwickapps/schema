/**
 * Base Model Class with Validation and Schema Extraction
 * 
 * Provides static methods for validating data against decorator metadata
 * and retrieving schema metadata for UI, admin, or codegen.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import 'reflect-metadata';
import { validate, ValidationError, getMetadataStorage, MetadataStorage } from 'class-validator';
import { SchemaDefinition, FieldDefinition } from '../types/Schema';
import { FieldMetadata, EditorConfig, SchemaMetadata } from '../decorators';

/**
 * Validation result from Model.validate()
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validationErrors?: ValidationError[];
}

/**
 * Abstract base class for all data models
 */
export class Model {
  /**
   * Validate data against model decorator metadata and class-validator rules
   */
  static async validate<T extends Model>(this: new () => T, data: Partial<T>): Promise<ValidationResult> {
    // Create instance and populate with data
    const instance = new this();
    Object.assign(instance, data);
    
    // Get field metadata for required field validation
    const fields = (this as any)._fields as FieldMetadata[] || [];
    const errors: string[] = [];
    
    // Check required fields
    for (const field of fields) {
      if (field.required && (data as any)[field.name] === undefined) {
        errors.push(`Field '${field.name}' is required`);
      }
    }
    
    // Run class-validator validation
    let validationErrors: ValidationError[] = [];
    try {
      validationErrors = await validate(instance);
    } catch (error) {
      errors.push('Validation failed: ' + (error as Error).message);
    }
    
    // Convert class-validator errors to string messages
    for (const error of validationErrors) {
      if (error.constraints) {
        errors.push(...Object.values(error.constraints));
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      validationErrors
    };
  }
  
  /**
   * Synchronous validation (without class-validator async rules)
   */
  static validateSync<T extends Model>(this: new () => T, data: Partial<T>): ValidationResult {
    const fields = (this as any)._fields as FieldMetadata[] || [];
    const errors: string[] = [];
    
    // Check required fields
    for (const field of fields) {
      if (field.required && (data as any)[field.name] === undefined) {
        errors.push(`Field '${field.name}' is required`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Extract schema metadata from decorators and class-validator rules
   */
  static getSchema<T extends Model>(this: new () => T): SchemaDefinition {
    const fields = (this as any)._fields as FieldMetadata[] || [];
    const editors = (this as any)._editors as EditorConfig[] || [];
    const schema = (this as any)._schema as SchemaMetadata || { name: this.name as string, version: '1.0.0' };
    
    // Get class-validator metadata
    const classValidatorMetadata = getMetadataStorage();
    
    const schemaFields: FieldDefinition[] = fields.map(field => {
      const editor = editors.find(e => e.name === field.name);
      
      // Extract class-validator rules for this property
      const validations = classValidatorMetadata
        .getTargetValidationMetadatas(this, this.prototype, false, false)
        .filter(meta => meta.propertyName === field.name);
      
      // Convert class-validator rules to a JSON-friendly format
      const validationRules = validations.map((meta: any) => ({
        type: meta.type as string,
        constraints: meta.constraints
      }));
      
      return {
        name: field.name,
        data_type: field.dataType!,
        required: field.required || false,
        defaultValue: field.defaultValue,
        type: field.type,
        editor: editor ? {
          field_type: editor.field_type,
          label: editor.label,
          description: editor.description,
          placeholder: editor.placeholder,
          help_text: editor.help_text,
          validation: editor.validation
        } : undefined,
        // Add class-validator validation rules if any
        ...(validationRules.length > 0 && { validation: validationRules })
      };
    });
    
    return {
      name: schema.name,
      version: schema.version || '1.0.0',
      description: schema.description,
      fields: schemaFields
    };
  }
  
  /**
   * Create an instance with default values applied
   */
  static createWithDefaults<T extends Model>(this: new () => T, data: Partial<T> = {}): T {
    const instance = new this();
    const fields = (this as any)._fields as FieldMetadata[] || [];
    
    // Apply default values first
    for (const field of fields) {
      if (field.defaultValue !== undefined && (data as any)[field.name] === undefined) {
        (instance as any)[field.name] = field.defaultValue;
      }
    }
    
    // Then apply provided data
    Object.assign(instance, data);
    
    return instance;
  }
}