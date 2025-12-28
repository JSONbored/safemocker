/**
 * Vitest adapter for safemocker
 *
 * This adapter provides Vitest-specific factory functions for mocking next-safe-action.
 * Use this when mocking next-safe-action in Vitest tests. Vitest uses `vi.mock()` to
 * explicitly define mocks, giving you more control over the mock setup.
 *
 * @remarks
 * **Vitest vs Jest**: Vitest requires explicit mock definitions using `vi.mock()`.
 * Unlike Jest's automatic `__mocks__` discovery, Vitest mocks must be defined in
 * `vitest.setup.ts` or at the top of test files before imports.
 *
 * **Available Exports**: This adapter re-exports all helper functions from the main
 * safemocker package, allowing you to create custom mock configurations for Vitest.
 *
 * @example
 * ```typescript
 * // vitest.setup.ts
 * import { vi } from 'vitest';
 * import { createMockSafeActionClient } from '@jsonbored/safemocker/vitest';
 *
 * vi.mock('next-safe-action', () => {
 *   return {
 *     createSafeActionClient: createMockSafeActionClient({
 *       defaultServerError: 'Something went wrong',
 *       auth: {
 *         testUserId: 'test-user-id',
 *       },
 *     }),
 *     DEFAULT_SERVER_ERROR_MESSAGE: 'Something went wrong',
 *   };
 * });
 * ```
 *
 * @example
 * ```typescript
 * // vitest.setup.ts - Using complete action client
 * import { vi } from 'vitest';
 * import { createCompleteActionClient } from '@jsonbored/safemocker/vitest';
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
 * vi.mock('next-safe-action', () => {
 *   return {
 *     createSafeActionClient: (config?: any) => {
 *       // Your implementation
 *     },
 *     authedAction,
 *     optionalAuthAction,
 *     rateLimitedAction,
 *   };
 * });
 * ```
 *
 * @example
 * ```typescript
 * // vitest.setup.ts - Simplest setup (one line)
 * import { vi } from 'vitest';
 * import * as safemockerMock from '@jsonbored/safemocker/vitest/mock';
 *
 * vi.mock('next-safe-action', () => safemockerMock);
 * ```
 *
 * @example
 * ```typescript
 * // In a test file (if not using vitest.setup.ts)
 * import { vi } from 'vitest';
 * import { createMockSafeActionClient } from '@jsonbored/safemocker/vitest';
 *
 * // Mock must be defined before importing next-safe-action
 * vi.mock('next-safe-action', () => ({
 *   createSafeActionClient: createMockSafeActionClient(),
 * }));
 *
 * import { createSafeActionClient } from 'next-safe-action';
 * // Now createSafeActionClient is the mock
 * ```
 *
 * @see {@link createMockSafeActionClient} - For creating custom mock clients
 * @see {@link createCompleteActionClient} - For creating all action clients at once
 * @see {@link MockSafeActionClientConfig} - For configuration options
 * @category Vitest
 * @since 0.2.0
 */

export {
  createMockSafeActionClient,
  createAuthedActionClient,
  createOptionalAuthActionClient,
  createRateLimitedActionClient,
  createMetadataValidatedActionClient,
  createCompleteActionClient,
} from './helpers';
export type { MockSafeActionClientConfig } from './types';

