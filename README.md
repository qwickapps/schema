# @qwickapps/schema

Pure TypeScript schema system for data binding, CMS integration, and template resolution.

## Features

- **Decorator-Based Models**: Define data models using TypeScript decorators (Pydantic-style)
- **Validation Decorators**: `@Email`, `@Url`, `@Min`, `@Max`, `@MinLength`, `@MaxLength`, and more
- **Schema Composition**: `partial()`, `pick()`, `omit()`, `extend()` methods for schema manipulation
- **Type Inference**: `SchemaType<T>` for automatic TypeScript type extraction
- **Cross-Field Validation**: `@Validate` decorator for class-level validation rules
- **Transform Decorators**: `@Transform` for value transformation before validation
- **Data Providers**: Abstract interface for CMS and data source integration
- **Template Resolution**: Mustache template processing for dynamic content
- **Schema Builders**: Fluent API for building complex schemas

## Installation

```bash
npm install @qwickapps/schema
```

## Usage

### Decorator-Based Models (Recommended)

Define data models using TypeScript decorators for a Pydantic-like experience:

```typescript
import {
  Model, Schema, Field, Editor,
  Email, Url, Min, Max, MinLength, Int,
  Transform, Validate, SchemaType, FieldType
} from '@qwickapps/schema';

@Schema('User', '1.0.0')
@Validate(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords must match', fields: ['confirmPassword'] }
)
class UserModel extends Model {
  @Field({ required: true })
  @Editor({ field_type: FieldType.EMAIL, label: 'Email', description: 'User email' })
  @Transform((v) => v?.trim().toLowerCase())
  @Email()
  email!: string;

  @Field({ required: true })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @Field({ required: true })
  confirmPassword!: string;

  @Field({ required: false })
  @Url()
  website?: string;

  @Field({ required: true })
  @Min(0)
  @Max(150)
  @Int()
  age!: number;
}

// Type inference - extract TypeScript type from model
type UserData = SchemaType<UserModel>;
// { email: string; password: string; confirmPassword: string; website?: string; age: number }

// Validation
const result = await UserModel.validate({
  email: '  TEST@EXAMPLE.COM  ',  // Will be trimmed and lowercased
  password: 'securepass',
  confirmPassword: 'securepass',
  age: 25
});

if (result.isValid) {
  console.log('Valid!');
} else {
  console.log('Errors:', result.errors);
}

// Schema composition
const UpdateUserSchema = UserModel.partial();     // All fields optional
const PublicUserSchema = UserModel.pick('email', 'website');  // Only selected fields
const CreateUserSchema = UserModel.omit('confirmPassword');   // Exclude fields
const AdminUserSchema = UserModel.extend({        // Add new fields
  permissions: { type: 'array', required: true }
});
```

### Available Validators

**String Validators:**
- `@Email()` - Valid email address
- `@Url()` - Valid HTTP/HTTPS URL
- `@Uuid()` - Valid UUID v4
- `@Regex(pattern)` - Match regex pattern
- `@MinLength(n)` - Minimum string length
- `@MaxLength(n)` - Maximum string length

**Number Validators:**
- `@Min(n)` - Minimum value
- `@Max(n)` - Maximum value
- `@Int()` - Must be an integer
- `@Positive()` - Must be > 0
- `@Negative()` - Must be < 0

**Transform & Cross-Field:**
- `@Transform(fn)` - Transform value before validation
- `@Validate(fn, opts)` - Class-level cross-field validation

### Validation Order

Validation runs in this order:
1. Transforms applied
2. Required field checks
3. `@Editor.validation` constraints
4. Field validators (`@Email`, `@Min`, etc.)
5. `class-validator` decorators (if using)
6. Cross-field validators (`@Validate`)

### JSON Schema Definition (Alternative)

```typescript
import { Schema, DataType, FieldType } from '@qwickapps/schema';

const BlogPostSchema: Schema = {
  name: 'BlogPost',
  version: '1.0.0',
  fields: [
    {
      name: 'title',
      data_type: DataType.STRING,
      required: true,
      editor: {
        field_type: FieldType.TEXT,
        label: 'Title',
        description: 'Blog post title'
      }
    },
    {
      name: 'slug',
      data_type: DataType.STRING,
      required: true,
      editor: {
        field_type: FieldType.TEXT,
        label: 'Slug',
        description: 'URL slug for the post'
      }
    }
  ]
};
```

