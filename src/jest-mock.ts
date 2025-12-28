/**
 * Default Jest Mock for next-safe-action
 *
 * This is a ready-to-use mock that works out of the box with zero configuration.
 * Users can simply import and re-export this in their `__mocks__/next-safe-action.ts` file.
 * This mock provides all the same exports as the real next-safe-action library, making
 * it a drop-in replacement.
 *
 * @remarks
 * **Zero Configuration**: This mock works immediately with sensible defaults. No setup
 * required beyond creating a `__mocks__/next-safe-action.ts` file and re-exporting.
 *
 * **Jest Auto-Discovery**: Jest automatically discovers and uses mocks in `__mocks__`
 * directories when the module is imported in tests. This makes setup incredibly simple.
 *
 * **Default Configuration**: The mock uses sensible defaults:
 * - Metadata schema with `actionName` (required) and `category` (optional)
 * - Authentication enabled with test user credentials
 * - Development mode (detailed error messages)
 * - Default server error: 'Something went wrong'
 *
 * **Customization**: For custom configurations, use the factory functions from
 * `@jsonbored/safemocker/jest` instead of this default mock.
 *
 * @example
 * ```typescript
 * // __mocks__/next-safe-action.ts - Simplest setup (one line)
 * export * from '@jsonbored/safemocker/jest/mock';
 * ```
 *
 * @example
 * ```typescript
 * // __mocks__/next-safe-action.ts - With custom metadata schema
 * import { createSafeActionClient } from '@jsonbored/safemocker/jest/mock';
 * import { z } from 'zod';
 *
 * export function createSafeActionClient(config?: any) {
 *   return createSafeActionClient({
 *     defineMetadataSchema: () => z.object({
 *       actionName: z.string().min(1),
 *       category: z.enum(['user', 'admin']).optional(),
 *     }),
 *   });
 * }
 *
 * // Re-export other exports
 * export { authedAction, optionalAuthAction, rateLimitedAction } from '@jsonbored/safemocker/jest/mock';
 * export type { InferSafeActionFnResult, InferSafeActionFnInput } from '@jsonbored/safemocker/jest/mock';
 * ```
 *
 * @example
 * ```typescript
 * // __mocks__/next-safe-action.ts - Using complete action client
 * import { createCompleteActionClient } from '@jsonbored/safemocker/jest';
 * import { z } from 'zod';
 *
 * const metadataSchema = z.object({
 *   actionName: z.string().min(1),
 *   category: z.enum(['user', 'admin']).optional(),
 * });
 *
 * const { authedAction, optionalAuthAction, rateLimitedAction } = createCompleteActionClient(
 *   metadataSchema,
 *   {
 *     defaultServerError: 'Something went wrong',
 *     auth: {
 *       testUserId: 'test-user-id',
 *     },
 *   }
 * );
 *
 * export function createSafeActionClient(config?: any) {
 *   // Your implementation
 * }
 * export { authedAction, optionalAuthAction, rateLimitedAction };
 * ```
 *
 * @see {@link createCompleteActionClient} - For creating custom mock configurations
 * @see {@link MockSafeActionClientConfig} - For configuration options
 * @category Jest
 * @since 0.2.0
 */

import { createCompleteActionClient } from './helpers';
import { z } from 'zod';
import type { SafeActionResult } from './types';

// Default metadata schema - flexible enough for most use cases
const defaultActionMetadataSchema = z.object({
  actionName: z.string().min(1),
  category: z
    .enum(['analytics', 'form', 'content', 'user', 'admin', 'reputation', 'mfa'])
    .optional(),
});

// Default configuration - sensible defaults that work for most tests
const defaultConfig = {
  defaultServerError: 'Something went wrong',
  isProduction: false,
  auth: {
    enabled: true,
    testUserId: 'test-user-id',
    testUserEmail: 'test@example.com',
    testAuthToken: 'test-token',
  },
};

// Create complete action clients with all middleware
const {
  actionClient: baseActionClient,
  authedAction,
  optionalAuthAction,
  rateLimitedAction,
} = createCompleteActionClient(defaultActionMetadataSchema, defaultConfig);

// Add initial middleware that adds userAgent and startTime (matching real safe-action.ts pattern)
baseActionClient.use(async ({ next, ctx = {} }) => {
  return next({
    ctx: {
      userAgent: 'test-user-agent',
      startTime: performance.now(),
    },
  });
});

