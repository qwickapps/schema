# Clean Environment Validation Test

This directory contains tests that validate `@qwickapps/schema` can be installed and used correctly in a completely clean environment.

## Purpose

Before publishing to npm, we need to ensure:

1. **All exports work** - Decorators, Model class, types, builders are properly exported
2. **TypeScript types resolve** - No missing type definitions
3. **Decorators function** - reflect-metadata integration works
4. **Runtime validation** - Model validation works correctly
5. **No hidden dependencies** - Package doesn't rely on monorepo internals

## Running the Validation

```bash
# From the package root
npm run validate:clean-install

# Or directly
./qa/clean-install/validate.sh
```

## What It Does

1. **Builds the package** - Creates npm tarball
2. **Runs Docker container** - Fresh Node.js environment
3. **Creates TypeScript project** - Standard TS setup with decorators
4. **Installs package** - From local tarball (like npm would)
5. **Compiles TypeScript** - Verifies types resolve
6. **Runs the code** - Verifies runtime functionality

If any step fails, the validation fails and publishing should be blocked.

## Test Application

The `test-app.ts` file tests major functionality:

- `Model` class with validation
- `@Schema` and `@Field` decorators
- `SchemaBuilder` for programmatic schemas
- Type definitions for `DataBindingOptions`, `IDataProvider`, etc.

## Requirements

- Docker must be installed and running
- Package must be buildable (`npm run build` must pass)

## Troubleshooting

### "Cannot find module '@qwickapps/schema'"
The package wasn't installed correctly. Check the npm pack output.

### "Experimental support for decorators"
tsconfig.json needs `experimentalDecorators` and `emitDecoratorMetadata` enabled.

### "reflect-metadata" errors
The package should import reflect-metadata automatically. Check the index.ts exports.
