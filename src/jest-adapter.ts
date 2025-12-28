/**
 * Jest adapter for safemocker
 *
 * This adapter provides Jest-specific factory functions for mocking next-safe-action.
 * Use this when mocking next-safe-action in Jest tests. Jest automatically discovers
 * and uses mocks in `__mocks__` directories, making setup very simple.
 *
 * @remarks
 * **Jest vs Vitest**: Jest uses automatic mock discovery via `__mocks__` directories.
 * Simply create a `__mocks__/next-safe-action.ts` file and Jest will automatically
 * use it when `next-safe-action` is imported in tests.
 *
 * **Available Exports**: This adapter re-exports all helper functions from the main
 * safemocker package, allowing you to create custom mock configurations for Jest.
 *
 * @example
 * ```typescript
 * // __mocks__/next-safe-action.ts
 * import { createMockSafeActionClient } from '@jsonbored/safemocker/jest';
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
 * @example
 * ```typescript
 * // __mocks__/next-safe-action.ts - Simplest setup (one line)
 * export * from '@jsonbored/safemocker/jest/mock';
 * ```
 *
 * @see {@link createMockSafeActionClient} - For creating custom mock clients
 * @see {@link createCompleteActionClient} - For creating all action clients at once
 * @see {@link MockSafeActionClientConfig} - For configuration options
 * @category Jest
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

