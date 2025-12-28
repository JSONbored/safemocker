/**
 * Helper functions for creating pre-configured action clients
 *
 * These helpers create clients with common middleware patterns already applied
 */

import { z } from 'zod';
import { createMockSafeActionClient as createBaseClient, MockSafeActionClient, createMockSafeActionClient } from './client';
import {
  createAuthedMiddleware,
  createOptionalAuthMiddleware,
  createMetadataValidationMiddleware,
  createRateLimitMiddleware,
  createErrorHandlingMiddleware,
} from './middleware';
import type { MockSafeActionClientConfig } from './types';

/**
 * Creates a mock action client with authentication middleware
 *
 * Equivalent to: client.use(authedMiddleware)
 */
/**
 * Re-export base factory function
 * Using direct re-export instead of re-export from syntax to avoid Jest coverage instrumentation issues
 */
export { createMockSafeActionClient };

/**
 * Creates a mock action client with authentication middleware pre-configured.
 *
 * This is equivalent to calling `client.use(createAuthedMiddleware())` on a base client.
 * The created client automatically injects authentication context (userId, userEmail, authToken)
 * into the action handler's context parameter.
 *
 * @param config - Optional configuration for the mock client
 * @param config.defaultServerError - Default error message for server errors (default: 'Something went wrong')
 * @param config.isProduction - Whether to use production error messages (default: false)
 * @param config.auth - Authentication configuration
 * @param config.auth.enabled - Whether authentication is enabled (default: true)
 * @param config.auth.testUserId - Test user ID to inject in auth context. Available as `ctx.userId` in handlers (default: 'test-user-id')
 * @param config.auth.testUserEmail - Test user email to inject in auth context. Available as `ctx.userEmail` in handlers (default: 'test@example.com')
 * @param config.auth.testAuthToken - Test auth token to inject in auth context. Available as `ctx.authToken` in handlers (default: 'test-token')
 * @returns Mock safe action client with authentication middleware applied. The client supports
 *   the full method chaining API: `.inputSchema()`, `.metadata()`, `.outputSchema()`, `.action()`.
 *
 * @remarks
 * This helper is the recommended way to create authenticated action clients in tests.
 * It ensures consistent authentication context injection across all actions. The returned
 * client has authentication middleware pre-configured, so all actions created with it will
 * have access to authentication context in their handlers.
 *
 * **Context Structure**: When authentication is enabled, the following context is available:
 * - `ctx.userId` - Test user ID string
 * - `ctx.userEmail` - Test user email string
 * - `ctx.authToken` - Test auth token string
 *
 * @example
 * ```typescript
 * import { createAuthedActionClient } from '@jsonbored/safemocker';
 * import { z } from 'zod';
 *
 * // Create client with custom auth config
 * const authedAction = createAuthedActionClient({
 *   auth: {
 *     testUserId: 'user-123',
 *     testUserEmail: 'user@example.com',
 *   },
 * });
 *
 * // Create action - auth context is automatically available
 * const action = authedAction
 *   .inputSchema(z.object({ id: z.string() }))
 *   .action(async ({ parsedInput, ctx }) => {
 *     // ctx.userId === 'user-123'
 *     // ctx.userEmail === 'user@example.com'
 *     // ctx.authToken === 'test-token' (default)
 *     return { id: parsedInput.id, userId: ctx.userId };
 *   });
 *
 * // Use the action
 * const result = await action({ id: '123' });
 * // result.data.userId === 'user-123'
 * ```
 *
 * @example
 * ```typescript
 * // Use defaults
 * const authedAction = createAuthedActionClient();
 *
 * const action = authedAction
 *   .inputSchema(z.object({ name: z.string() }))
 *   .action(async ({ parsedInput, ctx }) => {
 *     // ctx.userId === 'test-user-id' (default)
 *     return { name: parsedInput.name, authorId: ctx.userId };
 *   });
 * ```
 *
 * @see {@link createAuthedMiddleware} - For the middleware implementation
 * @see {@link createCompleteActionClient} - For creating all action clients at once
 * @see {@link MockSafeActionClient} - For the client class API
 * @category Helpers
 * @since 0.2.0
 */
export function createAuthedActionClient(
  config?: MockSafeActionClientConfig
): MockSafeActionClient {
  const client = createBaseClient(config);
  const requiredConfig: Required<MockSafeActionClientConfig> = {
    defaultServerError: config?.defaultServerError || 'Something went wrong',
    isProduction: config?.isProduction ?? false,
    auth: {
      enabled: config?.auth?.enabled ?? true,
      testUserId: config?.auth?.testUserId || 'test-user-id',
      testUserEmail: config?.auth?.testUserEmail || 'test@example.com',
      testAuthToken: config?.auth?.testAuthToken || 'test-token',
    },
  };

  client.use(createAuthedMiddleware(requiredConfig));
  return client;
}

