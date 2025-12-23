import type { z } from 'zod';

/**
 * SafeActionResult structure returned by next-safe-action
 */
export interface SafeActionResult<TData> {
  data?: TData;
  serverError?: string;
  fieldErrors?: Record<string, string[]>;
  validationErrors?: Record<string, string[]>;
}

/**
 * Configuration for mock safe action client
 */
export interface MockSafeActionClientConfig {
  defaultServerError?: string;
  isProduction?: boolean;
  auth?: {
    enabled?: boolean;
    testUserId?: string;
    testUserEmail?: string;
    testAuthToken?: string;
  };
}

/**
 * Middleware function type
 * 
 * Matches next-safe-action's middleware signature:
 * - next() accepts { ctx: newContext } to merge/add to context
 * - ctx is the current context (may be undefined initially)
 * - metadata is optional action metadata
 */
export type Middleware<TContext extends Record<string, any> = {}> = (params: {
  next: (params?: { ctx?: Record<string, any> }) => Promise<any>;
  ctx?: TContext;
  metadata?: any;
}) => Promise<any>;

/**
 * Action handler function type
 */
export type ActionHandler<TInput, TOutput, TContext extends Record<string, any> = {}> = (params: {
  parsedInput: TInput;
  ctx: TContext;
}) => Promise<TOutput>;

