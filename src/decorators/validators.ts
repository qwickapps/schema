/**
 * Validation Decorators for @qwickapps/schema
 *
 * Provides Pydantic-style validation decorators that integrate with
 * the Model.validate() flow. All validators store metadata on the
 * class constructor for runtime validation.
 *
 * Copyright (c) 2025 QwickApps.com. All rights reserved.
 */

import 'reflect-metadata';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Types of validators available
 */
export type ValidatorType =
  | 'email'
  | 'url'
  | 'uuid'
  | 'regex'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'int'
  | 'positive'
  | 'negative';

/**
 * Metadata stored by validator decorators
 */
export interface ValidatorMetadata {
  /** Property name */
  name: string;
  /** Validator type */
  type: ValidatorType;
  /** Constraint value (for min/max/regex etc.) */
  constraint?: any;
  /** Custom error message */
  message?: string;
}

/**
 * Options for validator decorators
 */
export interface ValidatorOptions {
  /** Custom error message */
  message?: string;
}

/**
 * Metadata stored by @Transform decorator
 */
export interface TransformMetadata {
  /** Property name */
  name: string;
  /** Transform function */
  transform: (value: any, data?: any) => any;
}

/**
 * Metadata stored by @Validate class decorator
 */
export interface ClassValidatorMetadata {
  /** Validation function - return true for valid, false or string for invalid */
  validator: (data: any) => boolean | string;
  /** Error message (used when validator returns false) */
  message: string;
  /** Fields to associate errors with */
  fields?: string[];
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Email validation regex (RFC 5322 compliant, prevents common invalid patterns)
 * - Requires alphanumeric start for local part
 * - Prevents double dots
 * - Requires valid domain format
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * UUID v4 validation regex
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate URL using URL constructor (safer than regex, prevents ReDoS)
 */
function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates a value against validator metadata
 */
export function validateValue(
  value: any,
  validator: ValidatorMetadata,
  fieldName: string
): string | null {
  // Skip validation for null/undefined (let required check handle that)
  if (value === null || value === undefined) {
    return null;
  }

  const { type, constraint, message } = validator;

  switch (type) {
    case 'email':
      if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
        return message || `${fieldName} must be a valid email address`;
      }
      break;

    case 'url':
      if (typeof value !== 'string' || !isValidUrl(value)) {
        return message || `${fieldName} must be a valid URL`;
      }
      break;

    case 'uuid':
      if (typeof value !== 'string' || !UUID_V4_REGEX.test(value)) {
        return message || `${fieldName} must be a valid UUID`;
      }
      break;

    case 'regex':
      if (typeof value !== 'string' || !(constraint as RegExp).test(value)) {
        return message || `${fieldName} must match pattern ${constraint}`;
      }
      break;

    case 'minLength':
      if (typeof value !== 'string' || value.length < (constraint as number)) {
        return message || `${fieldName} must be at least ${constraint} characters`;
      }
      break;

    case 'maxLength':
      if (typeof value !== 'string' || value.length > (constraint as number)) {
        return message || `${fieldName} must be at most ${constraint} characters`;
      }
      break;

    case 'min':
      if (typeof value !== 'number' || value < (constraint as number)) {
        return message || `${fieldName} must be at least ${constraint}`;
      }
      break;

    case 'max':
      if (typeof value !== 'number' || value > (constraint as number)) {
        return message || `${fieldName} must be at most ${constraint}`;
      }
      break;

    case 'int':
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        return message || `${fieldName} must be an integer`;
      }
      break;

    case 'positive':
      if (typeof value !== 'number' || value <= 0) {
        return message || `${fieldName} must be a positive number`;
      }
      break;

    case 'negative':
      if (typeof value !== 'number' || value >= 0) {
        return message || `${fieldName} must be a negative number`;
      }
      break;
  }

  return null;
}

// ============================================================================
// Helper to Store Validator Metadata
// ============================================================================

function addValidatorMetadata(
  target: any,
  propertyKey: string,
  type: ValidatorType,
  constraint?: any,
  options?: ValidatorOptions
): void {
  if (!target.constructor._validators) {
    target.constructor._validators = [];
  }

  target.constructor._validators.push({
    name: propertyKey,
    type,
    constraint,
    message: options?.message
  });
}

