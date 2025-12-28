/**
 * Middleware helpers for common patterns
 *
 * Provides pre-built middleware for authentication, metadata validation, etc.
 */

import { z } from 'zod';
import type { Middleware, MockSafeActionClientConfig } from './types';
import { handleError } from './error-handler';

/**
 * Creates authentication middleware that requires authentication.
 *
 * This middleware injects test user context (userId, userEmail, authToken) into
 * the action handler's context when authentication is enabled. If authentication
 * is disabled in the config, the middleware passes through without modification.
 *
 * The injected context matches the format expected by next-safe-action's auth
 * middleware, allowing tests to work with the same context structure as production.
 *
 * @param config - Required configuration for the mock client
 * @param config.defaultServerError - Default error message (required for type compatibility)
 * @param config.isProduction - Whether to use production error messages (required for type compatibility)
 * @param config.auth.enabled - Whether authentication is enabled. When `false`, middleware passes through without modification.
 * @param config.auth.testUserId - Test user ID to inject in auth context. Available as `ctx.userId` in handlers.
 * @param config.auth.testUserEmail - Test user email to inject in auth context. Available as `ctx.userEmail` in handlers.
 * @param config.auth.testAuthToken - Test auth token to inject in auth context. Available as `ctx.authToken` in handlers.
 * @returns A middleware function that injects authentication context
 *
 * @remarks
 * This middleware is designed for testing authenticated actions. In tests, authentication
 * is always successful, allowing you to focus on testing business logic rather than
 * authentication infrastructure. The injected context structure matches production:
 * - `ctx.userId` - User ID string
 * - `ctx.userEmail` - User email string
 * - `ctx.authToken` - Auth token string
 *
 * @example
 * ```typescript
 * import { createAuthedMiddleware } from '@jsonbored/safemocker';
 * import { createMockSafeActionClient } from '@jsonbored/safemocker';
 *
 * const config = {
 *   defaultServerError: 'Error',
 *   isProduction: false,
 *   auth: {
 *     enabled: true,
 *     testUserId: 'user-123',
 *     testUserEmail: 'user@example.com',
 *     testAuthToken: 'custom-token',
 *   },
 * };
 *
 * const middleware = createAuthedMiddleware(config);
 *
 * // Use in action client
 * const client = createMockSafeActionClient();
 * client.use(middleware);
 *
 * const action = client
 *   .inputSchema(z.object({ id: z.string() }))
 *   .action(async ({ parsedInput, ctx }) => {
 *     // ctx.userId === 'user-123'
 *     // ctx.userEmail === 'user@example.com'
 *     // ctx.authToken === 'custom-token'
 *     return { id: parsedInput.id, userId: ctx.userId };
 *   });
 * ```
 *
 * @example
 * ```typescript
 * // Disable authentication
 * const middleware = createAuthedMiddleware({
 *   defaultServerError: 'Error',
 *   isProduction: false,
 *   auth: {
 *     enabled: false, // Auth disabled, no context injected
 *   },
 * });
 *
 * // Context will be empty or from other middleware
 * ```
 *
 * @see {@link createOptionalAuthMiddleware} - For optional authentication
 * @see {@link createAuthedActionClient} - For a pre-configured client with this middleware
 * @see {@link MockSafeActionClientConfig} - For configuration type details
 * @category Middleware
 * @since 0.2.0
 */
export function createAuthedMiddleware(
  config: Required<MockSafeActionClientConfig>
): Middleware {
  return async ({ next, ctx = {}, metadata }) => {
    if (!config.auth.enabled) {
      // Auth disabled, proceed with existing context (pass existing ctx in correct format)
      return next({ ctx });
    }

    // Inject test user context (next-safe-action format: { ctx: newContext })
    const authCtx = {
      userId: config.auth.testUserId,
      userEmail: config.auth.testUserEmail,
      authToken: config.auth.testAuthToken,
    };

    // next-safe-action format: next({ ctx: newContext })
    return next({ ctx: authCtx });
  };
}

