/**
 * Jest adapter for safemocker
 *
 * This adapter provides Jest-specific factory functions for mocking next-safe-action
 * Use this when mocking next-safe-action in Jest tests.
 *
 * @example
 * ```typescript
 * // __mocks__/next-safe-action.ts
 * import { createMockSafeActionClient } from 'safemocker/jest';
 *
 * export const createSafeActionClient = createMockSafeActionClient({
 *   defaultServerError: 'Something went wrong',
 *   auth: {
 *     testUserId: 'test-user-id',
 *   },
 * });
 *
 * export const DEFAULT_SERVER_ERROR_MESSAGE = 'Something went wrong';
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

