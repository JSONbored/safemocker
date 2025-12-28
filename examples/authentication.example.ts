/**
 * Authentication Example
 *
 * This example demonstrates how to use safemocker's authentication middleware
 * to test actions that require user authentication.
 *
 * **Framework Support:**
 * - **Jest**: Import from `@jsonbored/safemocker/jest`
 * - **Vitest**: Import from `@jsonbored/safemocker/vitest`
 *
 * Jest:
 * ```typescript
 * import {
 *   createAuthedActionClient,
 *   createOptionalAuthActionClient,
 * } from '@jsonbored/safemocker/jest';
 * ```
 *
 * Vitest:
 * ```typescript
 * import {
 *   createAuthedActionClient,
 *   createOptionalAuthActionClient,
 * } from '@jsonbored/safemocker/vitest';
 * ```
 *
 * All other code remains identical between Jest and Vitest.
 *
 * @example
 * ```bash
 * # Run this example
 * npx tsx examples/authentication.example.ts
 * ```
 */

import {
  createAuthedActionClient,
  createOptionalAuthActionClient,
} from '@jsonbored/safemocker/jest';
import { z } from 'zod';
import type { InferSafeActionFnResult } from 'next-safe-action';

// Example 1: Required Authentication
const authedAction = createAuthedActionClient({
  auth: {
    testUserId: 'authenticated-user-id',
    testUserEmail: 'authenticated@example.com',
    testAuthToken: 'test-auth-token',
  },
});

const createPost = authedAction
  .inputSchema(
    z.object({
      title: z.string().min(1),
      content: z.string().min(10),
    })
  )
  .metadata({ actionName: 'createPost', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // ctx.userId, ctx.userEmail, and ctx.authToken are automatically available
    return {
      id: `post-${Date.now()}`,
      title: parsedInput.title,
      content: parsedInput.content,
      authorId: ctx.userId,
      authorEmail: ctx.userEmail,
      createdAt: new Date().toISOString(),
    };
  });

// Example 2: Optional Authentication
const optionalAuthAction = createOptionalAuthActionClient({
  auth: {
    testUserId: 'optional-user-id',
    testUserEmail: 'optional@example.com',
  },
});

const getPublicPost = optionalAuthAction
  .inputSchema(z.object({ postId: z.string() }))
  .metadata({ actionName: 'getPublicPost', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // ctx.userId may be undefined if user is not authenticated
    const isViewer = ctx.userId !== undefined;
    return {
      postId: parsedInput.postId,
      content: 'This is a public post',
      isViewer,
      viewerId: ctx.userId,
    };
  });

// Example usage
async function main() {
  console.log('=== Authentication Example ===\n');

  // Test 1: Required authentication
  console.log('Test 1: Creating post with authentication');
  const result1 = await createPost({
    title: 'My First Post',
    content: 'This is the content of my first post.',
  });

  type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
  const typedResult1: CreatePostResult = result1;

  if (typedResult1.data) {
    console.log('✅ Post created with auth context:');
    console.log(`   - Author ID: ${typedResult1.data.authorId}`);
    console.log(`   - Author Email: ${typedResult1.data.authorEmail}`);
  }

  // Test 2: Optional authentication (with user)
  console.log('\nTest 2: Getting public post (authenticated user)');
  const result2 = await getPublicPost({ postId: 'post-123' });

  type GetPublicPostResult = InferSafeActionFnResult<typeof getPublicPost>;
  const typedResult2: GetPublicPostResult = result2;

  if (typedResult2.data) {
    console.log('✅ Post retrieved:');
    console.log(`   - Is Viewer: ${typedResult2.data.isViewer}`);
    console.log(`   - Viewer ID: ${typedResult2.data.viewerId}`);
  }

  console.log('\n=== Example Complete ===');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createPost, getPublicPost };

