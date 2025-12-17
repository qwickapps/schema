/**
 * Validator Tests - @qwickapps/schema
 *
 * Tests for validation decorators including string validators,
 * number validators, transforms, and cross-field validation.
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import 'reflect-metadata';
import { Model } from '../src/models/Model';
import {
  Field,
  Schema,
  Email,
  Url,
  Uuid,
  Regex,
  MinLength,
  MaxLength,
  Min,
  Max,
  Int,
  Positive,
  Negative,
  Transform,
  Validate
} from '../src/decorators';

describe('Validation Decorators', () => {
  beforeAll(async () => {
    // Ensure reflect-metadata is initialized
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  // ===========================================================================
  // String Validators
  // ===========================================================================

  describe('String Validators', () => {
    describe('@Email', () => {
      @Schema('EmailTest')
      class EmailTestModel extends Model {
        @Field({ required: true })
        @Email()
        email!: string;
      }

      it('should pass for valid email', async () => {
        const result = await EmailTestModel.validate({ email: 'test@example.com' });
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should pass for email with subdomain', async () => {
        const result = await EmailTestModel.validate({ email: 'user@mail.example.com' });
        expect(result.isValid).toBe(true);
      });

      it('should pass for email with plus addressing', async () => {
        const result = await EmailTestModel.validate({ email: 'user+tag@example.com' });
        expect(result.isValid).toBe(true);
      });

      it('should fail for invalid email - no @', async () => {
        const result = await EmailTestModel.validate({ email: 'notanemail' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('email must be a valid email address');
      });

      it('should fail for invalid email - no domain', async () => {
        const result = await EmailTestModel.validate({ email: 'test@' });
        expect(result.isValid).toBe(false);
      });

      it('should skip validation for undefined (optional field)', async () => {
        @Schema('OptionalEmailTest')
        class OptionalEmailModel extends Model {
          @Field({ required: false })
          @Email()
          email?: string;
        }

        const result = await OptionalEmailModel.validate({});
        expect(result.isValid).toBe(true);
      });

      it('should use custom error message', async () => {
        @Schema('CustomEmailTest')
        class CustomEmailModel extends Model {
          @Field({ required: true })
          @Email({ message: 'Please provide a valid email address' })
          email!: string;
        }

        const result = await CustomEmailModel.validate({ email: 'invalid' });
        expect(result.errors).toContain('Please provide a valid email address');
      });
    });

    describe('@Url', () => {
      @Schema('UrlTest')
      class UrlTestModel extends Model {
        @Field({ required: true })
        @Url()
        website!: string;
      }

      it('should pass for valid HTTPS URL', async () => {
        const result = await UrlTestModel.validate({ website: 'https://example.com' });
        expect(result.isValid).toBe(true);
      });

      it('should pass for valid HTTP URL', async () => {
        const result = await UrlTestModel.validate({ website: 'http://example.com' });
        expect(result.isValid).toBe(true);
      });

      it('should pass for URL with path', async () => {
        const result = await UrlTestModel.validate({
          website: 'https://example.com/path/to/page'
        });
        expect(result.isValid).toBe(true);
      });

      it('should pass for URL with query string', async () => {
        const result = await UrlTestModel.validate({
          website: 'https://example.com?foo=bar&baz=qux'
        });
        expect(result.isValid).toBe(true);
      });

      it('should fail for invalid URL - no protocol', async () => {
        const result = await UrlTestModel.validate({ website: 'example.com' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('website must be a valid URL');
      });

      it('should fail for invalid URL - random text', async () => {
        const result = await UrlTestModel.validate({ website: 'not a url' });
        expect(result.isValid).toBe(false);
      });
    });

    describe('@Uuid', () => {
      @Schema('UuidTest')
      class UuidTestModel extends Model {
        @Field({ required: true })
        @Uuid()
        id!: string;
      }

      it('should pass for valid UUID v4', async () => {
        const result = await UuidTestModel.validate({
          id: '550e8400-e29b-41d4-a716-446655440000'
        });
        expect(result.isValid).toBe(true);
      });

      it('should pass for valid UUID v4 lowercase', async () => {
        const result = await UuidTestModel.validate({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        });
        expect(result.isValid).toBe(true);
      });

      it('should fail for invalid UUID', async () => {
        const result = await UuidTestModel.validate({ id: 'not-a-uuid' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('id must be a valid UUID');
      });

      it('should fail for UUID with wrong version', async () => {
        // UUID v1 format (version 1 instead of 4)
        const result = await UuidTestModel.validate({
          id: '550e8400-e29b-11d4-a716-446655440000'
        });
        expect(result.isValid).toBe(false);
      });
    });

    describe('@Regex', () => {
      @Schema('RegexTest')
      class RegexTestModel extends Model {
        @Field({ required: true })
        @Regex(/^[A-Z][a-z]+$/)
        name!: string;
      }

      it('should pass for matching pattern', async () => {
        const result = await RegexTestModel.validate({ name: 'John' });
        expect(result.isValid).toBe(true);
      });

      it('should fail for non-matching pattern', async () => {
        const result = await RegexTestModel.validate({ name: 'john' }); // lowercase
        expect(result.isValid).toBe(false);
      });

      it('should use custom error message', async () => {
        @Schema('CustomRegexTest')
        class CustomRegexModel extends Model {
          @Field({ required: true })
          @Regex(/^[A-Z]/, { message: 'Must start with uppercase letter' })
          code!: string;
        }

        const result = await CustomRegexModel.validate({ code: 'abc' });
        expect(result.errors).toContain('Must start with uppercase letter');
      });
    });

    describe('@MinLength', () => {
      @Schema('MinLengthTest')
      class MinLengthTestModel extends Model {
        @Field({ required: true })
        @MinLength(8)
        password!: string;
      }

      it('should pass for string at minimum length', async () => {
        const result = await MinLengthTestModel.validate({ password: '12345678' });
        expect(result.isValid).toBe(true);
      });

      it('should pass for string above minimum length', async () => {
        const result = await MinLengthTestModel.validate({ password: 'verylongpassword' });
        expect(result.isValid).toBe(true);
      });

      it('should fail for string below minimum length', async () => {
        const result = await MinLengthTestModel.validate({ password: 'short' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('password must be at least 8 characters');
      });

      it('should handle empty string', async () => {
        const result = await MinLengthTestModel.validate({ password: '' });
        expect(result.isValid).toBe(false);
      });
    });

    describe('@MaxLength', () => {
      @Schema('MaxLengthTest')
      class MaxLengthTestModel extends Model {
        @Field({ required: true })
        @MaxLength(10)
        username!: string;
      }

      it('should pass for string at maximum length', async () => {
        const result = await MaxLengthTestModel.validate({ username: '1234567890' });
        expect(result.isValid).toBe(true);
      });

      it('should pass for string below maximum length', async () => {
        const result = await MaxLengthTestModel.validate({ username: 'short' });
        expect(result.isValid).toBe(true);
      });

      it('should fail for string above maximum length', async () => {
        const result = await MaxLengthTestModel.validate({ username: 'verylongusername' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('username must be at most 10 characters');
      });
    });
  });

  // ===========================================================================
  // Number Validators
  // ===========================================================================

  describe('Number Validators', () => {
    describe('@Min', () => {
      @Schema('MinTest')
      class MinTestModel extends Model {
        @Field({ required: true })
        @Min(0)
        age!: number;
      }

      it('should pass for value at minimum', async () => {
        const result = await MinTestModel.validate({ age: 0 });
        expect(result.isValid).toBe(true);
      });

      it('should pass for value above minimum', async () => {
        const result = await MinTestModel.validate({ age: 25 });
        expect(result.isValid).toBe(true);
      });

      it('should fail for value below minimum', async () => {
        const result = await MinTestModel.validate({ age: -1 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('age must be at least 0');
      });
    });

    describe('@Max', () => {
      @Schema('MaxTest')
      class MaxTestModel extends Model {
        @Field({ required: true })
        @Max(100)
        percentage!: number;
      }

      it('should pass for value at maximum', async () => {
        const result = await MaxTestModel.validate({ percentage: 100 });
        expect(result.isValid).toBe(true);
      });

      it('should pass for value below maximum', async () => {
        const result = await MaxTestModel.validate({ percentage: 50 });
        expect(result.isValid).toBe(true);
      });

      it('should fail for value above maximum', async () => {
        const result = await MaxTestModel.validate({ percentage: 150 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('percentage must be at most 100');
      });
    });

    describe('@Int', () => {
      @Schema('IntTest')
      class IntTestModel extends Model {
        @Field({ required: true })
        @Int()
        count!: number;
      }

      it('should pass for integer', async () => {
        const result = await IntTestModel.validate({ count: 42 });
        expect(result.isValid).toBe(true);
      });

      it('should pass for zero', async () => {
        const result = await IntTestModel.validate({ count: 0 });
        expect(result.isValid).toBe(true);
      });

      it('should pass for negative integer', async () => {
        const result = await IntTestModel.validate({ count: -5 });
        expect(result.isValid).toBe(true);
      });

      it('should fail for float', async () => {
        const result = await IntTestModel.validate({ count: 3.14 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('count must be an integer');
      });
    });

    describe('@Positive', () => {
      @Schema('PositiveTest')
      class PositiveTestModel extends Model {
        @Field({ required: true })
        @Positive()
        quantity!: number;
      }

      it('should pass for positive number', async () => {
        const result = await PositiveTestModel.validate({ quantity: 5 });
        expect(result.isValid).toBe(true);
      });

      it('should fail for zero', async () => {
        const result = await PositiveTestModel.validate({ quantity: 0 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('quantity must be a positive number');
      });

      it('should fail for negative number', async () => {
        const result = await PositiveTestModel.validate({ quantity: -5 });
        expect(result.isValid).toBe(false);
      });
    });

    describe('@Negative', () => {
      @Schema('NegativeTest')
      class NegativeTestModel extends Model {
        @Field({ required: true })
        @Negative()
        debt!: number;
      }

      it('should pass for negative number', async () => {
        const result = await NegativeTestModel.validate({ debt: -100 });
        expect(result.isValid).toBe(true);
      });

      it('should fail for zero', async () => {
        const result = await NegativeTestModel.validate({ debt: 0 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('debt must be a negative number');
      });

      it('should fail for positive number', async () => {
        const result = await NegativeTestModel.validate({ debt: 100 });
        expect(result.isValid).toBe(false);
      });
    });

    describe('Combined number validators', () => {
      @Schema('CombinedNumberTest')
      class CombinedNumberModel extends Model {
        @Field({ required: true })
        @Min(0)
        @Max(150)
        @Int()
        age!: number;
      }

      it('should pass for valid integer in range', async () => {
        const result = await CombinedNumberModel.validate({ age: 25 });
        expect(result.isValid).toBe(true);
      });

      it('should fail for float in range', async () => {
        const result = await CombinedNumberModel.validate({ age: 25.5 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('age must be an integer');
      });

      it('should fail for integer below range', async () => {
        const result = await CombinedNumberModel.validate({ age: -1 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('age must be at least 0');
      });

      it('should fail for integer above range', async () => {
        const result = await CombinedNumberModel.validate({ age: 200 });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('age must be at most 150');
      });
    });
  });

  // ===========================================================================
  // Transform Decorator
  // ===========================================================================

  describe('@Transform', () => {
    describe('Basic transforms', () => {
      @Schema('TransformTest')
      class TransformTestModel extends Model {
        @Field({ required: true })
        @Transform((v) => v?.trim())
        @MinLength(5)
        name!: string;
      }

      it('should trim whitespace before validation', async () => {
        // "  John  " trimmed to "John" (4 chars) should fail MinLength(5)
        const result = await TransformTestModel.validate({ name: '  John  ' });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('name must be at least 5 characters');
      });

      it('should pass after trimming if long enough', async () => {
        // "  Johnny  " trimmed to "Johnny" (6 chars) should pass
        const result = await TransformTestModel.validate({ name: '  Johnny  ' });
        expect(result.isValid).toBe(true);
      });
    });

    describe('Chained transforms', () => {
      @Schema('ChainedTransformTest')
      class ChainedTransformModel extends Model {
        @Field({ required: true })
        @Transform((v) => v?.trim())
        @Transform((v) => v?.toLowerCase())
        @Email()
        email!: string;
      }

      it('should apply transforms in order', async () => {
        const result = await ChainedTransformModel.validate({
          email: '  TEST@EXAMPLE.COM  '
        });
        expect(result.isValid).toBe(true);
      });
    });

    describe('Transform with data context', () => {
      @Schema('ContextTransformTest')
      class ContextTransformModel extends Model {
        @Field({ required: true })
        prefix!: string;

        @Field({ required: true })
        @Transform((v, data) => `${data?.prefix || ''}-${v}`)
        code!: string;
      }

      it('should have access to full data object', async () => {
        const result = await ContextTransformModel.validate({
          prefix: 'ABC',
          code: '123'
        });
        expect(result.isValid).toBe(true);
      });
    });

    describe('Transform handles null/undefined', () => {
      @Schema('NullTransformTest')
      class NullTransformModel extends Model {
        @Field({ required: false })
        @Transform((v) => v?.toUpperCase())
        optional?: string;
      }

      it('should handle undefined gracefully', async () => {
        const result = await NullTransformModel.validate({});
        expect(result.isValid).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Cross-Field Validator
  // ===========================================================================

  describe('@Validate (Cross-Field)', () => {
    describe('Password confirmation', () => {
      @Schema('RegistrationTest')
      @Validate((data) => data.password === data.confirmPassword, {
        message: 'Passwords must match',
        fields: ['confirmPassword']
      })
      class RegistrationModel extends Model {
        @Field({ required: true })
        @MinLength(8)
        password!: string;

        @Field({ required: true })
        confirmPassword!: string;
      }

      it('should pass when passwords match', async () => {
        const result = await RegistrationModel.validate({
          password: 'securepassword',
          confirmPassword: 'securepassword'
        });
        expect(result.isValid).toBe(true);
      });

      it('should fail when passwords do not match', async () => {
        const result = await RegistrationModel.validate({
          password: 'securepassword',
          confirmPassword: 'differentpassword'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('Passwords must match'))).toBe(true);
      });
    });

    describe('Validator returning string', () => {
      @Schema('CustomMessageTest')
      @Validate((data) => {
        if (data.endDate <= data.startDate) {
          return 'End date must be after start date';
        }
        return true;
      })
      class DateRangeModel extends Model {
        @Field({ required: true })
        startDate!: string;

        @Field({ required: true })
        endDate!: string;
      }

      it('should use returned string as error message', async () => {
        const result = await DateRangeModel.validate({
          startDate: '2025-12-31',
          endDate: '2025-01-01'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('End date must be after start date');
      });
    });

    describe('Multiple class validators', () => {
      @Schema('MultiValidatorTest')
      @Validate((data) => data.min <= data.max, {
        message: 'min must be less than or equal to max'
      })
      @Validate((data) => data.min >= 0 && data.max >= 0, {
        message: 'Values must be non-negative'
      })
      class RangeModel extends Model {
        @Field({ required: true })
        min!: number;

        @Field({ required: true })
        max!: number;
      }

      it('should run all validators', async () => {
        // min > max AND negative values
        const result = await RangeModel.validate({ min: -10, max: -20 });
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      });

      it('should pass when all validators pass', async () => {
        const result = await RangeModel.validate({ min: 5, max: 10 });
        expect(result.isValid).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Sync Validation
  // ===========================================================================

  describe('Synchronous Validation (validateSync)', () => {
    @Schema('SyncTest')
    class SyncTestModel extends Model {
      @Field({ required: true })
      @Email()
      email!: string;

      @Field({ required: true })
      @Min(0)
      @Max(150)
      age!: number;
    }

    it('should validate synchronously', () => {
      const result = SyncTestModel.validateSync({
        email: 'test@example.com',
        age: 25
      });
      expect(result.isValid).toBe(true);
    });

    it('should catch validation errors synchronously', () => {
      const result = SyncTestModel.validateSync({
        email: 'invalid',
        age: 200
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should check required fields synchronously', () => {
      const result = SyncTestModel.validateSync({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'email' is required");
      expect(result.errors).toContain("Field 'age' is required");
    });
  });

  // ===========================================================================
  // Integration: Complex Model
  // ===========================================================================

  describe('Complex Model Integration', () => {
    @Schema('UserRegistration')
    @Validate((data) => data.password === data.confirmPassword, {
      message: 'Passwords must match',
      fields: ['confirmPassword']
    })
    class UserRegistrationModel extends Model {
      @Field({ required: true })
      @Transform((v) => v?.trim().toLowerCase())
      @Email()
      email!: string;

      @Field({ required: true })
      @MinLength(8)
      @Regex(/[A-Z]/, { message: 'Password must contain uppercase letter' })
      @Regex(/[0-9]/, { message: 'Password must contain a number' })
      password!: string;

      @Field({ required: true })
      confirmPassword!: string;

      @Field({ required: false })
      @Transform((v) => v?.trim())
      @Url()
      website?: string;

      @Field({ required: true })
      @Min(13)
      @Max(120)
      @Int()
      age!: number;
    }

    it('should pass for fully valid data', async () => {
      const result = await UserRegistrationModel.validate({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Secure123',
        confirmPassword: 'Secure123',
        website: 'https://example.com',
        age: 25
      });
      expect(result.isValid).toBe(true);
    });

    it('should transform email before validation', async () => {
      // Even with spaces and uppercase, should validate
      const result = await UserRegistrationModel.validate({
        email: '  VALID@EMAIL.COM  ',
        password: 'Secure123',
        confirmPassword: 'Secure123',
        age: 25
      });
      expect(result.isValid).toBe(true);
    });

    it('should collect multiple errors', async () => {
      const result = await UserRegistrationModel.validate({
        email: 'invalid',
        password: 'weak',
        confirmPassword: 'different',
        age: 10
      });
      expect(result.isValid).toBe(false);
      // Should have errors for: email, password length, password uppercase,
      // password number, password mismatch, age too young
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });
});
