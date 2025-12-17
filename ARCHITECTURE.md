# QwickApps Schema Model Architecture

## Overview

This document describes the architecture for data modeling, validation, and metadata in the QwickApps schema system. The approach leverages a base `Model` class with TypeScript decorators to provide:

- **Runtime validation** using decorator metadata
- **Compile-time type safety** via mapped types
- **Single-source-of-truth** for data models, validation, and UI metadata
- **Rich metadata** for CMS/admin UI and code generation

## Design Pattern

### 1. Base Model Class

All data models extend an abstract `Model` base class, which provides static methods for:

- Validating data against decorator metadata
- Retrieving schema metadata for UI, admin, or codegen

```typescript
abstract class Model {
  static validate<T extends Model>(this: new () => T, data: Partial<T>): ValidationResult { /* ... */ }
  static getSchema<T extends Model>(this: new () => T): Schema { /* ... */ }
  // ...
}
```

### 2. Decorators for Field Metadata

The `@Field` decorator collects metadata for each property, including:

- Required/optional status
- Default value
- Editor configuration (for UI)
- Validation rules (min/max, pattern, etc.)

This metadata is stored on the class constructor for use by validation and schema methods.

```typescript
function Field(options: FieldOptions = {}) {
  return function (target: any, propertyKey: string) {
    // Collect and store metadata on the class
  };
}
```

### 3. Type Inference for Props

The `SchemaProps<T>` utility type extracts only the public instance data properties from a model class, excluding methods and statics. This enables type-safe React props and data binding:

```typescript
type SchemaProps<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};
```

### 4. Example: Model, Validation, and Component Integration

```typescript
@Schema("HeroBlock")
class HeroBlockModel extends Model {
  @Field({ required: true, validation: { min: 1, max: 100 }, editor: { field_type: FieldType.TEXT, label: "Title" } })
  title: string;

  @Field({ validation: { max: 500 }, editor: { field_type: FieldType.TEXTAREA, label: "Subtitle" } })
  subtitle?: string;

  @Field({ editor: { field_type: FieldType.IMAGE, label: "Background Image" } })
  backgroundImage?: string;
}

type HeroBlockProps = SchemaProps<HeroBlockModel> & {
  dataSource?: string;
  className?: string;
  onTitleClick?: () => void;
};

function HeroBlock({ dataSource, className, onTitleClick, ...fallbackProps }: HeroBlockProps) {
  const data = useModelDataBinding(HeroBlockModel, dataSource, fallbackProps);
  return (
    <div className={className}>
      <h1 onClick={onTitleClick}>{data.title}</h1>
      <h2>{data.subtitle}</h2>
      {data.backgroundImage && <img src={data.backgroundImage} alt="" />}
    </div>
  );
}
```

### 5. Runtime Validation Example

```typescript
const heroData = { subtitle: "Welcome!" }; // Missing required title
const validation = HeroBlockModel.validate(heroData);
if (!validation.isValid) {
  console.log("Validation errors:", validation.errors);
  // ["Field 'title' is required"]
}
```

### 6. Benefits

- **Runtime Validation:** Built into the Model base class
- **Type Safety:** Full compile-time checking with SchemaProps
- **Single Source:** One class definition for everything
- **Metadata Access:** Rich decorator metadata for CMS/admin
- **Clean Architecture:** No build tools or code generation needed

## Implementation Notes

- Decorators require `experimentalDecorators` and `emitDecoratorMetadata` enabled in `tsconfig.json`.
- All metadata is stored on the class constructor for static access.
- Validation logic can be extended for custom rules, async validation, etc.
- This pattern is framework-agnostic and works with React, Node, or any TypeScript runtime.
