/**
 * Vitest Integration Example
 *
 * This example demonstrates the complete Vitest setup for safemocker,
 * including the mock setup and test examples.
 *
 * @example
 * ```bash
 * # This file demonstrates the setup. To use it:
 * # 1. Create vitest.setup.ts (see below)
 * # 2. Configure vitest.config.ts to use the setup file
 * # 3. Create your safe-action.ts file
 * # 4. Write tests using your real production actions
 * ```
 */

/**
 * STEP 1: Create vitest.setup.ts
 * 
 * Create this file in your project root:
 * 
 * ```typescript
 * import { vi } from 'vitest';
 * import * as safemockerMock from '@jsonbored/safemocker/vitest/mock';
 * 
 * vi.mock('next-safe-action', () => safemockerMock);
 * ```
 */

/**
 * STEP 2: Configure vitest.config.ts
 * 
 * ```typescript
 * import { defineConfig } from 'vitest/config';
 * 
 * export default defineConfig({
 *   test: {
 *     setupFiles: ['./vitest.setup.ts'],
 *   },
 * });
 * ```
 */

/**
 * STEP 3: Create your production safe-action.ts file
 * 
 * This file works in BOTH test and production environments:
 * 
 * ```typescript
 * import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
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
 * // Create production authedAction
 * export const authedAction = actionClient.use(async ({ next }) => {
 *   const authCtx = {
 *     userId: 'production-user-id', // Replace with real auth logic
 *     userEmail: 'user@example.com',
 *   };
 *   return next({ ctx: authCtx });
 * });
 * ```
 */

/**
 * STEP 4: Create your actions
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
 * STEP 5: Write tests
 * 
 * ```typescript
 * import { describe, expect, it } from 'vitest';
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
 * STEP 6: Run tests
 * 
 * ```bash
 * npm test
 * # or
 * pnpm test
 * ```
 * 
 * Vitest will use the mock from vitest.setup.ts,
 * and your real production actions will work without any modifications!
 */

/**
 * Alternative: Inline Mock Setup
 * 
 * If you prefer not to use a setup file, you can mock directly in your test file:
 * 
 * ```typescript
 * import { vi } from 'vitest';
 * import * as safemockerMock from '@jsonbored/safemocker/vitest/mock';
 * 
 * // Must be called before any imports that use next-safe-action
 * vi.mock('next-safe-action', () => safemockerMock);
 * 
 * // Now import your actions
 * import { createPost } from './actions';
 * ```
 */

export {};

