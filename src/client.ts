/**
 * Mock Safe Action Client
 *
 * Replicates the next-safe-action API with method chaining:
 * client.inputSchema(schema).metadata(metadata).action(handler)
 */

import { z } from 'zod';
import type {
  MockSafeActionClientConfig,
  SafeActionResult,
  Middleware,
  ActionHandler,
} from './types';
import { validateInput, validateOutput } from './validation';
import { handleError } from './error-handler';
import { wrapResult } from './result-wrapper';

/**
 * Builder class for input schema step
 */
class SchemaBuilder<T extends z.ZodType> {
  private _outputSchema?: z.ZodType;

  constructor(
    private schema: T,
    private middlewares: Middleware[],
    private config: Required<MockSafeActionClientConfig>
  ) {}

  /**
   * Add output schema for validation
   * In next-safe-action, this validates the handler return value against the schema.
   * In safemocker, this performs the same validation to catch output bugs in tests.
   */
  outputSchema<TOutputSchema extends z.ZodType>(outputSchema: TOutputSchema): SchemaBuilder<T> {
    this._outputSchema = outputSchema;
    return this;
  }

  /**
   * Add metadata to the action
   */
  metadata(metadata: any): MetadataBuilder<T> {
    return new MetadataBuilder(this.schema, metadata, this.middlewares, this.config, this._outputSchema);
  }

  /**
   * Add action handler (skipping metadata)
   */
  action<TOutput>(
    handler: ActionHandler<z.infer<T>, TOutput, any>
  ): (input: unknown) => Promise<SafeActionResult<TOutput>> {
    return this.createAction(handler, undefined);
  }

  private createAction<TOutput>(
    handler: ActionHandler<z.infer<T>, TOutput, any>,
    metadata: any
  ): (input: unknown) => Promise<SafeActionResult<TOutput>> {
    return async (input: unknown): Promise<SafeActionResult<TOutput>> => {
      try {
        // Step 1: Validate input schema
        const validationResult = validateInput(input, this.schema);
        if (validationResult.success === false) {
          return validationResult.result as SafeActionResult<TOutput>;
        }

        // Step 2: Execute middleware chain
        let context: Record<string, any> = {};
        
        // Build middleware chain
        const middlewareChain = async (index: number, currentCtx: Record<string, any>): Promise<any> => {
          if (index >= this.middlewares.length) {
            // All middleware executed, run handler
            return await handler({
              parsedInput: validationResult.data,
              ctx: currentCtx,
            });
          }

          const middleware = this.middlewares[index];
          const result = await middleware({
            next: async (params?: { ctx?: Record<string, any> }) => {
              // Extract ctx from params (next-safe-action uses { ctx: newContext } format)
              const newCtx = params?.ctx || {};
              // Merge new context with existing context
              const mergedCtx = { ...currentCtx, ...newCtx };
              return middlewareChain(index + 1, mergedCtx);
            },
            ctx: currentCtx,
            metadata,
          });
          
          return result;
        };

        // Execute middleware chain
        const handlerResult = await middlewareChain(0, context);

        // Step 3: Validate output schema if provided
        if (this._outputSchema) {
          const outputValidationResult = validateOutput(handlerResult, this._outputSchema);
          if (outputValidationResult.success === false) {
            return outputValidationResult.result as SafeActionResult<TOutput>;
          }
          // Use validated output
          return wrapResult(outputValidationResult.data) as SafeActionResult<TOutput>;
        }

        // Step 4: Wrap result
        return wrapResult(handlerResult);
      } catch (error) {
        return handleError(error, {
          defaultServerError: this.config.defaultServerError,
          isProduction: this.config.isProduction,
        });
      }
    };
  }
}

/**
 * Builder class for metadata step
 */
class MetadataBuilder<T extends z.ZodType> {
  private _outputSchema?: z.ZodType;

  constructor(
    private schema: T,
    private metadata: any,
    private middlewares: Middleware[],
    private config: Required<MockSafeActionClientConfig>,
    outputSchema?: z.ZodType
  ) {
    this._outputSchema = outputSchema;
  }

