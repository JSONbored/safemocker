/**
 * Default Vitest Mock for next-safe-action
 *
 * This is a ready-to-use mock that works out of the box with zero configuration.
 * Users can import this in their `vitest.setup.ts` or test files. This mock provides
 * all the same exports as the real next-safe-action library, making it a drop-in replacement.
 *
 * @remarks
 * **Zero Configuration**: This mock works immediately with sensible defaults. No setup
 * required beyond importing and using `vi.mock()`.
 *
 * **Same Implementation as Jest**: This file re-exports everything from `jest-mock.ts`
 * since both Jest and Vitest use the same underlying implementation. The only difference
 * is how mocks are set up (Jest uses `__mocks__` directories, Vitest uses `vi.mock()`).
 *
 * **Customization**: For custom configurations, use the factory functions from
 * `@jsonbored/safemocker/vitest` instead of this default mock.
 *
 * @example
 * ```typescript
 * // vitest.setup.ts - Simplest setup
 * import { vi } from 'vitest';
 * import * as safemockerMock from '@jsonbored/safemocker/vitest/mock';
 *
 * vi.mock('next-safe-action', () => safemockerMock);
 * ```
 *
 * @example
 * ```typescript
 * // vitest.setup.ts - With custom metadata schema
 * import { vi } from 'vitest';
 * import { createSafeActionClient } from '@jsonbored/safemocker/vitest/mock';
 * import { z } from 'zod';
 *
 * vi.mock('next-safe-action', () => ({
 *   createSafeActionClient: (config?: any) => {
 *     return createSafeActionClient({
 *       defineMetadataSchema: () => z.object({
 *         actionName: z.string().min(1),
 *         category: z.enum(['user', 'admin']).optional(),
 *       }),
 *     });
 *   },
 *   // Re-export other exports
 *   ...require('@jsonbored/safemocker/vitest/mock'),
 * }));
 * ```
 *
 * @example
 * ```typescript
 * // In a test file (if not using vitest.setup.ts)
 * import { vi } from 'vitest';
 * import * as safemockerMock from '@jsonbored/safemocker/vitest/mock';
 *
 * // Mock must be defined before importing next-safe-action
 * vi.mock('next-safe-action', () => safemockerMock);
 *
 * import { createSafeActionClient, authedAction } from 'next-safe-action';
 * // Now all imports are mocked
 * ```
 *
 * @see {@link createCompleteActionClient} - For creating custom mock configurations
 * @see {@link MockSafeActionClientConfig} - For configuration options
 * @category Vitest
 * @since 0.2.0
 */

// Re-export everything from jest-mock (same implementation for both Jest and Vitest)
export * from './jest-mock';