/**
 * Default createSafeActionClient factory that matches next-safe-action's API.
 *
 * This is a ready-to-use mock that works out of the box with zero configuration.
 * It matches the exact API of next-safe-action's `createSafeActionClient`, allowing
 * users to simply import and re-export this in their `__mocks__/next-safe-action.ts` file.
 *
 * The factory creates a base action client with sensible defaults that work for most tests.
 * Users can optionally provide custom configuration, but the defaults are sufficient
 * for most use cases.
 *
 * @param config - Optional configuration for customizing the client
 * @param config.defineMetadataSchema - Optional function that returns a Zod schema for metadata validation
 * @param config.handleServerError - Optional callback for custom error handling (accepted for API compatibility, but safemocker uses defaultServerError string)
 * @returns A MockSafeActionClient instance configured with defaults
 *
 * @remarks
 * This is the recommended entry point for Jest mocks. Simply export this function from
 * your `__mocks__/next-safe-action.ts` file and all your tests will automatically use
 * safemocker. The one-line setup makes it incredibly easy to get started with type-safe
 * testing of next-safe-action.
 *
 * @example
 * ```typescript
 * // __mocks__/next-safe-action.ts
 * export * from '@jsonbored/safemocker/jest/mock';
 *
 * // Or with custom metadata schema
 * import { createSafeActionClient as createMockClient } from '@jsonbored/safemocker/jest/mock';
 * import { z } from 'zod';
 *
 * export function createSafeActionClient(config?: any) {
 *   return createMockClient({
 *     defineMetadataSchema: () => z.object({
 *       actionName: z.string().min(1),
 *       category: z.enum(['user', 'admin']).optional(),
 *     }),
 *   });
 * }
 * ```
 *
 * @see {@link createCompleteActionClient} - For creating clients with all middleware pre-configured
 * @category Jest
 * @since 0.2.0
 */
export function createSafeActionClient(config?: {
  defineMetadataSchema?: () => z.ZodType;
  handleServerError?: (error: unknown) => string;
}) {
  const metadataSchema = config?.defineMetadataSchema?.() || defaultActionMetadataSchema;
  
  // Create client with default config
  // Note: handleServerError callback is accepted for API compatibility but
  // safemocker uses defaultServerError string for error handling
  const { actionClient } = createCompleteActionClient(metadataSchema, defaultConfig);

  // Add initial middleware
  actionClient.use(async ({ next, ctx = {} }) => {
    return next({
      ctx: {
        userAgent: 'test-user-agent',
        startTime: performance.now(),
      },
    });
  });

  return actionClient;
}

// Export constants
export const DEFAULT_SERVER_ERROR_MESSAGE = 'Something went wrong';

// Export pre-configured actions (matching real safe-action.ts pattern)
export { authedAction, optionalAuthAction, rateLimitedAction };

// Export utility types that match next-safe-action's API
// These use safemocker's SafeActionResult which includes fieldErrors

/**
 * Infers the result type of a safe action function.
 *
 * Uses safemocker's SafeActionResult which includes fieldErrors, ensuring type-safe
 * access to validation errors without type assertions. This matches next-safe-action's
 * InferSafeActionFnResult API, so when test files import this from 'next-safe-action'
 * (which is the mock), they get the correct type with fieldErrors.
 *
 * @template TAction - The action function type to infer the result from
 * @returns The inferred SafeActionResult type with proper fieldErrors support
 *
 * @remarks
 * This is the key type utility that makes safemocker type-safe. Unlike the real
 * next-safe-action library, safemocker's SafeActionResult explicitly includes fieldErrors
 * in the type definition, allowing direct access without type guards or assertions.
 * This makes tests cleaner and more reliable.
 *
 * @example
 * ```typescript
 * import type { InferSafeActionFnResult } from 'next-safe-action';
 * import { createPost } from './actions';
 *
 * type CreatePostResult = InferSafeActionFnResult<typeof createPost>;
 *
 * const result: CreatePostResult = await createPost({ title: 'Test' });
 * // result.fieldErrors is accessible without type assertions
 * if (result.fieldErrors) {
 *   console.log(result.fieldErrors.title); // Type-safe!
 * }
 * ```
 *
 * @see {@link SafeActionResult} - For the result type structure
 * @category Types
 * @since 0.2.0
 */
export type InferSafeActionFnResult<TAction extends (...args: unknown[]) => Promise<unknown>> = 
  TAction extends (...args: unknown[]) => Promise<infer TResult>
    ? TResult extends { data?: infer TData }
      ? SafeActionResult<TData>
      : TResult
    : never;

/**
 * Infers the input type of a safe action function.
 *
 * Extracts the input parameter type from an action function. This matches
 * next-safe-action's InferSafeActionFnInput API for API compatibility.
 *
 * @template TAction - The action function type to infer the input from. Must be a function
 *   that accepts a single input parameter and returns a Promise.
 * @returns The inferred input type. This is the type of the object you pass to the action.
 *
 * @example
 * ```typescript
 * import type { InferSafeActionFnInput } from 'next-safe-action';
 * import { createPost } from './actions';
 *
 * // Infer the input type
 * type CreatePostInput = InferSafeActionFnInput<typeof createPost>;
 * // CreatePostInput is { title: string; content: string; slug: string; ... }
 *
 * // Use it for type-safe test data
 * const validInput: CreatePostInput = {
 *   title: 'My Post',
 *   content: 'This is the content...',
 *   slug: 'my-post',
 * };
 *
 * const result = await createPost(validInput);
 * ```
 *
 * @see {@link InferSafeActionFnResult} - For inferring the result type
 * @category Types
 * @since 0.2.0
 */
