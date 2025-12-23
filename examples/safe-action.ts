/**
 * Real safe-action.ts file using next-safe-action
 *
 * This file demonstrates how safemocker works with real next-safe-action usage.
 * In tests, next-safe-action is mocked via __mocks__/next-safe-action.ts,
 * allowing this file to work seamlessly in both real and test environments.
 */

import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
  // Import pre-configured actions from mock (these have auth middleware already)
  authedAction as mockAuthedAction,
  optionalAuthAction as mockOptionalAuthAction,
  rateLimitedAction as mockRateLimitedAction,
} from 'next-safe-action';
import { z } from 'zod';

// Define metadata schema
const actionMetadataSchema = z.object({
  actionName: z.string().min(1),
  category: z
    .enum(['analytics', 'form', 'content', 'user', 'admin', 'reputation', 'mfa'])
    .optional(),
});

export type ActionMetadata = z.infer<typeof actionMetadataSchema>;

// Create base action client
export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return actionMetadataSchema;
  },
  handleServerError(error) {
    // In real usage, this would log errors using structured logging
    // For demonstration purposes, we show console.error here
    // In production, replace with: logger.error('Server action error', normalizedError)
    // eslint-disable-next-line no-console
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error('Server action error:', message);
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  // Add initial context (userAgent, startTime, etc.)
  const startTime = performance.now();
  const userAgent = 'test-user-agent'; // In real usage, this would come from headers()

  return next({
    ctx: {
      userAgent,
      startTime,
    },
  }); // Correct: next-safe-action format
});

// Create logged action (with error handling)
const loggedAction = actionClient.use(async ({ next, metadata }) => {
  try {
    return await next();
  } catch (error) {
    const actionName = metadata?.actionName ?? 'unknown';
    // eslint-disable-next-line no-console
    console.error(`Action ${actionName} failed:`, error);
    throw error;
  }
});

// Create rate limited action (with metadata validation)
export const rateLimitedAction = loggedAction.use(async ({ next, metadata }) => {
  const parsedMetadata = actionMetadataSchema.safeParse(metadata);
  if (!parsedMetadata.success) {
    throw new Error('Invalid action configuration');
  }

  return next();
});

// Use the mock's pre-configured authedAction which already has auth middleware
// In real usage, this would add auth middleware here
// For tests, the mock's authedAction already injects auth context
export const authedAction = mockAuthedAction;

// Use the mock's pre-configured optionalAuthAction which already has auth middleware
// In real usage, this would add optional auth middleware here
// For tests, the mock's optionalAuthAction already injects auth context
export const optionalAuthAction = mockOptionalAuthAction;