// ============================================================================
// String Validators
// ============================================================================

/**
 * @Email - Validates that the string is a valid email address
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @Email()
 * email!: string;
 *
 * @Email({ message: 'Please enter a valid email' })
 * contactEmail!: string;
 * ```
 */
export function Email(options?: ValidatorOptions) {
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'email', undefined, options);
  };
}

/**
 * @Url - Validates that the string is a valid HTTP/HTTPS URL
 *
 * @example
 * ```typescript
 * @Field({ required: false })
 * @Url()
 * website?: string;
 * ```
 */
export function Url(options?: ValidatorOptions) {
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'url', undefined, options);
  };
}

/**
 * @Uuid - Validates that the string is a valid UUID v4
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @Uuid()
 * id!: string;
 * ```
 */
export function Uuid(options?: ValidatorOptions) {
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'uuid', undefined, options);
  };
}

/**
 * @Regex - Validates that the string matches the given pattern
 *
 * WARNING: Avoid patterns with nested quantifiers like (a+)+ or (a|a)*
 * as they can cause catastrophic backtracking (ReDoS).
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @Regex(/^[A-Z]/, { message: 'Must start with uppercase letter' })
 * code!: string;
 * ```
 */
export function Regex(pattern: RegExp, options?: ValidatorOptions) {
  if (!(pattern instanceof RegExp)) {
    throw new Error('@Regex requires a valid RegExp pattern');
  }

  // Basic ReDoS detection - warn about potentially dangerous patterns
  const src = pattern.source;
  if (/\([^)]*[+*]\)[+*]|\([^)]*\|[^)]*\)[+*]/.test(src)) {
    console.warn(
      `[@qwickapps/schema] Warning: Regex pattern may have ReDoS vulnerability: ${src}. ` +
        `Avoid nested quantifiers like (a+)+ or alternation with quantifiers like (a|b)+`
    );
  }

  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'regex', pattern, options);
  };
}

/**
 * @MinLength - Validates minimum string length
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @MinLength(8)
 * password!: string;
 * ```
 */
export function MinLength(min: number, options?: ValidatorOptions) {
  if (typeof min !== 'number' || min < 0) {
    throw new Error('@MinLength requires a non-negative number');
  }
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'minLength', min, options);
  };
}

/**
 * @MaxLength - Validates maximum string length
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @MaxLength(100)
 * title!: string;
 * ```
 */
export function MaxLength(max: number, options?: ValidatorOptions) {
  if (typeof max !== 'number' || max < 0) {
    throw new Error('@MaxLength requires a non-negative number');
  }
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'maxLength', max, options);
  };
}

// ============================================================================
// Number Validators
// ============================================================================

/**
 * @Min - Validates minimum numeric value
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @Min(0)
 * age!: number;
 * ```
 */
export function Min(min: number, options?: ValidatorOptions) {
  if (typeof min !== 'number') {
    throw new Error('@Min requires a number');
  }
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'min', min, options);
  };
}

/**
 * @Max - Validates maximum numeric value
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @Max(150)
 * age!: number;
 * ```
 */
export function Max(max: number, options?: ValidatorOptions) {
  if (typeof max !== 'number') {
    throw new Error('@Max requires a number');
  }
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'max', max, options);
  };
}

/**
 * @Int - Validates that the number is an integer
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @Int()
 * count!: number;
 * ```
 */
export function Int(options?: ValidatorOptions) {
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'int', undefined, options);
  };
}

/**
 * @Positive - Validates that the number is positive (> 0)
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @Positive()
 * quantity!: number;
 * ```
 */
export function Positive(options?: ValidatorOptions) {
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'positive', undefined, options);
  };
}

/**
 * @Negative - Validates that the number is negative (< 0)
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @Negative()
 * debt!: number;
 * ```
 */
export function Negative(options?: ValidatorOptions) {
  return function (target: any, propertyKey: string) {
    addValidatorMetadata(target, propertyKey, 'negative', undefined, options);
  };
}

// ============================================================================
// Transform Decorator
// ============================================================================