### Implement a Data Provider

```typescript
import { IDataProvider, SchemaData, SchemaModel } from '@qwickapps/schema';

class MyDataProvider implements IDataProvider {
  async get<T extends SchemaModel>(slug: string): Promise<DataResponse<SchemaData<T>>> {
    // Fetch data by slug
    const data = await fetchFromAPI(slug);
    return {
      data: {
        slug,
        modelName: 'BlogPost',
        data: data
      }
    };
  }
  
  async select<T extends SchemaModel>(schema: string, options?: SelectOptions): Promise<DataResponse<SchemaData<T>[]>> {
    // Fetch multiple items
    const items = await fetchMultipleFromAPI(schema, options);
    return { data: items };
  }
}
```

### Add Caching to Data Providers

The `CachedDataProvider` wraps any `IDataProvider` with transparent caching support:

```typescript
import { CachedDataProvider, JsonDataProvider, MemoryCacheProvider } from '@qwickapps/schema';

// Basic data provider
const baseProvider = new JsonDataProvider({
  company: { name: 'QwickApps', founded: 2025 },
  products: [
    { name: 'Product 1', price: 100 },
    { name: 'Product 2', price: 200 }
  ]
});

// Option 1: No caching
const noCacheProvider = new CachedDataProvider(baseProvider, false);

// Option 2: Default caching (MemoryCacheProvider with defaults)
const defaultCacheProvider = new CachedDataProvider(baseProvider, true);

// Option 3: Custom configuration (MemoryCacheProvider with config)
const configuredCacheProvider = new CachedDataProvider(baseProvider, {
  defaultTTL: 10 * 60 * 1000,  // 10 minutes
  maxSize: 500,                // Max 500 entries
  enableLogging: true          // Debug logging
});

// Option 4: Custom cache provider
const customCache = new MemoryCacheProvider({ 
  maxSize: 100, 
  defaultTtl: 5000 
});
const customCacheProvider = new CachedDataProvider(baseProvider, customCache);

// Usage
const response = await defaultCacheProvider.get('company');
console.log(response.cached); // false on first call, true on subsequent calls

// Cache management
defaultCacheProvider.clearCache();                    // Clear all cache
defaultCacheProvider.clearCache('get:company');       // Clear specific key
defaultCacheProvider.clearCache('select:products:*'); // Clear pattern

// Manual cache control
defaultCacheProvider.setCacheEntryManually('custom-key', data, 60000); // 1 minute TTL

// Cache statistics
const stats = defaultCacheProvider.getCacheStats();
console.log(stats.totalEntries, stats.cachingEnabled);
```

## API Reference

- **Schema**: Define data structure and validation rules
- **IDataProvider**: Interface for data source implementations
- **SchemaData**: Runtime data instances with slug-based lookups
- **TemplateResolver**: Process mustache templates
- **SchemaBuilder**: Fluent API for building schemas

## License

This software is licensed under the **PolyForm Shield License 1.0.0**.

### 📋 **Quick Summary**
- ✅ **Free to use** for non-competitive purposes
- ✅ **Source code available** for learning and development  
- ❌ **Cannot be used** to compete with QwickApps
- ❌ **Cannot be reverse engineered** for competitive purposes

### ✅ **Permitted Uses**
- Internal business applications
- Learning and educational projects
- Non-competitive commercial applications
- Academic research and teaching
- Contributing to this project

### ❌ **Prohibited Uses**
- Creating competing React frameworks or schema systems
- Building competing CMS or application builder tools
- Reselling or redistributing as a competing product
- Reverse engineering to create competitive products

For complete license terms, see [LICENSE](./LICENSE) and [LICENSE-POLYFORM-SHIELD.txt](./LICENSE-POLYFORM-SHIELD.txt).

**Need commercial licensing?** Contact us at **legal@qwickapps.com**