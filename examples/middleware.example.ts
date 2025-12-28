/**
 * Custom Middleware Example
 *
 * This example demonstrates how to create and use custom middleware
 * with safemocker to add custom context and behavior to actions.
 *
 * **Framework Support:**
 * - **Jest**: Import from `@jsonbored/safemocker/jest`
 * - **Vitest**: Import from `@jsonbored/safemocker/vitest`
 *
 * Jest:
 * ```typescript
 * import { createMockSafeActionClient } from '@jsonbored/safemocker/jest';
 * ```
 *
 * Vitest:
 * ```typescript
 * import { createMockSafeActionClient } from '@jsonbored/safemocker/vitest';
 * ```
 *
 * All other code remains identical between Jest and Vitest.
 *
 * @example
 * ```bash
 * # Run this example
 * npx tsx examples/middleware.example.ts
 * ```
 */

import { createMockSafeActionClient } from '@jsonbored/safemocker/jest';
import type { Middleware } from '@jsonbored/safemocker';
import { z } from 'zod';
import type { InferSafeActionFnResult } from 'next-safe-action';

// Create a base client
const client = createMockSafeActionClient();

// Example 1: Simple logging middleware
const loggingMiddleware: Middleware = async ({ next, metadata }) => {
  const actionName = metadata?.actionName ?? 'unknown';
  console.log(`[Middleware] Action ${actionName} started`);
  
  const result = await next();
  
  console.log(`[Middleware] Action ${actionName} completed`);
  return result;
};

// Example 2: Context injection middleware
interface RequestContext {
  requestId: string;
  timestamp: number;
  userAgent?: string;
}

const requestContextMiddleware: Middleware<RequestContext> = async ({ next, ctx = {} }) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();
  
  return next({
    ctx: {
      ...ctx,
      requestId,
      timestamp,
      userAgent: 'example-user-agent',
    },
  });
};

// Example 3: Performance tracking middleware
const performanceMiddleware: Middleware = async ({ next }) => {
  const startTime = performance.now();
  
  const result = await next();
  
  const duration = performance.now() - startTime;
  console.log(`[Performance] Action took ${duration.toFixed(2)}ms`);
  
  return result;
};

// Example 4: Error handling middleware
const errorHandlingMiddleware: Middleware = async ({ next, metadata }) => {
  try {
    return await next();
  } catch (error) {
    const actionName = metadata?.actionName ?? 'unknown';
    console.error(`[Error] Action ${actionName} failed:`, error);
    throw error; // Re-throw to let safemocker handle it
  }
};

// Create an action with multiple middleware
const createItem = client
  .use(loggingMiddleware)
  .use(requestContextMiddleware)
  .use(performanceMiddleware)
  .use(errorHandlingMiddleware)
  .inputSchema(
    z.object({
      name: z.string().min(1),
      description: z.string().min(10),
    })
  )
  .metadata({ actionName: 'createItem', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    // Type guard to ensure ctx has RequestContext properties
    // In a real application, you would use proper type inference from middleware
    const hasRequestContext = (
      value: Record<string, unknown>
    ): value is RequestContext => {
      return (
        typeof value.requestId === 'string' &&
        typeof value.timestamp === 'number'
      );
    };

    // ctx now includes requestId, timestamp, userAgent from requestContextMiddleware
    if (!hasRequestContext(ctx)) {
      throw new Error('Request context is missing required properties');
    }

    return {
      id: `item-${Date.now()}`,
      name: parsedInput.name,
      description: parsedInput.description,
      requestId: ctx.requestId,
      timestamp: ctx.timestamp,
    };
  });

// Example usage
async function main() {
  console.log('=== Custom Middleware Example ===\n');

  const result = await createItem({
    name: 'Example Item',
    description: 'This is an example item with enough characters.',
  });

  type CreateItemResult = InferSafeActionFnResult<typeof createItem>;
  const typedResult: CreateItemResult = result;

  if (typedResult.data) {
    console.log('\n✅ Item created successfully:');
    console.log(`   - ID: ${typedResult.data.id}`);
    console.log(`   - Name: ${typedResult.data.name}`);
    console.log(`   - Request ID: ${typedResult.data.requestId}`);
    console.log(`   - Timestamp: ${typedResult.data.timestamp}`);
  }

  console.log('\n=== Example Complete ===');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createItem, loggingMiddleware, requestContextMiddleware, performanceMiddleware, errorHandlingMiddleware };

