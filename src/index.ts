/**
 * safemocker - A type-safe, Jest & Vitest-compatible mock for next-safe-action
 *
 * @packageDocumentation
 * @module safemocker
 *
 * safemocker provides a comprehensive mocking solution for `next-safe-action` that
 * replicates real middleware behavior and returns proper `SafeActionResult` structure.
 * It enables true integration testing by allowing you to test your real production
 * action code without modifications.
 *
 * ## Features
 *
 * - **100% Type-Safe**: Full TypeScript inference with no type assertions required
 * - **Jest & Vitest Compatible**: Works seamlessly with both test runners
 * - **Zero Configuration**: Works out of the box with sensible defaults
 * - **Middleware Support**: Replicates authentication, rate limiting, and custom middleware
 * - **Schema Validation**: Validates both input and output schemas using Zod
 * - **Error Handling**: Proper error formatting matching next-safe-action behavior
 *
 * ## Quick Start
 *
 * ### Jest
 *
 * ```typescript
 * // __mocks__/next-safe-action.ts
 * export * from '@jsonbored/safemocker/jest/mock';
 * ```
 *
 * ### Vitest
 *
 * ```typescript
 * // vitest.setup.ts
 * import { vi } from 'vitest';
 * import * as safemockerMock from '@jsonbored/safemocker/vitest/mock';
 *
 * vi.mock('next-safe-action', () => safemockerMock);
 * ```
 *
 * ## Core Exports
 *
 * - {@link createMockSafeActionClient} - Factory function for creating mock clients
 * - {@link MockSafeActionClient} - The mock client class
 * - {@link SafeActionResult} - Result type structure
 * - {@link MockSafeActionClientConfig} - Configuration options
 * - {@link Middleware} - Middleware function type
 * - {@link ActionHandler} - Action handler function type
 *
 * ## Helper Functions
 *
 * - {@link createAuthedActionClient} - Client with authentication middleware
 * - {@link createOptionalAuthActionClient} - Client with optional authentication
 * - {@link createRateLimitedActionClient} - Client with rate limiting middleware
 * - {@link createMetadataValidatedActionClient} - Client with metadata validation
 * - {@link createCompleteActionClient} - Complete set of pre-configured clients
 *
 * ## Middleware Functions
 *
 * - {@link createAuthedMiddleware} - Authentication middleware
 * - {@link createOptionalAuthMiddleware} - Optional authentication middleware
 * - {@link createRateLimitMiddleware} - Rate limiting middleware
 * - {@link createMetadataValidationMiddleware} - Metadata validation middleware
 * - {@link createErrorHandlingMiddleware} - Error handling middleware
 *
 * ## Type Utilities
 *
 * - {@link InferSafeActionFnResult} - Infer result type from action function
 * - {@link InferSafeActionFnInput} - Infer input type from action function
 * - {@link InferCtx} - Infer context type from middleware
 * - {@link InferMetadata} - Infer metadata type from schema
 *
 * @see {@link https://github.com/JSONbored/safemocker} - GitHub repository
 * @see {@link https://safemocker.zeronode.sh/docs} - Full documentation
 * @category Main
 * @since 0.2.0
 */

export * from './types';
export * from './result-wrapper';
export * from './validation';
export * from './error-handler';
export * from './client';
export * from './middleware';
export * from './helpers';