/**
 * Creates a mock action client with optional authentication middleware pre-configured.
 *
 * This is equivalent to calling `client.use(createOptionalAuthMiddleware())` on a base client.
 * The created client injects optional authentication context - the user may or may not be authenticated.
 * This is useful for actions that work for both authenticated and unauthenticated users.
 *
 * @param config - Optional configuration for the mock client
 * @param config.defaultServerError - Default error message for server errors (default: 'Something went wrong')
 * @param config.isProduction - Whether to use production error messages (default: false)
 * @param config.auth - Authentication configuration
 * @param config.auth.enabled - Whether authentication is enabled (default: true)
 * @param config.auth.testUserId - Test user ID to inject if authenticated. Available as `ctx.userId` and `ctx.user.id` (default: 'test-user-id')
 * @param config.auth.testUserEmail - Test user email to inject if authenticated. Available as `ctx.userEmail` and `ctx.user.email` (default: 'test@example.com')
 * @param config.auth.testAuthToken - Test auth token to inject if authenticated. Available as `ctx.authToken` (default: 'test-token')
 * @returns Mock safe action client with optional authentication middleware applied. The client supports
 *   the full method chaining API: `.inputSchema()`, `.metadata()`, `.outputSchema()`, `.action()`.
 *
 * @remarks
 * This helper is designed for actions that support both authenticated and unauthenticated users.
 * The context structure provides flexibility with both a `user` object and individual properties:
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
 * import { createOptionalAuthActionClient } from '@jsonbored/safemocker';
 * import { z } from 'zod';
 *
 * // Create client
 * const optionalAuthAction = createOptionalAuthActionClient({
 *   auth: {
 *     testUserId: 'user-123',
 *   },
 * });
 *
 * // Create action that works with or without auth
 * const action = optionalAuthAction
 *   .inputSchema(z.object({ postId: z.string() }))
 *   .action(async ({ parsedInput, ctx }) => {
 *     // Can check if user is authenticated
 *     if (ctx.userId) {
 *       // User is authenticated
 *       return { postId: parsedInput.postId, viewerId: ctx.userId, isAuthor: false };
 *     }
 *     // User is not authenticated (in tests, this won't happen if enabled: true)
 *     return { postId: parsedInput.postId };
 *   });
 * ```
 *
 * @example
 * ```typescript
 * // Access user object
 * const action = optionalAuthAction
 *   .inputSchema(z.object({ id: z.string() }))
 *   .action(async ({ parsedInput, ctx }) => {
 *     // ctx.user === { id: 'test-user-id', email: 'test@example.com' }
 *     // ctx.userId === 'test-user-id'
 *     return { id: parsedInput.id, user: ctx.user };
 *   });
 * ```
 *
 * @see {@link createOptionalAuthMiddleware} - For the middleware implementation
 * @see {@link createAuthedActionClient} - For required authentication
 * @see {@link createCompleteActionClient} - For creating all action clients at once
 * @category Helpers
 * @since 0.2.0
 */
export function createOptionalAuthActionClient(
  config?: MockSafeActionClientConfig
): MockSafeActionClient {
  const client = createBaseClient(config);
  const requiredConfig: Required<MockSafeActionClientConfig> = {
    defaultServerError: config?.defaultServerError || 'Something went wrong',
    isProduction: config?.isProduction ?? false,
    auth: {
      enabled: config?.auth?.enabled ?? true,
      testUserId: config?.auth?.testUserId || 'test-user-id',
      testUserEmail: config?.auth?.testUserEmail || 'test@example.com',
      testAuthToken: config?.auth?.testAuthToken || 'test-token',
    },
  };

  client.use(createOptionalAuthMiddleware(requiredConfig));
  return client;
}