export type InferSafeActionFnInput<TAction extends (...args: unknown[]) => unknown> = 
  TAction extends (input: infer TInput) => unknown
    ? TInput
    : never;

/**
 * Infers the context type of a safe action client or middleware function.
 *
 * This matches next-safe-action's InferCtx API for API compatibility. In the mock
 * implementation, this returns `any` as context types are dynamic and depend on
 * the middleware chain.
 *
 * @template TClient - The client or middleware type to infer context from. Must have
 *   a `use` method for adding middleware.
 * @returns The inferred context type (currently `unknown` in the mock implementation)
 *
 * @example
 * ```typescript
 * import type { InferCtx } from 'next-safe-action';
 * import { authedAction } from './safe-action';
 *
 * // Infer context type (returns 'unknown' in mock)
 * type ActionCtx = InferCtx<typeof authedAction>;
 * // ActionCtx is 'unknown'
 * ```
 *
 * @remarks
 * In the real next-safe-action library, this would infer the actual context type
 * from the middleware chain. In safemocker, it returns `any` for simplicity and
 * compatibility with dynamic context types.
 *
 * @see {@link InferMiddlewareFnNextCtx} - For inferring middleware context types
 * @category Types
 * @since 0.2.0
 */
export type InferCtx<TClient extends { use: (...args: unknown[]) => unknown }> = unknown;

/**
 * Infers the metadata type of a safe action client or middleware function.
 *
 * This matches next-safe-action's InferMetadata API for API compatibility. In the mock
 * implementation, this returns `any` as metadata types are dynamic and can be customized
 * per action.
 *
 * @template TClient - The client or middleware type to infer metadata from. Must have
 *   a `use` method for adding middleware.
 * @returns The inferred metadata type (currently `unknown` in the mock implementation)
 *
 * @example
 * ```typescript
 * import type { InferMetadata } from 'next-safe-action';
 * import { authedAction } from './safe-action';
 *
 * // Infer metadata type (returns 'unknown' in mock)
 * type ActionMetadata = InferMetadata<typeof authedAction>;
 * // ActionMetadata is 'unknown'
 * ```
 *
 * @remarks
 * Metadata is typically used to store action-specific information like action names,
 * categories, or other metadata that can be accessed in middleware.
 *
 * @see {@link createMetadataValidationMiddleware} - For middleware that validates metadata
 * @category Types
 * @since 0.2.0
 */
export type InferMetadata<TClient extends { use: (...args: unknown[]) => unknown }> = unknown;

/**
 * Infers the type of context returned by a middleware function using the next function.
 *
 * This matches next-safe-action's InferMiddlewareFnNextCtx API for API compatibility.
 * In the mock implementation, this returns `unknown` as context types are dynamic and depend
 * on what the middleware passes to `next({ ctx: ... })`.
 *
 * @template TMiddleware - The middleware function type to infer context from. Must be
 *   a function that matches the middleware signature.
 * @returns The inferred context type (currently `unknown` in the mock implementation)
 *
 * @example
 * ```typescript
 * import type { InferMiddlewareFnNextCtx } from 'next-safe-action';
 * import { createAuthedMiddleware } from '@jsonbored/safemocker';
 *
 * const authMiddleware = createAuthedMiddleware();
 *
 * // Infer context type (returns 'unknown' in mock)
 * type AuthCtx = InferMiddlewareFnNextCtx<typeof authMiddleware>;
 * // AuthCtx is 'unknown'
 * ```
 *
 * @remarks
 * In the real next-safe-action library, this would infer the actual context type
 * that the middleware adds. In safemocker, it returns `any` for simplicity.
 *
 * @see {@link Middleware} - For the middleware function type
 * @see {@link InferCtx} - For inferring client context types
 * @category Types
 * @since 0.2.0
 */
export type InferMiddlewareFnNextCtx<TMiddleware extends (...args: unknown[]) => unknown> = unknown;

/**
 * Infers the server error type of a safe action function.
 *
 * This matches next-safe-action's InferServerError API for API compatibility.
 * In safemocker, server errors are always strings.
 *
 * @template TAction - The action function type to infer the error type from
 * @returns The server error type (always `string` in safemocker)
 *
 * @example
 * ```typescript
 * import type { InferServerError } from 'next-safe-action';
 * import { createPost } from './actions';
 *
 * type CreatePostError = InferServerError<typeof createPost>;
 * // CreatePostError is 'string'
 * ```
 *
 * @category Types
 * @since 0.2.0
 */
export type InferServerError<TAction extends (...args: unknown[]) => Promise<unknown>> = string;

// Re-export SafeActionResult type from safemocker
// This ensures test files can import SafeActionResult and it includes fieldErrors
export type { SafeActionResult };

