/**
 * Model Tests - Decorator-based Schema System
 * 
 * Tests for the decorator-based model system with validation,
 * schema extraction, and type safety.
 * 
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import 'reflect-metadata';
import { HeroBlockModel } from '../examples/HeroBlockModel';
import { DataType, FieldType } from '../src/types/Schema';

describe('Decorator-based Model System', () => {
  beforeAll(async () => {
    // Ensure reflect-metadata is initialized
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe('HeroBlockModel', () => {
    it('should extract schema metadata correctly', () => {
      const schema = HeroBlockModel.getSchema();

      expect(schema.name).toBe('HeroBlock');
      expect(schema.version).toBe('1.0.0');
      expect(schema.fields).toHaveLength(4);

      // Test title field
      const titleField = schema.fields.find(f => f.name === 'title');
      expect(titleField).toBeDefined();
      expect(titleField!.required).toBe(true);
      expect(titleField!.data_type).toBe(DataType.STRING);
      expect(titleField!.editor!.field_type).toBe(FieldType.TEXT);
      expect(titleField!.editor!.label).toBe('Title');

      // Test subtitle field
      const subtitleField = schema.fields.find(f => f.name === 'subtitle');
      expect(subtitleField).toBeDefined();
      expect(subtitleField!.required).toBe(false);
      expect(subtitleField!.editor!.field_type).toBe(FieldType.TEXTAREA);

      // Test theme field with default value
      const themeField = schema.fields.find(f => f.name === 'theme');
      expect(themeField).toBeDefined();
      expect(themeField!.defaultValue).toBe('primary');
      expect(themeField!.editor!.field_type).toBe(FieldType.SELECT);
      expect(themeField!.editor!.validation!.options).toHaveLength(4);
    });

    it('should validate required fields', async () => {
      // Missing required title
      const result1 = await HeroBlockModel.validate({});
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain("Field 'title' is required");

      // With required title
      const result2 = await HeroBlockModel.validate({ title: 'Test Hero' });
      expect(result2.isValid).toBe(true);
      expect(result2.errors).toHaveLength(0);
    });

    it('should validate field constraints', async () => {
      // For now, this simplified model only checks required fields
      // Complex validation with class-validator will be added later
      const result = await HeroBlockModel.validate({ title: 'Valid Title' });
      expect(result.isValid).toBe(true);
    });

    it('should create instances with default values', () => {
      const instance = HeroBlockModel.createWithDefaults({ title: 'Test Hero' });
      expect(instance.title).toBe('Test Hero');
      expect(instance.theme).toBe('primary'); // default value applied
    });

    it('should validate synchronously for basic rules', () => {
      const result1 = HeroBlockModel.validateSync({});
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain("Field 'title' is required");

      const result2 = HeroBlockModel.validateSync({ title: 'Test Hero' });
      expect(result2.isValid).toBe(true);
    });
  });

  // Complex model tests with class-validator will be added later
  // describe('ArticleModel', () => { ... });
});