/**
 * Creates a mock action client with rate limiting middleware pre-configured.
 *
 * This is equivalent to calling `client.use(createRateLimitMiddleware())` on a base client.
 * The rate limiting middleware validates action metadata against the provided schema (if given).
 * In tests, actual rate limiting is skipped, but metadata validation ensures actions have the
 * correct structure for rate limiting logic.
 *
 * @param metadataSchema - Optional Zod schema for validating action metadata. If provided,
 *   metadata will be validated when present. If not provided, middleware passes through.
 * @param config - Optional configuration for the mock client
 * @param config.defaultServerError - Default error message for server errors (default: 'Something went wrong')
 * @param config.isProduction - Whether to use production error messages (default: false)
 * @param config.auth - Authentication configuration
 * @returns Mock safe action client with rate limiting middleware applied. The client supports
 *   the full method chaining API: `.inputSchema()`, `.metadata()`, `.outputSchema()`, `.action()`.
 *
 * @remarks
 * This helper is designed for actions that need rate limiting. In production, rate limiting
 * middleware would enforce actual rate limits. In tests, we skip rate limiting but validate
 * that metadata structure is correct, ensuring tests catch metadata issues early.
 *
 * **Metadata Validation**: The middleware validates metadata if both a schema is provided AND
 * metadata is present. If metadata is `undefined`, the middleware passes through without validation.
 *
 * @example
 * ```typescript
 * import { createRateLimitedActionClient } from '@jsonbored/safemocker';
 * import { z } from 'zod';
 *
 * const metadataSchema = z.object({
 *   actionName: z.string().min(1),
 *   category: z.enum(['user', 'admin']).optional(),
 * });
 *
 * // Create client with metadata validation
 * const rateLimitedAction = createRateLimitedActionClient(metadataSchema);
 *
 * // Create action with metadata
 * const action = rateLimitedAction
 *   .inputSchema(z.object({ query: z.string() }))
 *   .metadata({ actionName: 'search', category: 'user' })
 *   .action(async ({ parsedInput }) => {
 *     return { results: [] };
 *   });
 *
 * // Use the action
 * const result = await action({ query: 'test' });
 * ```
 *
 * @example
 * ```typescript
 * // Without metadata schema - no validation
 * const rateLimitedAction = createRateLimitedActionClient();
 *
 * const action = rateLimitedAction
 *   .inputSchema(z.object({ query: z.string() }))
 *   .action(async ({ parsedInput }) => {
 *     return { results: [] };
 *   });
 * ```
 *
 * @throws {Error} Throws error with message 'Invalid action configuration' if metadata validation fails.
 *   The error is caught by the action wrapper and converted to SafeActionResult with serverError.
 * @see {@link createRateLimitMiddleware} - For the middleware implementation
 * @see {@link createCompleteActionClient} - For creating all action clients at once
 * @category Helpers
 * @since 0.2.0
 */
export function createRateLimitedActionClient(
  metadataSchema?: z.ZodType,
  config?: MockSafeActionClientConfig
): MockSafeActionClient {
  const client = createBaseClient(config);
  client.use(createRateLimitMiddleware(metadataSchema));
  return client;
}

/**
 * Creates a mock action client with metadata validation middleware pre-configured.
 *
 * This is equivalent to calling `client.use(createMetadataValidationMiddleware())` on a base client.
 * The created client validates action metadata against the provided schema before the
 * action handler executes. If validation fails, the action returns a SafeActionResult with
 * `serverError` set to 'Invalid action metadata'.
 *
 * @param metadataSchema - Zod schema for validating action metadata. The schema should
 *   define the expected structure of action metadata (e.g., `actionName`, `category`).
 *   Metadata is validated when present - if metadata is `undefined`, validation is skipped.
 * @param config - Optional configuration for the mock client
 * @param config.defaultServerError - Default error message for server errors (default: 'Something went wrong')
 * @param config.isProduction - Whether to use production error messages (default: false)
 * @param config.auth - Authentication configuration
 * @returns Mock safe action client with metadata validation middleware applied. The client supports
 *   the full method chaining API: `.inputSchema()`, `.metadata()`, `.outputSchema()`, `.action()`.
 *
 * @remarks
 * This helper is useful for ensuring actions have the correct metadata structure before execution.
 * It's commonly used with rate limiting or logging middleware that depend on specific metadata fields.
 * The middleware validates metadata when it's present - if metadata is `undefined`, the middleware
 * passes through (allowing actions without metadata).
 *
 * **Error Handling**: If validation fails, the middleware throws an error with the message
 * 'Invalid action metadata'. This error is caught by the action wrapper and converted to a
 * SafeActionResult with `serverError` set.
 *
 * @example
 * ```typescript
 * import { createMetadataValidatedActionClient } from '@jsonbored/safemocker';
 * import { z } from 'zod';
 *
 * const metadataSchema = z.object({
 *   actionName: z.string().min(1),
 *   category: z.enum(['user', 'admin']).optional(),
 * });
 *
 * // Create client with metadata validation
 * const client = createMetadataValidatedActionClient(metadataSchema);
 *
 * // Valid metadata - passes
 * const action1 = client
 *   .inputSchema(z.object({ id: z.string() }))
 *   .metadata({ actionName: 'getUser', category: 'user' })
 *   .action(async ({ parsedInput }) => {
 *     return { id: parsedInput.id };
 *   });
 *
 * // Invalid metadata - returns error
 * const action2 = client
 *   .inputSchema(z.object({ id: z.string() }))
 *   .metadata({ actionName: '' }) // Invalid: min length
 *   .action(async ({ parsedInput }) => {
 *     return { id: parsedInput.id };
 *   });
 *
 * const result = await action2({ id: '123' });
 * // result.serverError === 'Invalid action metadata'
 * ```
 *
 * @throws {Error} Throws error with message 'Invalid action metadata' if Zod validation fails.
 *   The error is caught by the action wrapper and converted to SafeActionResult with serverError.
 * @see {@link createMetadataValidationMiddleware} - For the middleware implementation
 * @see {@link createRateLimitMiddleware} - For rate limiting that also validates metadata
 * @category Helpers
 * @since 0.2.0
 */
