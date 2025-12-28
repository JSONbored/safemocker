/**
 * Rate Limiting Example
 *
 * This example demonstrates how to use rate limiting middleware
 * with safemocker to test rate-limited actions.
 *
 * **Framework Support:**
 * - **Jest**: Import from `@jsonbored/safemocker/jest`
 * - **Vitest**: Import from `@jsonbored/safemocker/vitest`
 *
 * Jest:
 * ```typescript
 * import { createRateLimitedActionClient } from '@jsonbored/safemocker/jest';
 * ```
 *
 * Vitest:
 * ```typescript
 * import { createRateLimitedActionClient } from '@jsonbored/safemocker/vitest';
 * ```
 *
 * All other code remains identical between Jest and Vitest.
 *
 * @example
 * ```bash
 * # Run this example
 * npx tsx examples/rate-limiting.example.ts
 * ```
 */

import { createRateLimitedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';
import type { InferSafeActionFnResult } from 'next-safe-action';

// Define metadata schema for rate limiting
const actionMetadataSchema = z.object({
  actionName: z.string().min(1),
  category: z.enum(['search', 'api', 'content', 'user']).optional(),
});

// Create rate-limited action client
const rateLimitedAction = createRateLimitedActionClient(actionMetadataSchema);

// Example 1: Search action with rate limiting
const searchPosts = rateLimitedAction
  .inputSchema(
    z.object({
      query: z.string().min(1, 'Search query is required'),
      limit: z.number().int().min(1).max(100).optional(),
    })
  )
  .metadata({ actionName: 'searchPosts', category: 'search' })
  .action(async ({ parsedInput }) => {
    // In production, this would query a database
    return {
      results: [
        { id: '1', title: 'Post 1', content: 'Content 1' },
        { id: '2', title: 'Post 2', content: 'Content 2' },
      ],
      query: parsedInput.query,
      limit: parsedInput.limit ?? 10,
    };
  });

// Example 2: API action with rate limiting
const fetchData = rateLimitedAction
  .inputSchema(
    z.object({
      endpoint: z.string().url(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    })
  )
  .metadata({ actionName: 'fetchData', category: 'api' })
  .action(async ({ parsedInput }) => {
    // In production, this would make an API call
    return {
      data: { endpoint: parsedInput.endpoint, method: parsedInput.method },
      cached: false,
    };
  });

// Example usage
async function main() {
  console.log('=== Rate Limiting Example ===\n');

  // Test 1: Valid search
  console.log('Test 1: Search with valid input');
  const result1 = await searchPosts({
    query: 'typescript',
    limit: 20,
  });

  type SearchPostsResult = InferSafeActionFnResult<typeof searchPosts>;
  const typedResult1: SearchPostsResult = result1;

  if (typedResult1.data) {
    console.log('✅ Search successful:');
    console.log(`   - Results: ${typedResult1.data.results.length} items`);
    console.log(`   - Query: ${typedResult1.data.query}`);
  }

  // Test 2: Invalid metadata (should fail validation)
  console.log('\nTest 2: Action with invalid metadata');
  const invalidAction = rateLimitedAction
    .inputSchema(z.object({ test: z.string() }))
    .metadata({ actionName: '', category: 'invalid' as any }) // Invalid: empty actionName
    .action(async () => ({ success: true }));

  const result2 = await invalidAction({ test: 'value' });
  
  type InvalidActionResult = InferSafeActionFnResult<typeof invalidAction>;
  const typedResult2: InvalidActionResult = result2;

  if (typedResult2.serverError) {
    console.log('✅ Metadata validation error caught:', typedResult2.serverError);
  }

  // Test 3: API fetch
  console.log('\nTest 3: API fetch with rate limiting');
  const result3 = await fetchData({
    endpoint: 'https://api.example.com/data',
    method: 'GET',
  });

  type FetchDataResult = InferSafeActionFnResult<typeof fetchData>;
  const typedResult3: FetchDataResult = result3;

  if (typedResult3.data) {
    console.log('✅ API fetch successful:');
    console.log(`   - Endpoint: ${typedResult3.data.data.endpoint}`);
    console.log(`   - Method: ${typedResult3.data.data.method}`);
  }

  console.log('\n=== Example Complete ===');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { searchPosts, fetchData };

