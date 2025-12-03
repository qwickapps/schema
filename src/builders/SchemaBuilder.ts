/**
 * Schema Builder - Fluent API for building type-safe schemas
 * 
 * Provides a fluent builder API for creating Schema definitions
 * with validation, type checking, and reusable patterns.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import {
  SchemaDefinition,
  FieldDefinition,
  DataType,
  FieldType,
  ValidationRules,
  EditorConfig
} from '../types/Schema';

/**
 * Fluent builder for creating FieldDefinition objects
 */
export class FieldBuilder {
  private field: Partial<FieldDefinition> = {};

  constructor(name: string, dataType: DataType) {
    this.field.name = name;
    this.field.data_type = dataType;
    this.field.required = false;
  }

  /**
   * Mark field as required
   */
  required(required = true): FieldBuilder {
    this.field.required = required;
    return this;
  }

  /**
   * Set default value for the field
   */
  defaultValue(value: any): FieldBuilder {
    this.field.defaultValue = value;
    return this;
  }

  /**
   * Set the field type (for nested objects/arrays)
   */
  type(type: DataType | SchemaDefinition | string): FieldBuilder {
    this.field.type = type;
    return this;
  }

  /**
   * Configure the editor settings
   */
  editor(config: Partial<EditorConfig>): FieldBuilder {
    this.field.editor = {
      field_type: FieldType.TEXT,
      label: this.field.name || '',
      description: '',
      ...config
    };
    return this;
  }

  /**
   * Quick editor setup for text fields
   */
  textEditor(label: string, description: string, placeholder?: string): FieldBuilder {
    return this.editor({
      field_type: FieldType.TEXT,
      label,
      description,
      placeholder
    });
  }

  /**
   * Quick editor setup for textarea fields
   */
  textareaEditor(label: string, description: string, placeholder?: string): FieldBuilder {
    return this.editor({
      field_type: FieldType.TEXTAREA,
      label,
      description,
      placeholder
    });
  }

  /**
   * Quick editor setup for select fields
   */
  selectEditor(label: string, description: string, options: Array<{ label: string; value: any }>): FieldBuilder {
    return this.editor({
      field_type: FieldType.SELECT,
      label,
      description,
      validation: { options }
    });
  }

  /**
   * Add validation rules
   */
  validation(rules: ValidationRules): FieldBuilder {
    if (!this.field.editor) {
      this.field.editor = {
        field_type: FieldType.TEXT,
        label: this.field.name || '',
        description: ''
      };
    }
    this.field.editor.validation = rules;
    return this;
  }

  /**
   * Build the final FieldDefinition
   */
  build(): FieldDefinition {
    if (!this.field.name || !this.field.data_type) {
      throw new Error('Field name and data_type are required');
    }
    
    return {
      name: this.field.name,
      data_type: this.field.data_type,
      required: this.field.required ?? false,
      defaultValue: this.field.defaultValue,
      type: this.field.type,
      editor: this.field.editor
    };
  }
}

/**
 * Fluent builder for creating Schema objects
 */
export class SchemaBuilder {
  private schema: Partial<SchemaDefinition> = {
    fields: []
  };

  constructor(name: string, version = '1.0.0') {
    this.schema.name = name;
    this.schema.version = version;
  }

  /**
   * Set schema description
   */
  description(description: string): SchemaBuilder {
    this.schema.description = description;
    return this;
  }

  /**
   * Add a field to the schema
   */
  field(name: string, dataType: DataType): FieldBuilder {
    const fieldBuilder = new FieldBuilder(name, dataType);
    
    // Return a wrapped field builder that adds to this schema
    const originalBuild = fieldBuilder.build.bind(fieldBuilder);
    fieldBuilder.build = () => {
      const field = originalBuild();
      this.schema.fields!.push(field);
      return field;
    };
    
    return fieldBuilder;
  }

  /**
   * Add a pre-built field
   */
  addField(field: FieldDefinition): SchemaBuilder {
    this.schema.fields!.push(field);
    return this;
  }

  /**
   * Add multiple fields at once
   */
  addFields(fields: FieldDefinition[]): SchemaBuilder {
    this.schema.fields!.push(...fields);
    return this;
  }

  /**
   * Add schema dependencies
   */
  uses(...schemaNames: string[]): SchemaBuilder {
    if (!this.schema.uses) {
      this.schema.uses = [];
    }
    this.schema.uses.push(...schemaNames);
    return this;
  }

  /**
   * Build the final Schema
   */
  build(): SchemaDefinition {
    if (!this.schema.name || !this.schema.version) {
      throw new Error('Schema name and version are required');
    }
    
    if (!this.schema.fields || this.schema.fields.length === 0) {
      throw new Error('Schema must have at least one field');
    }

    return {
      name: this.schema.name,
      version: this.schema.version,
      description: this.schema.description,
      uses: this.schema.uses,
      models: this.schema.models,
      fields: this.schema.fields
    };
  }
}

/**
 * Factory functions for common field types
 */
export const Fields = {
  /**
   * Create a text field
   */
  text(name: string, label: string, required = false): FieldBuilder {
    return new FieldBuilder(name, DataType.STRING)
      .required(required)
      .textEditor(label, `${label} text field`);
  },

  /**
   * Create a textarea field
   */
  textarea(name: string, label: string, required = false): FieldBuilder {
    return new FieldBuilder(name, DataType.STRING)
      .required(required)
      .textareaEditor(label, `${label} textarea field`);
  },

  /**
   * Create a number field
   */
  number(name: string, label: string, required = false): FieldBuilder {
    return new FieldBuilder(name, DataType.NUMBER)
      .required(required)
      .editor({
        field_type: FieldType.NUMBER,
        label,
        description: `${label} number field`
      });
  },

  /**
   * Create an integer field
   */
  integer(name: string, label: string, required = false): FieldBuilder {
    return new FieldBuilder(name, DataType.INTEGER)
      .required(required)
      .editor({
        field_type: FieldType.INTEGER,
        label,
        description: `${label} integer field`
      });
  },

  /**
   * Create a boolean field
   */
  boolean(name: string, label: string, required = false): FieldBuilder {
    return new FieldBuilder(name, DataType.BOOLEAN)
      .required(required)
      .editor({
        field_type: FieldType.BOOLEAN,
        label,
        description: `${label} boolean field`
      });
  },

  /**
   * Create a select field
   */
  select(name: string, label: string, options: Array<{ label: string; value: any }>, required = false): FieldBuilder {
    return new FieldBuilder(name, DataType.STRING)
      .required(required)
      .selectEditor(label, `Select ${label}`, options);
  },

  /**
   * Create an image field
   */
  image(name: string, label: string, required = false): FieldBuilder {
    return new FieldBuilder(name, DataType.STRING)
      .required(required)
      .editor({
        field_type: FieldType.IMAGE,
        label,
        description: `${label} image field`
      });
  },

  /**
   * Create an array field
   */
  array(name: string, label: string, itemType: DataType | SchemaDefinition | string, required = false): FieldBuilder {
    return new FieldBuilder(name, DataType.ARRAY)
      .required(required)
      .type(itemType)
      .editor({
        field_type: FieldType.REPEATER,
        label,
        description: `${label} array field`
      });
  }
};

/**
 * Create a new schema builder
 */
export function createSchema(name: string, version = '1.0.0'): SchemaBuilder {
  return new SchemaBuilder(name, version);
}