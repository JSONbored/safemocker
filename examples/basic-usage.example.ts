/**
 * Basic Usage Example
 *
 * This example demonstrates the most basic usage of safemocker:
 * creating a simple action with input validation and testing it.
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
 * npx tsx examples/basic-usage.example.ts
 * ```
 */

import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';
import type { InferSafeActionFnResult } from 'next-safe-action';

// Create an authenticated action client
const authedAction = createAuthedActionClient({
  auth: {
    testUserId: 'example-user-id',
    testUserEmail: 'user@example.com',
  },
});

// Define a simple action that creates a user profile
const createUserProfile = authedAction
  .inputSchema(
    z.object({
      name: z.string().min(1, 'Name is required'),
      bio: z.string().min(10, 'Bio must be at least 10 characters'),
    })
  )
  .metadata({ actionName: 'createUserProfile', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    // In a real application, this would save to a database
    // Here we just return the data with the user ID from context
    return {
      id: `profile-${Date.now()}`,
      name: parsedInput.name,
      bio: parsedInput.bio,
      userId: ctx.userId,
      createdAt: new Date().toISOString(),
    };
  });

// Example usage
async function main() {
  console.log('=== Basic Usage Example ===\n');

  // Test 1: Successful action
  console.log('Test 1: Creating user profile with valid input');
  const result1 = await createUserProfile({
    name: 'John Doe',
    bio: 'This is a valid bio with enough characters.',
  });

  // Use InferSafeActionFnResult for 100% type safety
  type CreateUserProfileResult = InferSafeActionFnResult<typeof createUserProfile>;
  const typedResult1: CreateUserProfileResult = result1;

  if (typedResult1.data) {
    console.log('✅ Success! Profile created:', typedResult1.data);
    console.log(`   - ID: ${typedResult1.data.id}`);
    console.log(`   - Name: ${typedResult1.data.name}`);
    console.log(`   - User ID: ${typedResult1.data.userId}`);
  }

  // Test 2: Validation errors
  console.log('\nTest 2: Creating user profile with invalid input');
  const result2 = await createUserProfile({
    name: '', // Invalid: empty string
    bio: 'short', // Invalid: too short
  });

  type CreateUserProfileResult2 = InferSafeActionFnResult<typeof createUserProfile>;
  const typedResult2: CreateUserProfileResult2 = result2;

  if (typedResult2.fieldErrors) {
    console.log('✅ Validation errors caught (as expected):');
    console.log('   - Name errors:', typedResult2.fieldErrors.name);
    console.log('   - Bio errors:', typedResult2.fieldErrors.bio);
  }

  console.log('\n=== Example Complete ===');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createUserProfile };

