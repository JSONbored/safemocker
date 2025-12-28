/**
 * Jest Integration Example
 *
 * This example demonstrates the complete Jest setup for safemocker,
 * including the mock file and test examples.
 *
 * @example
 * ```bash
 * # This file demonstrates the setup. To use it:
 * # 1. Create __mocks__/next-safe-action.ts in your project root:
 * #    export * from '@jsonbored/safemocker/jest/mock';
 * # 2. Create your safe-action.ts file (see below)
 * # 3. Write tests using your real production actions
 * ```
 */

/**
 * STEP 1: Create __mocks__/next-safe-action.ts
 * 
 * Create this file in your project root (same level as package.json):
 * 
 * ```typescript
 * export * from '@jsonbored/safemocker/jest/mock';
 * ```
 * 
 * Jest will automatically use this file when you import 'next-safe-action' in tests.
 */

/**
 * STEP 2: Create your production safe-action.ts file
 * 
 * This file works in BOTH test and production environments:
 * 
 * ```typescript
 * import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
 * import * as nextSafeActionModule from 'next-safe-action';
 * import { z } from 'zod';
 * 
 * const actionMetadataSchema = z.object({
 *   actionName: z.string().min(1),
 *   category: z.enum(['user', 'content', 'admin']).optional(),
 * });
 * 
 * export const actionClient = createSafeActionClient({
 *   defineMetadataSchema() {
 *     return actionMetadataSchema;
 *   },
 *   handleServerError(error) {
 *     console.error('Server action error:', error);
 *     return DEFAULT_SERVER_ERROR_MESSAGE;
 *   },
 * });
 * 
 * // Extract mocked actions if available (only in tests)
 * const mockAuthedAction = 'authedAction' in nextSafeActionModule 
 *   ? (nextSafeActionModule as any).authedAction 
 *   : undefined;
 * 
 * // Create production authedAction
 * const realAuthedAction = actionClient.use(async ({ next }) => {
 *   const authCtx = {
 *     userId: 'production-user-id', // Replace with real auth logic
 *     userEmail: 'user@example.com',
 *   };
 *   return next({ ctx: authCtx });
 * });
 * 
 * // Export: use mock in tests, real in production
 * export const authedAction = mockAuthedAction ?? realAuthedAction;
 * ```
 */

/**
 * STEP 3: Create your actions
 * 
 * ```typescript
 * import { authedAction } from './safe-action';
 * import { z } from 'zod';
 * 
 * export const createPost = authedAction
 *   .inputSchema(
 *     z.object({
 *       title: z.string().min(1),
 *       content: z.string().min(10),
 *     })
 *   )
 *   .metadata({ actionName: 'createPost', category: 'content' })
 *   .action(async ({ parsedInput, ctx }) => {
 *     return {
 *       id: `post-${Date.now()}`,
 *       title: parsedInput.title,
 *       content: parsedInput.content,
 *       authorId: ctx.userId,
 *     };
 *   });
 * ```
 */

/**
 * STEP 4: Write tests
 * 
 * ```typescript
 * import { describe, expect, it } from '@jest/globals';
 * import { createPost } from './actions';
 * import type { InferSafeActionFnResult } from 'next-safe-action';
 * 
 * describe('createPost', () => {
 *   it('should create post successfully', async () => {
 *     const result = await createPost({
 *       title: 'My Post',
 *       content: 'This is the content of my post.',
 *     });
 * 
 *     // Use InferSafeActionFnResult for 100% type safety
 *     type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
 *     const typedResult: CreatePostResult = result;
 * 
 *     expect(typedResult.data).toBeDefined();
 *     expect(typedResult.data?.title).toBe('My Post');
 *     expect(typedResult.data?.authorId).toBe('test-user-id'); // From safemocker
 *     expect(typedResult.fieldErrors).toBeUndefined();
 *   });
 * 
 *   it('should return validation errors for invalid input', async () => {
 *     const result = await createPost({
 *       title: '', // Invalid
 *       content: 'short', // Invalid
 *     });
 * 
 *     type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
 *     const typedResult: CreatePostResult = result;
 * 
 *     expect(typedResult.fieldErrors).toBeDefined();
 *     expect(typedResult.fieldErrors?.title).toBeDefined();
 *     expect(typedResult.fieldErrors?.content).toBeDefined();
 *   });
 * });
 * ```
 */

/**
 * STEP 5: Run tests
 * 
 * ```bash
 * npm test
 * # or
 * pnpm test
 * ```
 * 
 * Jest will automatically use the mock from __mocks__/next-safe-action.ts,
 * and your real production actions will work without any modifications!
 */

export {};

