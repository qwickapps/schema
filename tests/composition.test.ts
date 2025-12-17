/**
 * Schema Composition Tests - @qwickapps/schema
 *
 * Tests for schema composition methods: partial, pick, omit, extend
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import 'reflect-metadata';
import { Model } from '../src/models/Model';
import { Field, Schema, Editor, Email, Min, Max, Int } from '../src/decorators';
import { DataType, FieldType } from '../src/types/Schema';

describe('Schema Composition', () => {
  // Test model for composition tests
  @Schema('User', '1.0.0')
  class UserModel extends Model {
    @Field({ required: true })
    @Editor({ field_type: FieldType.TEXT, label: 'ID', description: 'User ID' })
    id!: string;

    @Field({ required: true })
    @Editor({ field_type: FieldType.EMAIL, label: 'Email', description: 'Email address' })
    @Email()
    email!: string;

    @Field({ required: true })
    @Editor({ field_type: FieldType.TEXT, label: 'Name', description: 'Full name' })
    name!: string;

    @Field({ required: false })
    @Editor({ field_type: FieldType.TEXTAREA, label: 'Bio', description: 'User biography' })
    bio?: string;

    @Field({ required: true })
    @Editor({ field_type: FieldType.NUMBER, label: 'Age', description: 'User age' })
    @Min(0)
    @Max(150)
    @Int()
    age!: number;

    @Field({ required: false, defaultValue: 'user' })
    @Editor({
      field_type: FieldType.SELECT,
      label: 'Role',
      description: 'User role',
      validation: { options: [{ label: 'User', value: 'user' }, { label: 'Admin', value: 'admin' }] }
    })
    role?: string;
  }

  beforeAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  describe('Model.partial()', () => {
    it('should create schema with all fields optional', () => {
      const partialSchema = UserModel.partial();

      expect(partialSchema.name).toBe('PartialUser');
      expect(partialSchema.fields).toHaveLength(6);

      // All fields should be optional
      for (const field of partialSchema.fields) {
        expect(field.required).toBe(false);
      }
    });

    it('should preserve editor metadata', () => {
      const partialSchema = UserModel.partial();
      const emailField = partialSchema.fields.find((f) => f.name === 'email');

      expect(emailField).toBeDefined();
      expect(emailField!.editor).toBeDefined();
      expect(emailField!.editor!.field_type).toBe(FieldType.EMAIL);
      expect(emailField!.editor!.label).toBe('Email');
    });

    it('should preserve default values', () => {
      const partialSchema = UserModel.partial();
      const roleField = partialSchema.fields.find((f) => f.name === 'role');

      expect(roleField).toBeDefined();
      expect(roleField!.defaultValue).toBe('user');
    });

    it('should work with validateAgainstSchema', () => {
      const partialSchema = UserModel.partial();

      // Empty object should be valid (all optional)
      const result = Model.validateAgainstSchema({}, partialSchema);
      expect(result.isValid).toBe(true);

      // Partial data should be valid
      const result2 = Model.validateAgainstSchema({ name: 'John' }, partialSchema);
      expect(result2.isValid).toBe(true);
    });
  });

  describe('Model.pick()', () => {
    it('should create schema with only selected fields', () => {
      const pickedSchema = UserModel.pick('name', 'email');

      expect(pickedSchema.name).toBe('PickUser');
      expect(pickedSchema.fields).toHaveLength(2);

      const fieldNames = pickedSchema.fields.map((f) => f.name);
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
      expect(fieldNames).not.toContain('id');
      expect(fieldNames).not.toContain('age');
    });

    it('should preserve field metadata for picked fields', () => {
      const pickedSchema = UserModel.pick('email', 'age');

      const emailField = pickedSchema.fields.find((f) => f.name === 'email');
      expect(emailField!.required).toBe(true);
      expect(emailField!.editor!.field_type).toBe(FieldType.EMAIL);

      const ageField = pickedSchema.fields.find((f) => f.name === 'age');
      expect(ageField!.required).toBe(true);
      expect(ageField!.editor!.field_type).toBe(FieldType.NUMBER);
    });

    it('should work with validateAgainstSchema', () => {
      const publicUserSchema = UserModel.pick('name', 'email');

      // Valid data
      const result = Model.validateAgainstSchema(
        { name: 'John', email: 'john@example.com' },
        publicUserSchema
      );
      expect(result.isValid).toBe(true);

      // Missing required field
      const result2 = Model.validateAgainstSchema({ name: 'John' }, publicUserSchema);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain("Field 'email' is required");
    });
  });

  describe('Model.omit()', () => {
    it('should create schema excluding specified fields', () => {
      const omittedSchema = UserModel.omit('id', 'role');

      expect(omittedSchema.name).toBe('OmitUser');
      expect(omittedSchema.fields).toHaveLength(4);

      const fieldNames = omittedSchema.fields.map((f) => f.name);
      expect(fieldNames).not.toContain('id');
      expect(fieldNames).not.toContain('role');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('bio');
      expect(fieldNames).toContain('age');
    });

    it('should preserve metadata for remaining fields', () => {
      const createUserSchema = UserModel.omit('id');

      const emailField = createUserSchema.fields.find((f) => f.name === 'email');
      expect(emailField).toBeDefined();
      expect(emailField!.required).toBe(true);

      const bioField = createUserSchema.fields.find((f) => f.name === 'bio');
      expect(bioField).toBeDefined();
      expect(bioField!.required).toBe(false);
    });

    it('should work with validateAgainstSchema', () => {
      const createUserSchema = UserModel.omit('id');

      // Valid data (no id required)
      const result = Model.validateAgainstSchema(
        { email: 'test@example.com', name: 'John', age: 25 },
        createUserSchema
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('Model.extend()', () => {
    it('should create schema with additional fields', () => {
      const extendedSchema = UserModel.extend({
        permissions: { type: DataType.ARRAY, required: true },
        department: { type: DataType.STRING, required: false }
      });

      expect(extendedSchema.name).toBe('ExtendedUser');
      expect(extendedSchema.fields).toHaveLength(8); // 6 original + 2 new

      const fieldNames = extendedSchema.fields.map((f) => f.name);
      expect(fieldNames).toContain('permissions');
      expect(fieldNames).toContain('department');
    });

    it('should set correct metadata for new fields', () => {
      const extendedSchema = UserModel.extend({
        permissions: { type: DataType.ARRAY, required: true },
        department: { type: DataType.STRING, required: false, defaultValue: 'Engineering' }
      });

      const permissionsField = extendedSchema.fields.find((f) => f.name === 'permissions');
      expect(permissionsField!.required).toBe(true);
      expect(permissionsField!.data_type).toBe(DataType.ARRAY);

      const departmentField = extendedSchema.fields.find((f) => f.name === 'department');
      expect(departmentField!.required).toBe(false);
      expect(departmentField!.defaultValue).toBe('Engineering');
    });

    it('should preserve original field metadata', () => {
      const extendedSchema = UserModel.extend({
        isAdmin: { type: DataType.BOOLEAN, required: false }
      });

      const emailField = extendedSchema.fields.find((f) => f.name === 'email');
      expect(emailField!.editor).toBeDefined();
      expect(emailField!.required).toBe(true);
    });

    it('should work with validateAgainstSchema', () => {
      const adminSchema = UserModel.extend({
        permissions: { type: DataType.ARRAY, required: true }
      });

      // Missing required extension field
      const result = Model.validateAgainstSchema(
        { id: '1', email: 'test@example.com', name: 'John', age: 25 },
        adminSchema
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'permissions' is required");
    });
  });

  describe('Composition Chaining Patterns', () => {
    it('should support pick then partial pattern', () => {
      // Pick some fields, then make them all optional
      const pickedSchema = UserModel.pick('name', 'email', 'bio');

      // Can't chain directly, but can apply partial-like logic manually
      const partialPickedFields = pickedSchema.fields.map((f) => ({
        ...f,
        required: false
      }));

      expect(partialPickedFields.every((f) => !f.required)).toBe(true);
    });

    it('should support omit then extend pattern', () => {
      const omittedSchema = UserModel.omit('id');
      const extendedSchema = UserModel.extend({
        temporaryId: { type: DataType.STRING, required: true }
      });

      // Both operations can be combined manually
      expect(omittedSchema.fields.find((f) => f.name === 'id')).toBeUndefined();
      expect(extendedSchema.fields.find((f) => f.name === 'temporaryId')).toBeDefined();
    });
  });

  describe('validateAgainstSchema', () => {
    it('should validate required fields', () => {
      const schema = UserModel.getSchema();

      const result = Model.validateAgainstSchema({}, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'id' is required");
      expect(result.errors).toContain("Field 'email' is required");
    });

    it('should validate editor constraints', () => {
      // Create a schema with editor validation
      @Schema('ConstrainedModel')
      class ConstrainedModel extends Model {
        @Field({ required: true })
        @Editor({
          field_type: FieldType.TEXT,
          label: 'Code',
          description: 'Code field',
          validation: { min: 3, max: 10 }
        })
        code!: string;
      }

      const schema = ConstrainedModel.getSchema();

      // Too short
      const result1 = Model.validateAgainstSchema({ code: 'AB' }, schema);
      expect(result1.isValid).toBe(false);
      expect(result1.errors.some((e) => e.includes('at least 3'))).toBe(true);

      // Too long
      const result2 = Model.validateAgainstSchema({ code: 'ABCDEFGHIJK' }, schema);
      expect(result2.isValid).toBe(false);
      expect(result2.errors.some((e) => e.includes('at most 10'))).toBe(true);

      // Just right
      const result3 = Model.validateAgainstSchema({ code: 'ABC123' }, schema);
      expect(result3.isValid).toBe(true);
    });

    it('should skip validation for optional undefined fields', () => {
      const partialSchema = UserModel.partial();

      const result = Model.validateAgainstSchema({ name: 'John' }, partialSchema);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Type inference with SchemaType', () => {
    it('should infer correct types from model', () => {
      // This is a compile-time check - if it compiles, the types work
      // TypeScript will error if SchemaType doesn't produce correct types

      // SchemaType<UserModel> should produce:
      // { id: string; email: string; name: string; bio?: string; age: number; role?: string }

      type UserData = import('../src/types/ModelProps').SchemaType<UserModel>;

      // Test that the type is usable
      const userData: UserData = {
        id: '123',
        email: 'test@example.com',
        name: 'John',
        age: 25
      };

      expect(userData.id).toBe('123');
      expect(userData.email).toBe('test@example.com');
    });
  });
});