/**
 * Creates optional authentication middleware.
 *
 * Similar to `createAuthedMiddleware`, but injects authentication context in a format
 * that indicates the user may or may not be authenticated. This is useful for actions
 * that work for both authenticated and unauthenticated users.
 *
 * The injected context includes both a `user` object and individual `userId`, `userEmail`,
 * and `authToken` properties for flexibility. This allows handlers to check if a user
 * is authenticated by checking if `ctx.user` is null or if `ctx.userId` is undefined.
 *
 * @param config - Required configuration for the mock client
 * @param config.defaultServerError - Default error message (required for type compatibility)
 * @param config.isProduction - Whether to use production error messages (required for type compatibility)
 * @param config.auth.enabled - Whether authentication is enabled. When `false`, middleware passes through without modification.
 * @param config.auth.testUserId - Test user ID to inject if authenticated. Available as `ctx.userId` and `ctx.user.id` in handlers.
 * @param config.auth.testUserEmail - Test user email to inject if authenticated. Available as `ctx.userEmail` and `ctx.user.email` in handlers.
 * @param config.auth.testAuthToken - Test auth token to inject if authenticated. Available as `ctx.authToken` in handlers.
 * @returns A middleware function that injects optional authentication context
 *
 * @remarks
 * This middleware is designed for testing actions that support both authenticated and
 * unauthenticated users. The context structure provides flexibility:
 * - `ctx.user` - User object with `{ id: string, email: string }` (always present when enabled)
 * - `ctx.userId` - User ID string (always present when enabled)
 * - `ctx.userEmail` - User email string (always present when enabled)
 * - `ctx.authToken` - Auth token string (always present when enabled)
 *
 * In production, these fields might be `null` or `undefined` when the user is not authenticated,
 * but in tests with `auth.enabled: true`, they are always populated.
 *
 * @example
 * ```typescript
 * import { createOptionalAuthMiddleware } from '@jsonbored/safemocker';
 * import { createMockSafeActionClient } from '@jsonbored/safemocker';
 *
 * const config = {
 *   defaultServerError: 'Error',
 *   isProduction: false,
 *   auth: {
 *     enabled: true,
 *     testUserId: 'user-123',
 *     testUserEmail: 'user@example.com',
 *   },
 * };
 *
 * const middleware = createOptionalAuthMiddleware(config);
 *
 * const client = createMockSafeActionClient();
 * client.use(middleware);
 *
 * const action = client
 *   .inputSchema(z.object({ postId: z.string() }))
 *   .action(async ({ parsedInput, ctx }) => {
 *     // Can check if user is authenticated
 *     if (ctx.userId) {
 *       // User is authenticated
 *       return { postId: parsedInput.postId, viewerId: ctx.userId };
 *     }
 *     // User is not authenticated (in tests, this won't happen if enabled: true)
 *     return { postId: parsedInput.postId };
 *   });
 * ```
 *
 * @example
 * ```typescript
 * // Access user object
 * const action = client
 *   .inputSchema(z.object({ id: z.string() }))
 *   .action(async ({ parsedInput, ctx }) => {
 *     // ctx.user === { id: 'user-123', email: 'user@example.com' }
 *     // ctx.userId === 'user-123'
 *     // ctx.userEmail === 'user@example.com'
 *     return { id: parsedInput.id, user: ctx.user };
 *   });
 * ```
 *
 * @see {@link createAuthedMiddleware} - For required authentication
 * @see {@link createOptionalAuthActionClient} - For a pre-configured client with this middleware
 * @see {@link MockSafeActionClientConfig} - For configuration type details
 * @category Middleware
 * @since 0.2.0
 */
export function createOptionalAuthMiddleware(
  config: Required<MockSafeActionClientConfig>
): Middleware {
  return async ({ next, ctx = {}, metadata }) => {
    if (!config.auth.enabled) {
      // Auth disabled, proceed with existing context (pass existing ctx in correct format)
      return next({ ctx });
    }

    // Inject optional test user context (next-safe-action format: { ctx: newContext })
    const authCtx = {
      user: {
        id: config.auth.testUserId,
        email: config.auth.testUserEmail,
      },
      userId: config.auth.testUserId,
      userEmail: config.auth.testUserEmail,
      authToken: config.auth.testAuthToken,
    };

    // next-safe-action format: next({ ctx: newContext })
    return next({ ctx: authCtx });
  };
}

