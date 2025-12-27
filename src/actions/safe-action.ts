/**
 * Production safe-action.ts
 *
 * This file demonstrates REAL production usage of next-safe-action.
 * It works in both test and production environments without any modifications.
 *
 * In tests, Jest automatically uses __mocks__/next-safe-action.ts (which uses safemocker).
 * In production, this file creates its own middleware chain.
 *
 * This matches the exact pattern used in real Next.js applications.
 */

import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import * as nextSafeActionModule from 'next-safe-action';
import { z } from 'zod';

// Define metadata schema
const actionMetadataSchema = z.object({
  actionName: z.string().min(1),
  category: z
    .enum(['analytics', 'form', 'content', 'user', 'admin', 'reputation', 'mfa'])
    .optional(),
});

export type ActionMetadata = z.infer<typeof actionMetadataSchema>;

// Create base action client with error handling
export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return actionMetadataSchema;
  },
  handleServerError(error) {
    // In production, this would use structured logging
    // For this example, we use console.error
    // eslint-disable-next-line no-console
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error('Server action error:', message);
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
}).use(async ({ next }) => {
  // Add initial context (userAgent, startTime, etc.)
  // In production, this would come from headers()
  const startTime = performance.now();
  const userAgent = 'production-user-agent'; // In real usage: await headers().get('user-agent')

  return next({
    ctx: {
      userAgent,
      startTime,
    },
  });
});

// Create logged action (with error handling)
const loggedAction = actionClient.use(async ({ next, metadata }) => {
  try {
    return await next();
  } catch (error) {
    const actionName = metadata?.actionName ?? 'unknown';
    // In production, this would use structured logging
    // eslint-disable-next-line no-console
    console.error(`Action ${actionName} failed:`, error);
    throw error;
  }
});

// Create production rateLimitedAction (with metadata validation)
const realRateLimitedAction = loggedAction.use(async ({ next, metadata }) => {
  const parsedMetadata = actionMetadataSchema.safeParse(metadata);
  if (!parsedMetadata.success) {
    // In production, this would use structured logging
    // eslint-disable-next-line no-console
    console.error('Invalid action metadata:', parsedMetadata.error);
    throw new Error('Invalid action configuration');
  }

  return next();
});

// Extract mocked actions if available (only in tests via safemocker)
// In production, these don't exist in next-safe-action, so we create our own
const mockAuthedAction = 'authedAction' in nextSafeActionModule 
  ? (nextSafeActionModule as any).authedAction 
  : undefined;
const mockOptionalAuthAction = 'optionalAuthAction' in nextSafeActionModule 
  ? (nextSafeActionModule as any).optionalAuthAction 
  : undefined;
const mockRateLimitedAction = 'rateLimitedAction' in nextSafeActionModule 
  ? (nextSafeActionModule as any).rateLimitedAction 
  : undefined;

// Export rateLimitedAction: use mock in tests, real in production
export const rateLimitedAction = mockRateLimitedAction ?? realRateLimitedAction;

// Create production authedAction using realRateLimitedAction
const realAuthedAction = realRateLimitedAction.use(async ({ next, metadata }) => {
  // In production, this would:
  // 1. Check session using Supabase/auth library
  // 2. Validate JWT token
  // 3. Get user from database
  // 4. Inject auth context
  
  // For this example, we simulate production auth
  const authCtx = {
    userId: 'production-user-id', // In real usage: get from session
    userEmail: 'user@example.com', // In real usage: get from session
    authToken: 'production-token', // In real usage: get from session
  };

  return next({
    ctx: authCtx,
  });
});

// Export authedAction: use mock in tests, real in production
export const authedAction = mockAuthedAction ?? realAuthedAction;

// Create production optionalAuthAction using realRateLimitedAction
const realOptionalAuthAction = realRateLimitedAction.use(async ({ next, metadata }) => {
  // In production, this would:
  // 1. Check if session exists (optional)
  // 2. If session exists, get user
  // 3. Inject optional auth context
  
  // For this example, we simulate optional auth (no user in this case)
  const authCtx = {
    user: null as { id: string; email: string } | null,
    userId: undefined as string | undefined,
    userEmail: undefined as string | undefined,
    authToken: undefined as string | undefined,
  };

  return next({
    ctx: authCtx,
  });
});

// Export optionalAuthAction: use mock in tests, real in production
export const optionalAuthAction = mockOptionalAuthAction ?? realOptionalAuthAction;