export function createMetadataValidatedActionClient(
  metadataSchema: z.ZodType,
  config?: MockSafeActionClientConfig
): MockSafeActionClient {
  const client = createBaseClient(config);
  client.use(createMetadataValidationMiddleware(metadataSchema));
  return client;
}

/**
 * Creates a complete action client matching the real safe-action.ts pattern.
 *
 * This function creates a set of pre-configured action clients that match the typical
 * production setup for next-safe-action, including:
 * - Base action client
 * - Logged action (with error handling)
 * - Rate limited action (with metadata validation)
 * - Authenticated action (with auth middleware)
 * - Optional authenticated action (with optional auth middleware)
 *
 * This is the recommended way to set up the mock for the one-line Jest mock pattern.
 *
 * @param metadataSchema - Zod schema for validating action metadata
 * @param config - Optional configuration for the mock clients
 * @returns Object containing all pre-configured action clients
 *
 * @remarks
 * This helper is designed to match the exact structure of a typical production `safe-action.ts`
 * file, making it easy to create a one-line mock that exports all the same action clients.
 * Use this in your `__mocks__/next-safe-action.ts` file for the simplest setup.
 *
 * @example
 * ```typescript
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
 * // Use in __mocks__/next-safe-action.ts
 * export function createSafeActionClient(config?: any) {
 *   // Your implementation
 * }
 * export { authedAction, optionalAuthAction, rateLimitedAction };
 * ```
 *
 * @category Helpers
 * @since 0.2.0
 */
export function createCompleteActionClient(
  metadataSchema: z.ZodType,
  config?: MockSafeActionClientConfig
): {
  actionClient: MockSafeActionClient;
  loggedAction: MockSafeActionClient;
  rateLimitedAction: MockSafeActionClient;
  authedAction: MockSafeActionClient;
  optionalAuthAction: MockSafeActionClient;
} {
  const requiredConfig: Required<MockSafeActionClientConfig> = {
    defaultServerError: config?.defaultServerError || 'Something went wrong',
    isProduction: config?.isProduction ?? false,
    auth: {
      enabled: config?.auth?.enabled ?? true,
      testUserId: config?.auth?.testUserId || 'test-user-id',
      testUserEmail: config?.auth?.testUserEmail || 'test@example.com',
      testAuthToken: config?.auth?.testAuthToken || 'test-token',
    },
  };

  // Base action client
  const actionClient = createBaseClient(config);

  // Logged action (with error handling)
  const loggedAction = createBaseClient(config);
  loggedAction.use(createErrorHandlingMiddleware(requiredConfig));

  // Rate limited action (with metadata validation)
  const rateLimitedAction = createBaseClient(config);
  rateLimitedAction.use(createErrorHandlingMiddleware(requiredConfig));
  rateLimitedAction.use(createRateLimitMiddleware(metadataSchema));

  // Authed action
  const authedAction = createBaseClient(config);
  authedAction.use(createErrorHandlingMiddleware(requiredConfig));
  authedAction.use(createRateLimitMiddleware(metadataSchema));
  authedAction.use(createAuthedMiddleware(requiredConfig));

  // Optional auth action
  const optionalAuthAction = createBaseClient(config);
  optionalAuthAction.use(createErrorHandlingMiddleware(requiredConfig));
  optionalAuthAction.use(createRateLimitMiddleware(metadataSchema));
  optionalAuthAction.use(createOptionalAuthMiddleware(requiredConfig));

  return {
    actionClient,
    loggedAction,
    rateLimitedAction,
    authedAction,
    optionalAuthAction,
  };
}

