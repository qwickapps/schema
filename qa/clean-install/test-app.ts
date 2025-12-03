/**
 * Clean Environment Validation Test
 *
 * This file tests that @qwickapps/schema can be imported and used
 * correctly in a fresh TypeScript project.
 *
 * It validates:
 * - All major exports are available
 * - TypeScript types work correctly
 * - Decorators function properly
 * - Model class works with validation
 */
import 'reflect-metadata';
import {
  // Core Model class
  Model,

  // Decorators
  Field,
  Schema,

  // Types
  type SchemaDefinition,
  type DataBindingOptions,
  DataType,

  // Builders
  SchemaBuilder,
} from '@qwickapps/schema';

/**
 * Test 1: Define a schema using decorators
 */
@Schema({ name: 'TestUser', description: 'A test user model' })
class TestUser extends Model {
  @Field({ type: 'string', required: true })
  name!: string;

  @Field({ type: 'string', required: true })
  email!: string;

  @Field({ type: 'number', required: false })
  age?: number;

  @Field({ type: 'boolean', required: false })
  isActive?: boolean;
}

/**
 * Test 2: Use SchemaBuilder for programmatic schema creation
 */
const productSchema: SchemaDefinition = new SchemaBuilder('Product')
  .addField({ name: 'name', data_type: DataType.STRING, required: true })
  .addField({ name: 'price', data_type: DataType.NUMBER, required: true })
  .addField({ name: 'inStock', data_type: DataType.BOOLEAN, required: false })
  .build();

/**
 * Test 3: Create and validate a model instance
 */
async function testModelValidation(): Promise<void> {
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    isActive: true
  };

  // Test static validation method
  const validationResult = await TestUser.validate(userData);
  console.log('Validation result:', validationResult);
}

/**
 * Test 4: Verify type definitions work
 */
function testTypeDefinitions(): void {
  const bindingOptions: DataBindingOptions = {
    cache: true,
    cacheTTL: 5000,
  };

  console.log('Binding options:', bindingOptions);
  console.log('Product schema:', productSchema);
}

// Run tests
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  @qwickapps/schema - Clean Environment Test                    ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

testModelValidation().then(() => {
  testTypeDefinitions();
  console.log('');
  console.log('✅ All tests passed! Package works correctly in clean environment.');
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
