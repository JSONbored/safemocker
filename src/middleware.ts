/**
 * Middleware helpers for common patterns
 *
 * Provides pre-built middleware for authentication, metadata validation, etc.
 */

import { z } from 'zod';
import type { Middleware, MockSafeActionClientConfig } from './types';
import { handleError } from './error-handler';

/**
 * Creates authentication middleware that requires authentication
 *
 * Injects test user context when auth is enabled in config
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
 * Creates optional authentication middleware
 *
 * Injects test user context when auth is enabled, but doesn't require it
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
 * Creates metadata validation middleware
 *
 * Validates metadata against a Zod schema before proceeding
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
 * Creates rate limiting middleware
 *
 * In tests, rate limiting is typically skipped, but this middleware
 * validates metadata is present (required for rate limiting logic)
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
 * Creates error handling middleware
 *
 * Catches errors and converts them to SafeActionResult
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