/**
 * Creates metadata validation middleware.
 *
 * Validates metadata against a Zod schema before proceeding. If validation fails,
 * throws an error that will be caught by the action wrapper and converted to a
 * SafeActionResult with a serverError.
 *
 * @param metadataSchema - Zod schema to validate metadata against. The schema should
 *   define the expected structure of action metadata (e.g., `actionName`, `category`).
 * @returns A middleware function that validates action metadata
 *
 * @remarks
 * This middleware is useful for ensuring actions have the correct metadata structure
 * before execution. It's commonly used with rate limiting or logging middleware that
 * depend on specific metadata fields. The middleware validates metadata when it's
 * present - if metadata is `undefined`, the middleware passes through (allowing
 * actions without metadata).
 *
 * **Error Handling**: If validation fails, the middleware throws an error with the
 * message 'Invalid action metadata'. This error is caught by the action wrapper and
 * converted to a SafeActionResult with `serverError` set.
 *
 * @example
 * ```typescript
 * import { createMetadataValidationMiddleware } from '@jsonbored/safemocker';
 * import { z } from 'zod';
 *
 * const metadataSchema = z.object({
 *   actionName: z.string().min(1),
 *   category: z.enum(['user', 'admin']).optional(),
 * });
 *
 * const middleware = createMetadataValidationMiddleware(metadataSchema);
 *
 * const client = createMockSafeActionClient();
 * client.use(middleware);
 *
 * // Valid metadata - passes
 * const action1 = client
 *   .inputSchema(z.object({ id: z.string() }))
 *   .metadata({ actionName: 'getUser', category: 'user' })
 *   .action(async ({ parsedInput }) => {
 *     return { id: parsedInput.id };
 *   });
 *
 * // Invalid metadata - throws error
 * const action2 = client
 *   .inputSchema(z.object({ id: z.string() }))
 *   .metadata({ actionName: '' }) // Invalid: min length
 *   .action(async ({ parsedInput }) => {
 *     return { id: parsedInput.id };
 *   });
 *
 * // Result will have serverError: 'Invalid action metadata'
 * const result = await action2({ id: '123' });
 * ```
 *
 * @throws {Error} Throws error with message 'Invalid action metadata' if Zod validation fails.
 *   The error is caught by the action wrapper and converted to SafeActionResult with serverError.
 * @see {@link createMetadataValidatedActionClient} - For a pre-configured client with this middleware
 * @see {@link createRateLimitMiddleware} - For rate limiting that also validates metadata
 * @category Middleware
 * @since 0.2.0
 */
export function createMetadataValidationMiddleware(
  metadataSchema: z.ZodType
): Middleware {
  return async ({ next, ctx = {}, metadata }) => {
    try {
      const parsed = metadataSchema.parse(metadata);
      // Metadata is valid, proceed (pass existing ctx in correct format)
      return next({ ctx });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error('Invalid action metadata');
      }
      throw error;
    }
  };
}

/**
 * Creates rate limiting middleware.
 *
 * In test environments, actual rate limiting is typically skipped, but this middleware
 * validates that action metadata is present and matches the provided schema (if given).
 * This ensures actions have the required metadata structure for rate limiting logic
 * without actually enforcing rate limits in tests.
 *
 * **Behavior**: The middleware only validates metadata if both a schema is provided AND
 * metadata is present. If metadata is `undefined`, the middleware passes through without
 * validation. This allows actions without metadata to work, while ensuring actions with
 * metadata have the correct structure.
 *
 * @param metadataSchema - Optional Zod schema to validate metadata against. If provided,
 *   metadata will be validated when present. If not provided, middleware passes through.
 * @returns A middleware function that validates metadata for rate limiting
 *
 * @remarks
 * This middleware is designed to match production rate limiting middleware behavior where
 * metadata is used to determine rate limits. In tests, we skip actual rate limiting but
 * validate that metadata structure is correct, ensuring tests catch metadata issues early.
 *
 * **Error Handling**: If validation fails, the middleware throws an error with the message
 * 'Invalid action configuration'. This error is caught by the action wrapper and converted
 * to a SafeActionResult with `serverError` set.
 *
 * @example
 * ```typescript
 * import { createRateLimitMiddleware } from '@jsonbored/safemocker';
 * import { z } from 'zod';
 *
 * const metadataSchema = z.object({
 *   actionName: z.string().min(1),
 *   category: z.enum(['user', 'admin']).optional(),
 * });
 *
 * const middleware = createRateLimitMiddleware(metadataSchema);
 *
 * const client = createMockSafeActionClient();
 * client.use(middleware);
 *
 * // Valid metadata - passes
 * const action1 = client
 *   .inputSchema(z.object({ query: z.string() }))
 *   .metadata({ actionName: 'search', category: 'content' })
 *   .action(async ({ parsedInput }) => {
 *     return { results: [] };
 *   });
 *
 * // Invalid metadata - throws error
 * const action2 = client
 *   .inputSchema(z.object({ query: z.string() }))
 *   .metadata({ actionName: '' }) // Invalid: min length
 *   .action(async ({ parsedInput }) => {
 *     return { results: [] };
 *   });
 *
 * // Result will have serverError: 'Invalid action configuration'
 * const result = await action2({ query: 'test' });
 * ```
 *
 * @example
 * ```typescript
 * // Without metadata schema - passes through
 * const middleware = createRateLimitMiddleware();
 * // No validation, just passes through
 * ```
 *
 * @throws {Error} Throws error with message 'Invalid action configuration' if metadata validation fails.
 *   The error is caught by the action wrapper and converted to SafeActionResult with serverError.
 * @see {@link createRateLimitedActionClient} - For a pre-configured client with this middleware
 * @see {@link createMetadataValidationMiddleware} - For strict metadata validation
 * @category Middleware
 * @since 0.2.0
 */
