/**
 * Base Model Class with Validation and Schema Extraction
 *
 * Provides static methods for validating data against decorator metadata
 * and retrieving schema metadata for UI, admin, or codegen.
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import 'reflect-metadata';
import { validate, ValidationError, getMetadataStorage } from 'class-validator';
import { SchemaDefinition, FieldDefinition, DataType } from '../types/Schema';
import {
  FieldMetadata,
  EditorConfig,
  SchemaMetadata,
  ValidatorMetadata,
  TransformMetadata,
  ClassValidatorMetadata,
  applyTransforms,
  runValidators,
  runClassValidators
} from '../decorators';

/**
 * Validation result from Model.validate()
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validationErrors?: ValidationError[];
}

/**
 * Field definition for schema composition
 */
export interface CompositionFieldDef {
  type: DataType | string;
  required?: boolean;
  defaultValue?: any;
}

/**
 * Abstract base class for all data models
 */
export class Model {
  /**
   * Validate data against model decorator metadata and class-validator rules
   *
   * Validation order:
   * 1. Apply transforms
   * 2. Check required fields
   * 3. Run @Editor.validation constraints
   * 4. Run our validators (@Email, @Min, etc.)
   * 5. Run class-validator decorators
   * 6. Run cross-field validators (@Validate)
   */
  static async validate<T extends Model>(
    this: new () => T,
    data: Partial<T>
  ): Promise<ValidationResult> {
    const fields = ((this as any)._fields as FieldMetadata[]) || [];
    const editors = ((this as any)._editors as EditorConfig[]) || [];
    const validators = ((this as any)._validators as ValidatorMetadata[]) || [];
    const transforms = ((this as any)._transforms as TransformMetadata[]) || [];
    const classValidators =
      ((this as any)._classValidators as ClassValidatorMetadata[]) || [];

    const errors: string[] = [];

    // 1. Apply transforms
    const transformedData = applyTransforms(data, transforms);

    // 2. Check required fields
    for (const field of fields) {
      if (field.required && (transformedData as any)[field.name] === undefined) {
        errors.push(`Field '${field.name}' is required`);
      }
    }

    // 3. Run @Editor.validation constraints
    for (const editor of editors) {
      const value = (transformedData as any)[editor.name];
      if (value !== undefined && value !== null && editor.validation) {
        const { min, max, pattern, custom } = editor.validation;

        // For strings: min/max are length constraints
        if (typeof value === 'string') {
          if (min !== undefined && value.length < min) {
            errors.push(`${editor.name} must be at least ${min} characters`);
          }
          if (max !== undefined && value.length > max) {
            errors.push(`${editor.name} must be at most ${max} characters`);
          }
        }

        // For numbers: min/max are value constraints
        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors.push(`${editor.name} must be at least ${min}`);
          }
          if (max !== undefined && value > max) {
            errors.push(`${editor.name} must be at most ${max}`);
          }
        }

        // Pattern validation
        if (pattern && typeof value === 'string' && !pattern.test(value)) {
          errors.push(`${editor.name} must match pattern ${pattern}`);
        }

        // Custom validation
        if (custom) {
          const customResult = custom(value);
          if (customResult !== true) {
            errors.push(
              typeof customResult === 'string'
                ? customResult
                : `${editor.name} failed custom validation`
            );
          }
        }
      }
    }

    // 4. Run our validators
    const validatorErrors = runValidators(transformedData, validators);
    errors.push(...validatorErrors);

    // 5. Run class-validator validation
    const instance = new this();
    Object.assign(instance, transformedData);

    let validationErrors: ValidationError[] = [];
    try {
      // Use forbidUnknownValues: false to allow models without class-validator decorators
      validationErrors = await validate(instance, { forbidUnknownValues: false });
    } catch (error) {
      errors.push('Validation failed: ' + (error as Error).message);
    }

    // Convert class-validator errors to string messages
    for (const error of validationErrors) {
      if (error.constraints) {
        errors.push(...Object.values(error.constraints));
      }
    }

    // 6. Run cross-field validators only if basic field validation passes
    // This prevents confusing errors like "passwords must match" when password is missing
    if (errors.length === 0 && classValidators.length > 0) {
      const classValidatorErrors = runClassValidators(transformedData, classValidators);
      errors.push(...classValidatorErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      validationErrors
    };
  }

  /**
   * Synchronous validation (without class-validator async rules)
   *
   * Runs all validations except async class-validator rules.
   */
  static validateSync<T extends Model>(
    this: new () => T,
    data: Partial<T>
  ): ValidationResult {
    const fields = ((this as any)._fields as FieldMetadata[]) || [];
    const editors = ((this as any)._editors as EditorConfig[]) || [];
    const validators = ((this as any)._validators as ValidatorMetadata[]) || [];
    const transforms = ((this as any)._transforms as TransformMetadata[]) || [];
    const classValidators =
      ((this as any)._classValidators as ClassValidatorMetadata[]) || [];

    const errors: string[] = [];

    // 1. Apply transforms
    const transformedData = applyTransforms(data, transforms);

    // 2. Check required fields
    for (const field of fields) {
      if (field.required && (transformedData as any)[field.name] === undefined) {
        errors.push(`Field '${field.name}' is required`);
      }
    }

    // 3. Run @Editor.validation constraints
    for (const editor of editors) {
      const value = (transformedData as any)[editor.name];
      if (value !== undefined && value !== null && editor.validation) {
        const { min, max, pattern, custom } = editor.validation;

        if (typeof value === 'string') {
          if (min !== undefined && value.length < min) {
            errors.push(`${editor.name} must be at least ${min} characters`);
          }
          if (max !== undefined && value.length > max) {
            errors.push(`${editor.name} must be at most ${max} characters`);
          }
        }

        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors.push(`${editor.name} must be at least ${min}`);
          }
          if (max !== undefined && value > max) {
            errors.push(`${editor.name} must be at most ${max}`);
          }
        }

        if (pattern && typeof value === 'string' && !pattern.test(value)) {
          errors.push(`${editor.name} must match pattern ${pattern}`);
        }

        if (custom) {
          const customResult = custom(value);
          if (customResult !== true) {
            errors.push(
              typeof customResult === 'string'
                ? customResult
                : `${editor.name} failed custom validation`
            );
          }
        }
      }
    }

    // 4. Run our validators
    const validatorErrors = runValidators(transformedData, validators);
    errors.push(...validatorErrors);

    // 5. Run cross-field validators only if basic field validation passes
    if (errors.length === 0 && classValidators.length > 0) {
      const classValidatorErrors = runClassValidators(transformedData, classValidators);
      errors.push(...classValidatorErrors);
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
    const fields = ((this as any)._fields as FieldMetadata[]) || [];
    const editors = ((this as any)._editors as EditorConfig[]) || [];
    const validators = ((this as any)._validators as ValidatorMetadata[]) || [];
    const schema = ((this as any)._schema as SchemaMetadata) || {
      name: this.name as string,
      version: '1.0.0'
    };

    // Get class-validator metadata
    const classValidatorMetadata = getMetadataStorage();

    const schemaFields: FieldDefinition[] = fields.map((field) => {
      const editor = editors.find((e) => e.name === field.name);
      const fieldValidators = validators.filter((v) => v.name === field.name);

      // Extract class-validator rules for this property
      const validations = classValidatorMetadata
        .getTargetValidationMetadatas(this, this.prototype, false, false)
        .filter((meta) => meta.propertyName === field.name);

      // Convert class-validator rules to a JSON-friendly format
      const classValidatorRules = validations.map((meta: any) => ({
        type: meta.type as string,
        constraints: meta.constraints
      }));

      // Convert our validators to JSON-friendly format
      const ourValidatorRules = fieldValidators.map((v) => ({
        type: v.type,
        constraint: v.constraint,
        message: v.message
      }));

      // Combine all validation rules
      const allValidationRules = [...ourValidatorRules, ...classValidatorRules];

      return {
        name: field.name,
        data_type: field.dataType!,
        required: field.required || false,
        defaultValue: field.defaultValue,
        type: field.type,
        editor: editor
          ? {
              field_type: editor.field_type,
              label: editor.label,
              description: editor.description,
              placeholder: editor.placeholder,
              help_text: editor.help_text,
              validation: editor.validation
            }
          : undefined,
        // Add all validation rules if any
        ...(allValidationRules.length > 0 && { validation: allValidationRules })
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
  static createWithDefaults<T extends Model>(
    this: new () => T,
    data: Partial<T> = {}
  ): T {
    const instance = new this();
    const fields = ((this as any)._fields as FieldMetadata[]) || [];

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

  // ===========================================================================
  // Schema Composition Methods
  // ===========================================================================

  /**
   * Create a partial schema where all fields are optional
   *
   * @example
   * ```typescript
   * const UpdateUserSchema = UserModel.partial();
   * // All fields from UserModel are now optional
   * ```
   */
  static partial<T extends typeof Model>(this: T): SchemaDefinition {
    const schema = this.getSchema();

    return {
      ...schema,
      name: `Partial${schema.name}`,
      fields: schema.fields.map((field: FieldDefinition) => ({
        ...field,
        required: false
      }))
    };
  }

  /**
   * Create a schema with only the specified fields
   *
   * @example
   * ```typescript
   * const PublicUserSchema = UserModel.pick('name', 'email', 'avatar');
   * // Only includes name, email, and avatar fields
   * ```
   */
  static pick<T extends typeof Model, K extends string>(
    this: T,
    ...keys: K[]
  ): SchemaDefinition {
    const schema = this.getSchema();
    const keySet = new Set(keys);

    return {
      ...schema,
      name: `Pick${schema.name}`,
      fields: schema.fields.filter((field: FieldDefinition) => keySet.has(field.name as K))
    };
  }

  /**
   * Create a schema excluding the specified fields
   *
   * @example
   * ```typescript
   * const CreateUserSchema = UserModel.omit('id', 'createdAt', 'updatedAt');
   * // Excludes id, createdAt, and updatedAt fields
   * ```
   */
  static omit<T extends typeof Model, K extends string>(
    this: T,
    ...keys: K[]
  ): SchemaDefinition {
    const schema = this.getSchema();
    const keySet = new Set(keys);

    return {
      ...schema,
      name: `Omit${schema.name}`,
      fields: schema.fields.filter((field: FieldDefinition) => !keySet.has(field.name as K))
    };
  }

  /**
   * Create a schema with additional fields
   *
   * @example
   * ```typescript
   * const AdminUserSchema = UserModel.extend({
   *   permissions: { type: DataType.ARRAY, required: true },
   *   department: { type: DataType.STRING, required: false }
   * });
   * // Includes all UserModel fields plus permissions and department
   * ```
   */
  static extend<T extends typeof Model>(
    this: T,
    extensions: Record<string, CompositionFieldDef>
  ): SchemaDefinition {
    const schema = this.getSchema();

    // Convert extension definitions to FieldDefinition format
    const newFields: FieldDefinition[] = Object.entries(extensions).map(
      ([name, def]) => ({
        name,
        data_type:
          typeof def.type === 'string' && Object.values(DataType).includes(def.type as DataType)
            ? (def.type as DataType)
            : DataType.OBJECT,
        required: def.required ?? false,
        defaultValue: def.defaultValue,
        type: typeof def.type === 'string' ? def.type : undefined
      })
    );

    return {
      ...schema,
      name: `Extended${schema.name}`,
      fields: [...schema.fields, ...newFields]
    };
  }

  /**
   * Validate data against a composed schema (partial, pick, omit, extend)
   *
   * Since composed schemas are SchemaDefinition objects (not classes),
   * this static method validates data against a schema definition.
   *
   * @example
   * ```typescript
   * const UpdateUserSchema = UserModel.partial();
   * const result = Model.validateAgainstSchema({ name: 'John' }, UpdateUserSchema);
   * ```
   */
  static validateAgainstSchema(
    data: Record<string, any>,
    schema: SchemaDefinition
  ): ValidationResult {
    const errors: string[] = [];

    for (const field of schema.fields) {
      const value = data[field.name];

      // Check required
      if (field.required && value === undefined) {
        errors.push(`Field '${field.name}' is required`);
        continue;
      }

      // Skip validation for undefined optional fields
      if (value === undefined) {
        continue;
      }

      // Check editor validation if present
      if (field.editor?.validation) {
        const { min, max, pattern } = field.editor.validation;

        if (typeof value === 'string') {
          if (min !== undefined && value.length < min) {
            errors.push(`${field.name} must be at least ${min} characters`);
          }
          if (max !== undefined && value.length > max) {
            errors.push(`${field.name} must be at most ${max} characters`);
          }
        }

        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors.push(`${field.name} must be at least ${min}`);
          }
          if (max !== undefined && value > max) {
            errors.push(`${field.name} must be at most ${max}`);
          }
        }

        if (pattern && typeof value === 'string' && !pattern.test(value)) {
          errors.push(`${field.name} must match pattern ${pattern}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
