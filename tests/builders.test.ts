/**
 * Schema Builder Tests
 */

import { 
  FieldBuilder,
  SchemaBuilder,
  createSchema, 
  Fields,
  DataType,
  FieldType
} from '../src';

describe('Schema Builders', () => {
  describe('FieldBuilder', () => {
    test('should create a simple string field', () => {
      const stringField = new FieldBuilder('title', DataType.STRING)
        .required()
        .build();

      expect(stringField).toEqual({
        name: 'title',
        data_type: DataType.STRING,
        required: true
      });
    });

    test('should create a field with editor config', () => {
      const emailField = new FieldBuilder('email', DataType.STRING)
        .required()
        .textEditor('Email', 'Enter your email address')
        .build();

      expect(emailField).toEqual({
        name: 'email',
        data_type: DataType.STRING,
        required: true,
        editor: {
          field_type: FieldType.TEXT,
          label: 'Email',
          description: 'Enter your email address'
        }
      });
    });

    test('should create a number field with validation', () => {
      const ageField = new FieldBuilder('age', DataType.NUMBER)
        .editor({
          field_type: FieldType.NUMBER,
          label: 'Age',
          description: 'Your age in years',
          validation: { min: 0, max: 120 }
        })
        .build();

      expect(ageField.data_type).toBe(DataType.NUMBER);
      expect(ageField.required).toBe(false);
      expect(ageField.editor?.validation).toEqual({ min: 0, max: 120 });
    });
  });

  describe('SchemaBuilder', () => {
    test('should create a simple schema', () => {
      const nameField = new FieldBuilder('name', DataType.STRING).required().build();
      const emailField = new FieldBuilder('email', DataType.STRING).build();
      
      const userSchema = createSchema('User', '1.0.0')
        .addField(nameField)
        .addField(emailField)
        .build();

      expect(userSchema.name).toBe('User');
      expect(userSchema.version).toBe('1.0.0');
      expect(userSchema.fields).toHaveLength(2);
      expect(userSchema.fields[0].name).toBe('name');
      expect(userSchema.fields[1].name).toBe('email');
    });

    test('should create schema with description', () => {
      const titleField = new FieldBuilder('title', DataType.STRING).required().build();
      
      const blogSchema = new SchemaBuilder('BlogPost', '2.0.0')
        .description('Blog post content schema')
        .addField(titleField)
        .build();

      expect(blogSchema.description).toBe('Blog post content schema');
    });
  });

  describe('Fields helper', () => {
    test('should create common field types', () => {
      const titleField = Fields.text('title', 'Title', true).build();
      const bioField = Fields.textarea('bio', 'Biography').build();
      const priceField = Fields.number('price', 'Price', true).build();
      const activeField = Fields.boolean('active', 'Active').build();

      expect(titleField.data_type).toBe(DataType.STRING);
      expect(titleField.required).toBe(true);
      expect(titleField.editor?.field_type).toBe(FieldType.TEXT);

      expect(bioField.data_type).toBe(DataType.STRING);
      expect(bioField.editor?.field_type).toBe(FieldType.TEXTAREA);

      expect(priceField.data_type).toBe(DataType.NUMBER);
      expect(priceField.required).toBe(true);

      expect(activeField.data_type).toBe(DataType.BOOLEAN);
    });
  });
});