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
 * Creates a mock action client with optional authentication middleware
 *
 * Equivalent to: client.use(optionalAuthMiddleware)
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
 * Creates a mock action client with rate limiting middleware
 *
 * Equivalent to: client.use(rateLimitMiddleware)
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
 * Creates a mock action client with metadata validation middleware
 *
 * Equivalent to: client.use(metadataValidationMiddleware)
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
 * Creates a complete action client matching the real safe-action.ts pattern
 *
 * Includes: error handling, rate limiting (with metadata validation), and authentication
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