  /**
   * Add output schema for validation
   * In next-safe-action, this validates the handler return value against the schema.
   * In safemocker, this performs the same validation to catch output bugs in tests.
   */
  outputSchema<TOutputSchema extends z.ZodType>(outputSchema: TOutputSchema): MetadataBuilder<T> {
    this._outputSchema = outputSchema;
    return this;
  }

  /**
   * Add action handler
   */
  action<TOutput>(
    handler: ActionHandler<z.infer<T>, TOutput, any>
  ): (input: unknown) => Promise<SafeActionResult<TOutput>> {
    return this.createAction(handler);
  }

  private createAction<TOutput>(
    handler: ActionHandler<z.infer<T>, TOutput, any>
  ): (input: unknown) => Promise<SafeActionResult<TOutput>> {
    return async (input: unknown): Promise<SafeActionResult<TOutput>> => {
      try {
        // Step 1: Validate input schema
        const validationResult = validateInput(input, this.schema);
        if (validationResult.success === false) {
          return validationResult.result as SafeActionResult<TOutput>;
        }

        // Step 2: Execute middleware chain
        let context: Record<string, any> = {};
        
        // Build middleware chain
        const middlewareChain = async (index: number, currentCtx: Record<string, any>): Promise<any> => {
          if (index >= this.middlewares.length) {
            // All middleware executed, run handler
            return await handler({
              parsedInput: validationResult.data,
              ctx: currentCtx,
            });
          }

          const middleware = this.middlewares[index];
          const result = await middleware({
            next: async (params?: { ctx?: Record<string, any> }) => {
              // Extract ctx from params (next-safe-action uses { ctx: newContext } format)
              const newCtx = params?.ctx || {};
              // Merge new context with existing context
              const mergedCtx = { ...currentCtx, ...newCtx };
              return middlewareChain(index + 1, mergedCtx);
            },
            ctx: currentCtx,
            metadata: this.metadata,
          });
          
          return result;
        };

        // Execute middleware chain
        const handlerResult = await middlewareChain(0, context);

        // Step 3: Validate output schema if provided
        if (this._outputSchema) {
          const outputValidationResult = validateOutput(handlerResult, this._outputSchema);
          if (outputValidationResult.success === false) {
            return outputValidationResult.result as SafeActionResult<TOutput>;
          }
          // Use validated output
          return wrapResult(outputValidationResult.data) as SafeActionResult<TOutput>;
        }

        // Step 4: Wrap result
        return wrapResult(handlerResult);
      } catch (error) {
        return handleError(error, {
          defaultServerError: this.config.defaultServerError,
          isProduction: this.config.isProduction,
        });
      }
    };
  }
}

/**
 * Mock Safe Action Client
 *
 * Replicates the next-safe-action createSafeActionClient API
 */
export class MockSafeActionClient {
  private middlewares: Middleware[] = [];
  private config: Required<MockSafeActionClientConfig>;

  constructor(config?: MockSafeActionClientConfig) {
    this.config = {
      defaultServerError: config?.defaultServerError || 'Something went wrong',
      isProduction: config?.isProduction ?? false,
      auth: {
        enabled: config?.auth?.enabled ?? true,
        testUserId: config?.auth?.testUserId || 'test-user-id',
        testUserEmail: config?.auth?.testUserEmail || 'test@example.com',
        testAuthToken: config?.auth?.testAuthToken || 'test-token',
      },
    };
  }

  /**
   * Add middleware to the chain
   * 
   * Returns the same instance (this) so middleware can be chained.
   * In next-safe-action, calling .use() on a client returns a new client
   * with the middleware added, but for our mock we modify the existing instance.
   */
  use<TContext extends Record<string, any>>(middleware: Middleware<TContext>): this {
    // Type assertion needed because middleware array accepts any context type
    this.middlewares.push(middleware as Middleware);
    return this;
  }

  /**
   * Define input schema and start method chaining
   */
  inputSchema<T extends z.ZodType>(schema: T): SchemaBuilder<T> {
    return new SchemaBuilder(schema, this.middlewares, this.config);
  }
}

/**
 * Creates a mock safe action client
 *
 * @param config - Configuration options for the mock client
 * @returns Mock safe action client instance
 */
export function createMockSafeActionClient(
  config?: MockSafeActionClientConfig
): MockSafeActionClient {
  return new MockSafeActionClient(config);
}
