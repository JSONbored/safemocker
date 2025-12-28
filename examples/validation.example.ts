/**
 * Validation Example
 *
 * This example demonstrates input and output schema validation with safemocker.
 * It shows how validation errors are properly typed and accessible.
 *
 * **Framework Support:**
 * - **Jest**: Import from `@jsonbored/safemocker/jest`
 * - **Vitest**: Import from `@jsonbored/safemocker/vitest`
 *
 * Jest:
 * ```typescript
 * import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
 * ```
 *
 * Vitest:
 * ```typescript
 * import { createAuthedActionClient } from '@jsonbored/safemocker/vitest';
 * ```
 *
 * All other code remains identical between Jest and Vitest.
 *
 * @example
 * ```bash
 * # Run this example
 * npx tsx examples/validation.example.ts
 * ```
 */

import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';
import type { InferSafeActionFnResult } from 'next-safe-action';

const authedAction = createAuthedActionClient();

// Example 1: Input validation only
const updateProfile = authedAction
  .inputSchema(
    z.object({
      name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
      email: z.string().email('Invalid email address'),
      age: z.number().int().min(18, 'Must be 18 or older').max(120, 'Invalid age'),
    })
  )
  .action(async ({ parsedInput }) => {
    return {
      success: true,
      message: 'Profile updated',
    };
  });

// Example 2: Input and output validation
const createUser = authedAction
  .inputSchema(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })
  )
  .outputSchema(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      createdAt: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    // This return value will be validated against outputSchema
    return {
      id: `user-${Date.now()}`,
      name: parsedInput.name,
      email: parsedInput.email,
      createdAt: new Date().toISOString(),
    };
  });

// Example 3: Nested object validation
const updateSettings = authedAction
  .inputSchema(
    z.object({
      userId: z.string().uuid(),
      settings: z.object({
        theme: z.enum(['light', 'dark', 'auto']),
        notifications: z.boolean(),
        language: z.string().min(2).max(5),
      }),
    })
  )
  .action(async ({ parsedInput }) => {
    return {
      updated: true,
      settings: parsedInput.settings,
    };
  });

// Example usage
async function main() {
  console.log('=== Validation Example ===\n');

  // Test 1: Input validation errors
  console.log('Test 1: Invalid input (multiple validation errors)');
  const result1 = await updateProfile({
    name: '', // Invalid: empty
    email: 'not-an-email', // Invalid: not an email
    age: 15, // Invalid: too young
  });

  type UpdateProfileResult = InferSafeActionFnResult<typeof updateProfile>;
  const typedResult1: UpdateProfileResult = result1;

  if (typedResult1.fieldErrors) {
    console.log('✅ Validation errors (as expected):');
    Object.entries(typedResult1.fieldErrors).forEach(([field, errors]) => {
      console.log(`   - ${field}: ${errors.join(', ')}`);
    });
  }

  // Test 2: Valid input
  console.log('\nTest 2: Valid input');
  const result2 = await updateProfile({
    name: 'John Doe',
    email: 'john@example.com',
    age: 25,
  });

  const typedResult2: UpdateProfileResult = result2;
  if (typedResult2.data) {
    console.log('✅ Profile updated successfully:', typedResult2.data);
  }

  // Test 3: Output validation
  console.log('\nTest 3: Output validation');
  const result3 = await createUser({
    name: 'Jane Doe',
    email: 'jane@example.com',
  });

  type CreateUserResult = InferSafeActionFnResult<typeof createUser>;
  const typedResult3: CreateUserResult = result3;

  if (typedResult3.data) {
    console.log('✅ User created with validated output:');
    console.log(`   - ID: ${typedResult3.data.id}`);
    console.log(`   - Name: ${typedResult3.data.name}`);
    console.log(`   - Email: ${typedResult3.data.email}`);
  }

  // Test 4: Nested validation
  console.log('\nTest 4: Nested object validation');
  const result4 = await updateSettings({
    userId: '123e4567-e89b-12d3-a456-426614174000',
    settings: {
      theme: 'dark',
      notifications: true,
      language: 'en',
    },
  });

  type UpdateSettingsResult = InferSafeActionFnResult<typeof updateSettings>;
  const typedResult4: UpdateSettingsResult = result4;

  if (typedResult4.data) {
    console.log('✅ Settings updated:', typedResult4.data);
  }

  console.log('\n=== Example Complete ===');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { updateProfile, createUser, updateSettings };

