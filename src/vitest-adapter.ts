/**
 * Vitest adapter for safemocker
 *
 * This adapter provides Vitest-specific factory functions for mocking next-safe-action
 * Use this when mocking next-safe-action in Vitest tests.
 *
 * @example
 * ```typescript
 * // vitest.setup.ts or test file
 * import { vi } from 'vitest';
 * import { createMockSafeActionClient } from 'safemocker/vitest';
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