export function createRateLimitMiddleware(
  metadataSchema?: z.ZodType
): Middleware {
  return async ({ next, ctx = {}, metadata }) => {
    // In tests, we typically skip actual rate limiting
    // But we validate metadata if schema is provided AND metadata is present
    if (metadataSchema && metadata !== undefined) {
      try {
        metadataSchema.parse(metadata);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error('Invalid action configuration');
        }
        throw error;
      }
    }

    // No new context to add, pass existing ctx in correct format
    return next({ ctx });
  };
}

/**
 * Creates error handling middleware.
 *
 * This middleware wraps the action execution in a try-catch block. However, in the
 * current implementation, errors are re-thrown to be caught by the action wrapper
 * (which calls `handleError`). This middleware is primarily used for consistency
 * with production middleware patterns where error handling middleware might perform
 * logging or other side effects before re-throwing.
 *
 * **Note**: Actual error handling and conversion to SafeActionResult happens in the
 * action wrapper (in `createAction`), not in this middleware. This middleware exists
 * to match production middleware patterns where error handling middleware might
 * perform operations like logging before errors are handled.
 *
 * @param config - Required configuration for the mock client. Currently unused but
 *   kept for API consistency with production middleware patterns. The config parameter
 *   allows future enhancements like error logging or metrics collection.
 * @param config.defaultServerError - Default error message (required for type compatibility)
 * @param config.isProduction - Whether to use production error messages (required for type compatibility)
 * @param config.auth - Authentication configuration (required for type compatibility)
 * @returns A middleware function that can catch and re-throw errors
 *
 * @remarks
 * In production, error handling middleware might:
 * - Log errors to monitoring services
 * - Collect error metrics
 * - Transform error messages
 * - Perform cleanup operations
 *
 * In the mock implementation, errors are simply re-thrown to be handled by the action
 * wrapper, which converts them to SafeActionResult format.
 *
 * @example
 * ```typescript
 * import { createErrorHandlingMiddleware } from '@jsonbored/safemocker';
 *
 * const config = {
 *   defaultServerError: 'Error',
 *   isProduction: false,
 *   auth: { enabled: true, testUserId: 'test' },
 * };
 *
 * const middleware = createErrorHandlingMiddleware(config);
 *
 * const client = createMockSafeActionClient();
 * client.use(middleware);
 *
 * // Errors thrown in handler are caught and re-thrown
 * // Action wrapper converts them to SafeActionResult
 * const action = client
 *   .inputSchema(z.object({ id: z.string() }))
 *   .action(async ({ parsedInput }) => {
 *     throw new Error('Something went wrong');
 *   });
 *
 * const result = await action({ id: '123' });
 * // result.serverError === 'Something went wrong' (or defaultServerError in production mode)
 * ```
 *
 * @see {@link handleError} - For actual error handling and conversion to SafeActionResult
 * @see {@link createCompleteActionClient} - For a client with error handling middleware pre-configured
 * @category Middleware
 * @since 0.2.0
 */
export function createErrorHandlingMiddleware(
  config: Required<MockSafeActionClientConfig>
): Middleware {
  return async ({ next, ctx = {} }) => {
    try {
      // Pass existing ctx in correct format
      return await next({ ctx });
    } catch (error) {
      // Re-throw to be caught by action wrapper
      throw error;
    }
  };
}

