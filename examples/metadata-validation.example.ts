/**
 * Metadata Validation Example
 *
 * This example demonstrates how to use metadata validation
 * with safemocker to ensure actions have proper metadata.
 *
 * **Framework Support:**
 * - **Jest**: Import from `@jsonbored/safemocker/jest`
 * - **Vitest**: Import from `@jsonbored/safemocker/vitest`
 *
 * Jest:
 * ```typescript
 * import { createMetadataValidatedActionClient } from '@jsonbored/safemocker/jest';
 * ```
 *
 * Vitest:
 * ```typescript
 * import { createMetadataValidatedActionClient } from '@jsonbored/safemocker/vitest';
 * ```
 *
 * All other code remains identical between Jest and Vitest.
 *
 * @example
 * ```bash
 * # Run this example
 * npx tsx examples/metadata-validation.example.ts
 * ```
 */

import { createMetadataValidatedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';
import type { InferSafeActionFnResult } from 'next-safe-action';

// Define metadata schema
const actionMetadataSchema = z.object({
  actionName: z.string().min(1, 'Action name is required'),
  category: z.enum(['user', 'content', 'admin', 'analytics']).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
});

// Create metadata-validated action client
const metadataValidatedAction = createMetadataValidatedActionClient(actionMetadataSchema);

// Example 1: Action with valid metadata
const createUser = metadataValidatedAction
  .inputSchema(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })
  )
  .metadata({
    actionName: 'createUser',
    category: 'user',
    version: '1.0.0',
  })
  .action(async ({ parsedInput }) => {
    return {
      id: `user-${Date.now()}`,
      name: parsedInput.name,
      email: parsedInput.email,
    };
  });

// Example 2: Action with minimal metadata (only required fields)
const updateUser = metadataValidatedAction
  .inputSchema(
    z.object({
      userId: z.string(),
      name: z.string().min(1).optional(),
    })
  )
  .metadata({
    actionName: 'updateUser',
    // category and version are optional
  })
  .action(async ({ parsedInput }) => {
    return {
      id: parsedInput.userId,
      updated: true,
    };
  });

// Example 3: Action with invalid metadata (will fail)
const invalidAction = metadataValidatedAction
  .inputSchema(z.object({ test: z.string() }))
  .metadata({
    actionName: '', // Invalid: empty string
    category: 'invalid' as any, // Invalid: not in enum
  })
  .action(async () => ({ success: true }));

// Example usage
async function main() {
  console.log('=== Metadata Validation Example ===\n');

  // Test 1: Valid metadata
  console.log('Test 1: Action with valid metadata');
  const result1 = await createUser({
    name: 'John Doe',
    email: 'john@example.com',
  });

  type CreateUserResult = InferSafeActionFnResult<typeof createUser>;
  const typedResult1: CreateUserResult = result1;

  if (typedResult1.data) {
    console.log('✅ User created successfully:', typedResult1.data);
  }

  // Test 2: Minimal metadata
  console.log('\nTest 2: Action with minimal metadata');
  const result2 = await updateUser({
    userId: 'user-123',
    name: 'Jane Doe',
  });

  type UpdateUserResult = InferSafeActionFnResult<typeof updateUser>;
  const typedResult2: UpdateUserResult = result2;

  if (typedResult2.data) {
    console.log('✅ User updated successfully:', typedResult2.data);
  }

  // Test 3: Invalid metadata
  console.log('\nTest 3: Action with invalid metadata');
  const result3 = await invalidAction({ test: 'value' });

  type InvalidActionResult = InferSafeActionFnResult<typeof invalidAction>;
  const typedResult3: InvalidActionResult = result3;

  if (typedResult3.serverError) {
    console.log('✅ Metadata validation error caught:', typedResult3.serverError);
  }

  console.log('\n=== Example Complete ===');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createUser, updateUser };

