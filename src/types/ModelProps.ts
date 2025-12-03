/**
 * Schema → Type derivation utilities
 *
 * Primary types
 * - SchemaProps<T>: Partial of the schema-derived shape, ideal for React component props.
 *                   Accepts a schema class (typeof) or an instance type.
 * - SchemaData<T>:  Full schema-derived data shape (non-partial), ideal for
 *                   serialization, data providers, and internal models.
 *
 * Convenience helpers
 * - PartialSchemaData<T>: Partial of SchemaData<T> (e.g., patches).
 * - RequiredSchemaData<T>: Subset of SchemaData<T> containing only required (non-undefined) keys.
 * - OptionalSchemaData<T>: Subset of SchemaData<T> containing only optional (possibly undefined) keys.
 *
 * Advanced helpers
 * - NonFunctionPropertyNames<T>: Keys of T that are not functions.
 * - NonFunctionProperties<T>:   T stripped of function members.
 *
 * Examples
 * - Component props (React):
 *     type CodeProps = ViewProps & SchemaProps<typeof CodeSchema>;
 *     // JSX: <Code language="json" title="Sample" />
 *
 * - Serialization/data providers:
 *     function savePost(data: SchemaData<typeof PostSchema>) { ... }
 *
 * - Required/optional splits:
 *     type PostRequired = RequiredSchemaData<typeof PostSchema>;
 *     type PostOptional = OptionalSchemaData<typeof PostSchema>;
 *
 * Notes
 * - Passing a constructor (typeof MySchema) or an instance type both work.
 * - Function members (methods) on schema classes are automatically excluded.
 *
 * Copyright (c) 2025 QwickApps.com
 */

/**
 * Keys of T whose values are not functions.
 *
 * Usage:
 *   class Foo { a?: string; b: number = 0; m() {} }
 *   type K = NonFunctionPropertyNames<Foo>; // 'a' | 'b'
 */
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]-?: T[K] extends Function ? never : K
}[keyof T];

/**
 * T with function members removed.
 *
 * Usage:
 *   class Foo { a?: string; b: number = 0; m() {} }
 *   type Plain = NonFunctionProperties<Foo>; // { a?: string; b: number }
 */
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

/**
 * Resolve to instance type if a constructor is passed; otherwise T.
 *
 * Usage:
 *   class PostSchema { title!: string; slug?: string; }
 *   type I = InstanceTypeOf<typeof PostSchema>; // PostSchema
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type InstanceTypeOf<T> = T extends abstract new (...args: any[]) => infer I ? I : T;

/**
 * Canonical schema-derived shape (instance, non-functions only).
 *
 * Accepts either:
 *   - a schema class constructor: SchemaShape<typeof MySchema>
 *   - an instance type:          SchemaShape<MySchema>
 */
export type SchemaShape<T> = NonFunctionProperties<InstanceTypeOf<T>>;

/**
 * React-friendly props derived from a schema (Partial).
 *
 * When to use:
 *   - Component prop typing (callers should not be forced to pass every field).
 *
 * Example:
 *   import CodeSchema from '../schemas/CodeSchema';
 *   type CodeProps = ViewProps & SchemaProps<typeof CodeSchema>;
 *   // <Code language="ts" title="Snippet" />
 */
export type SchemaProps<T> = Partial<SchemaShape<T>>;

/**
 * Full data shape derived from a schema (non-Partial).
 *
 * When to use:
 *   - Serialization/deserialization payloads.
 *   - Data provider inputs/outputs.
 *
 * Example:
 *   function serialize(data: SchemaData<typeof PostSchema>) { ... }
 */
export type SchemaData<T> = SchemaShape<T>;

/**
 * Partial of SchemaData (e.g., patch/update operations).
 *
 * Example:
 *   type PostPatch = PartialSchemaData<typeof PostSchema>;
 *   function update(id: string, patch: PostPatch) { ... }
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type PartialSchemaData<T> = Partial<SchemaData<T>>;

/**
 * Convenience: pick all required (non-undefined) properties from SchemaData.
 *
 * When to use:
 *   - Contracts that must include all required fields and exclude optional ones.
 *
 * Example:
 *   type PostRequired = RequiredSchemaData<typeof PostSchema>; // title, etc. (no optional keys)
 */
export type RequiredSchemaData<T> = {
  [K in keyof SchemaData<T> as undefined extends SchemaData<T>[K] ? never : K]: SchemaData<T>[K];
};

/**
 * Convenience: pick all optional (possibly undefined) properties from SchemaData.
 *
 * When to use:
 *   - Contracts that accept only the optional portion of the data.
 *
 * Example:
 *   type PostOptional = OptionalSchemaData<typeof PostSchema>; // slug?, subtitle?, etc.
 */
export type OptionalSchemaData<T> = {
  [K in keyof SchemaData<T> as undefined extends SchemaData<T>[K] ? K : never]: SchemaData<T>[K];
};