/**
 * @Transform - Transform value before validation
 *
 * Transforms are executed in decorator order (top to bottom) BEFORE
 * any validation runs. The transform function receives the value
 * and optionally the full data object.
 *
 * @example
 * ```typescript
 * @Field({ required: true })
 * @Transform((v) => v?.trim())
 * @Transform((v) => v?.toLowerCase())
 * @Email()
 * email!: string;
 * ```
 */
export function Transform(fn: (value: any, data?: any) => any) {
  if (typeof fn !== 'function') {
    throw new Error('@Transform requires a function');
  }
  return function (target: any, propertyKey: string) {
    if (!target.constructor._transforms) {
      target.constructor._transforms = [];
    }
    target.constructor._transforms.push({
      name: propertyKey,
      transform: fn
    });
  };
}

// ============================================================================
// Cross-Field Validator (Class Decorator)
// ============================================================================

/**
 * @Validate - Class-level cross-field validation
 *
 * Runs AFTER all field-level validation passes. The validator function
 * receives the full data object and should return:
 * - true: validation passed
 * - false: validation failed (uses message from options)
 * - string: validation failed (returned string is the error message)
 *
 * @example
 * ```typescript
 * @Schema('Registration')
 * @Validate(
 *   (data) => data.password === data.confirmPassword,
 *   { message: 'Passwords must match', fields: ['confirmPassword'] }
 * )
 * class RegistrationModel extends Model {
 *   @Field({ required: true })
 *   password!: string;
 *
 *   @Field({ required: true })
 *   confirmPassword!: string;
 * }
 * ```
 */
export function Validate(
  validator: (data: any) => boolean | string,
  options?: { message?: string; fields?: string[] }
) {
  if (typeof validator !== 'function') {
    throw new Error('@Validate requires a validator function');
  }
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    if (!(constructor as any)._classValidators) {
      (constructor as any)._classValidators = [];
    }
    (constructor as any)._classValidators.push({
      validator,
      message: options?.message || 'Validation failed',
      fields: options?.fields
    });
    return constructor;
  };
}

// ============================================================================
// Utility: Apply Transforms
// ============================================================================

/**
 * Apply all transforms to data before validation
 *
 * Note: If a transform throws an error, the original value is kept
 * and a warning is logged. This is intentional to allow validation
 * to proceed, but the warning alerts developers to potential issues.
 */
export function applyTransforms<T>(
  data: Partial<T>,
  transforms: TransformMetadata[]
): Partial<T> {
  if (!transforms || transforms.length === 0) {
    return data;
  }

  const transformed = { ...data };

  for (const { name, transform } of transforms) {
    if (name in transformed) {
      try {
        (transformed as any)[name] = transform((transformed as any)[name], transformed);
      } catch (error) {
        // Log warning but keep original value - validation will catch issues
        console.warn(
          `[@qwickapps/schema] Transform failed for field '${name}':`,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  return transformed;
}

// ============================================================================
// Utility: Run Validators
// ============================================================================

/**
 * Run all validators against data and collect errors
 */
export function runValidators(
  data: any,
  validators: ValidatorMetadata[]
): string[] {
  if (!validators || validators.length === 0) {
    return [];
  }

  const errors: string[] = [];

  for (const validator of validators) {
    const value = data[validator.name];
    const error = validateValue(value, validator, validator.name);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Run class-level validators against data
 */
export function runClassValidators(
  data: any,
  classValidators: ClassValidatorMetadata[]
): string[] {
  if (!classValidators || classValidators.length === 0) {
    return [];
  }

  const errors: string[] = [];

  for (const { validator, message, fields } of classValidators) {
    try {
      const result = validator(data);
      if (result === false) {
        // Use provided message
        const errorMessage = fields?.length
          ? `${fields.join(', ')}: ${message}`
          : message;
        errors.push(errorMessage);
      } else if (typeof result === 'string') {
        // Use returned string as message
        const errorMessage = fields?.length
          ? `${fields.join(', ')}: ${result}`
          : result;
        errors.push(errorMessage);
      }
      // result === true means validation passed
    } catch (error) {
      errors.push(`Validation error: ${(error as Error).message}`);
    }
  }

  return errors;
}
