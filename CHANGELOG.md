# Changelog

All notable changes to `@qwickapps/schema` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-12-16

### Added

- **Validation Decorators**: Pydantic-style validation decorators for field-level validation
  - String validators: `@Email`, `@Url`, `@Uuid`, `@Regex`, `@MinLength`, `@MaxLength`
  - Number validators: `@Min`, `@Max`, `@Int`, `@Positive`, `@Negative`
- **Transform Decorator**: `@Transform(fn)` for value transformation before validation
- **Cross-Field Validation**: `@Validate(fn, opts)` class decorator for cross-field validation rules
- **Schema Composition Methods**: Static methods on Model class for schema manipulation
  - `Model.partial()` - Create schema with all fields optional
  - `Model.pick(...keys)` - Create schema with only selected fields
  - `Model.omit(...keys)` - Create schema excluding specified fields
  - `Model.extend(fields)` - Create schema with additional fields
- **Type Inference**: `SchemaType<T>` utility type for extracting TypeScript types from decorated model classes
- **validateAgainstSchema**: Static method for validating data against composed schemas

### Changed

- `Model.validate()` now runs validation in defined order: transforms -> required -> @Editor.validation -> our validators -> class-validator -> cross-field
- `Model.validateSync()` extended to support new validators (except async class-validator rules)
- `Model.getSchema()` now includes validator metadata in schema output
- Improved email validation regex for RFC 5322 compliance
- URL validation now uses `URL` constructor instead of regex (prevents ReDoS)
- Cross-field validators only run when basic field validation passes

### Security

- Fixed potential ReDoS vulnerability in URL validation
- Added ReDoS detection warning for user-provided regex patterns in `@Regex` decorator
- Transform errors are now logged instead of silently swallowed

### Fixed

- `class-validator` no longer throws "unknown value" errors for models without class-validator decorators

## [1.3.3] - Previous Release

Initial release with decorator-based schema system, data providers, and caching.
