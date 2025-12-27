/**
 * Default Vitest Mock for next-safe-action
 *
 * This is a ready-to-use mock that works out of the box with zero configuration.
 * Users can import this in their vitest.setup.ts or test files.
 *
 * @example
 * ```typescript
 * // vitest.setup.ts
 * import { vi } from 'vitest';
 * import * as safemockerMock from '@jsonbored/safemocker/vitest/mock';
 *
 * vi.mock('next-safe-action', () => safemockerMock);
 * ```
 *
 * For customization, use the factory functions from '@jsonbored/safemocker/vitest' instead.
 */

// Re-export everything from jest-mock (same implementation for both Jest and Vitest)
export * from './jest-mock';

