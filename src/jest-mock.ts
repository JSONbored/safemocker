/**
 * Default Jest Mock for next-safe-action
 *
 * This is a ready-to-use mock that works out of the box with zero configuration.
 * Users can simply import and re-export this in their __mocks__/next-safe-action.ts file.
 *
 * @example
 * ```typescript
 * // __mocks__/next-safe-action.ts
 * export * from '@jsonbored/safemocker/jest/mock';
 * ```
 *
 * For customization, use the factory functions from '@jsonbored/safemocker/jest' instead.
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
 * Default createSafeActionClient factory
 * 
 * This matches next-safe-action's API and works out of the box.
 * Users can optionally provide custom config, but defaults work for most cases.
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
 * Infer the result type of a safe action function.
 * Uses safemocker's SafeActionResult which includes fieldErrors.
 * 
 * This matches next-safe-action's InferSafeActionFnResult API.
 * When test files import this from 'next-safe-action' (which is the mock),
 * they get the correct type with fieldErrors.
 */
export type InferSafeActionFnResult<TAction extends (...args: any[]) => Promise<any>> = 
  TAction extends (...args: any[]) => Promise<infer TResult>
    ? TResult extends { data?: infer TData }
      ? SafeActionResult<TData>
      : TResult
    : never;

/**
 * Infer the input types of a safe action function.
 * Matches next-safe-action's InferSafeActionFnInput API.
 */
export type InferSafeActionFnInput<TAction extends (...args: any[]) => any> = 
  TAction extends (input: infer TInput) => any
    ? TInput
    : never;

/**
 * Infer the context type of a safe action client or middleware function.
 * Matches next-safe-action's InferCtx API.
 */
export type InferCtx<TClient extends { use: (...args: any[]) => any }> = any;

/**
 * Infer the metadata type of a safe action client or middleware function.
 * Matches next-safe-action's InferMetadata API.
 */
export type InferMetadata<TClient extends { use: (...args: any[]) => any }> = any;

/**
 * Infer the type of context returned by a middleware function using the next function.
 * Matches next-safe-action's InferMiddlewareFnNextCtx API.
 */
export type InferMiddlewareFnNextCtx<TMiddleware extends (...args: any[]) => any> = any;

/**
 * Infer the server error type.
 * Matches next-safe-action's InferServerError API.
 */
export type InferServerError<TAction extends (...args: any[]) => Promise<any>> = string;

// Re-export SafeActionResult type from safemocker
// This ensures test files can import SafeActionResult and it includes fieldErrors
export type { SafeActionResult };

