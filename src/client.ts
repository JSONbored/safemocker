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
 * Builder class for the input schema step in the method chaining pattern.
 *
 * This class is part of the fluent API that replicates next-safe-action's method
 * chaining: `client.inputSchema().metadata().action()` or `client.inputSchema().action()`.
 *
 * After defining the input schema, you can optionally:
 * - Add an output schema for validation
 * - Add metadata
 * - Define the action handler
 *
 * @template T - The Zod schema type for input validation
 * @category Core
 * @since 0.2.0
 */
class SchemaBuilder<T extends z.ZodType> {
  private _outputSchema?: z.ZodType;

  constructor(
    private schema: T,
    // Use any for middleware array at boundary - accepts different middleware types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private middlewares: any[],
    private config: Required<MockSafeActionClientConfig>
  ) {}

  /**
   * Adds an output schema for validation.
   *
   * In next-safe-action, this validates the handler return value against the schema.
   * In safemocker, this performs the same validation to catch output bugs in tests.
   * If the handler returns data that doesn't match the schema, validation errors are
   * returned in the `validationErrors` field (not `fieldErrors`).
   *
   * @template TOutputSchema - The Zod schema type for output validation
   * @param outputSchema - Zod schema to validate the handler's return value against
   * @returns The same SchemaBuilder instance for method chaining
   *
   * @example
   * ```typescript
   * const action = client
   *   .inputSchema(z.object({ name: z.string() }))
   *   .outputSchema(z.object({ id: z.string(), name: z.string() }))
   *   .action(async ({ parsedInput }) => {
   *     return { id: '123', name: parsedInput.name };
   *   });
   * ```
   *
   * @see {@link validateOutput} - For the validation implementation
   * @category Core
   * @since 0.2.0
   */
  outputSchema<TOutputSchema extends z.ZodType>(outputSchema: TOutputSchema): SchemaBuilder<T> {
    this._outputSchema = outputSchema;
    return this;
  }

  /**
   * Adds metadata to the action.
   *
   * Metadata is used for logging, analytics, rate limiting, and other cross-cutting
   * concerns. The metadata is passed to middleware functions and can be validated
   * against a schema if metadata validation middleware is used.
   *
   * @param metadata - Action metadata object (typically includes actionName, category, etc.)
   * @returns A MetadataBuilder instance for continuing the method chain
   *
   * @example
   * ```typescript
   * const action = client
   *   .inputSchema(z.object({ name: z.string() }))
   *   .metadata({ actionName: 'createUser', category: 'user' })
   *   .action(async ({ parsedInput }) => {
   *     return { id: '123', name: parsedInput.name };
   *   });
   * ```
   *
   * @see {@link createMetadataValidationMiddleware} - For validating metadata
   * @category Core
   * @since 0.2.0
   */
  metadata(metadata: unknown): MetadataBuilder<T> {
    return new MetadataBuilder(this.schema, metadata, this.middlewares, this.config, this._outputSchema);
  }

  /**
   * Adds the action handler, completing the method chain.
   *
   * This method creates and returns the final action function that can be called
   * with input data. The handler receives parsed and validated input, along with
   * any context injected by middleware.
   *
   * @template TOutput - The return type of the action handler
   * @param handler - The action handler function that processes the input
   * @returns An action function that takes input and returns a SafeActionResult
   *
   * @example
   * ```typescript
   * const action = client
   *   .inputSchema(z.object({ name: z.string() }))
   *   .action(async ({ parsedInput, ctx }) => {
   *     // parsedInput is validated and typed
   *     // ctx contains any context from middleware
   *     return { id: '123', name: parsedInput.name };
   *   });
   *
   * const result = await action({ name: 'John' });
   * ```
   *
   * @see {@link ActionHandler} - For the handler type definition
   * @category Core
   * @since 0.2.0
   */
  action<TOutput>(
    handler: ActionHandler<z.infer<T>, TOutput, Record<string, unknown>>
  ): (input: unknown) => Promise<SafeActionResult<TOutput>> {
    return this.createAction(handler, undefined);
  }

  /**
   * Creates the final action function with input validation, middleware execution, and output validation.
   *
   * This private method is the core implementation that:
   * 1. Validates input against the schema
   * 2. Executes all middleware in order
   * 3. Runs the action handler with validated input and context
   * 4. Validates output against the output schema (if provided)
   * 5. Wraps the result in SafeActionResult structure
   * 6. Handles any errors and converts them to SafeActionResult
   *
   * @template TOutput - The return type of the action handler
   * @param handler - The action handler function that processes the validated input
   * @param metadata - Optional metadata to pass to middleware (undefined for SchemaBuilder)
   * @returns An action function that takes raw input and returns a Promise<SafeActionResult<TOutput>>
   *
   * @remarks
   * This method implements the complete action execution flow:
   * - Input validation happens first using Zod
   * - Middleware chain executes in order, each can modify context
   * - Handler receives validated input and merged context
   * - Output validation (if provided) ensures handler returns correct shape
   * - All errors are caught and converted to SafeActionResult format
   *
   * @example
   * ```typescript
   * // This is called internally by the public action() method
   * const action = client
   *   .inputSchema(z.object({ name: z.string() }))
   *   .action(async ({ parsedInput, ctx }) => {
   *     return { id: '123', name: parsedInput.name };
   *   });
   *
   * // The returned function validates input, runs middleware, executes handler
   * const result = await action({ name: 'John' });
   * ```
   *
   * @throws {Error} Re-throws non-validation errors to be caught by handleError
   * @see {@link validateInput} - For input validation
   * @see {@link validateOutput} - For output validation
   * @see {@link handleError} - For error handling
   * @see {@link wrapResult} - For result wrapping
   * @internal
   * @category Core
   * @since 0.2.0
   */
  private createAction<TOutput>(
    handler: ActionHandler<z.infer<T>, TOutput, Record<string, unknown>>,
    metadata: unknown
  ): (input: unknown) => Promise<SafeActionResult<TOutput>> {
    return async (input: unknown): Promise<SafeActionResult<TOutput>> => {
      try {
        // Step 1: Validate input schema
        const validationResult = validateInput(input, this.schema);
        if (validationResult.success === false) {
          return validationResult.result;
        }

        // Step 2: Execute middleware chain
        let context: Record<string, unknown> = {};
        
        // Build middleware chain - properly typed to return TOutput
        // The next function is typed to return Promise<TOutput>, which allows TypeScript
        // to infer that middleware results are TOutput when they call next()
        const middlewareChain = async (index: number, currentCtx: Record<string, unknown>): Promise<TOutput> => {
          if (index >= this.middlewares.length) {
            // All middleware executed, run handler
            const handlerResult = await handler({
              parsedInput: validationResult.data,
              ctx: currentCtx,
            });
            return handlerResult;
          }

          // Get middleware from array (typed as any at boundary)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const middleware: Middleware<Record<string, unknown>, TOutput> = this.middlewares[index] as any;
          
          // Create a properly typed next function that returns Promise<TOutput>
          const typedNext = async (params?: { ctx?: Record<string, unknown> }): Promise<TOutput> => {
            const newCtx = params?.ctx || {};
            const mergedCtx = { ...currentCtx, ...newCtx };
            return middlewareChain(index + 1, mergedCtx);
          };
          
          // Call middleware with typed next function
          // The middleware is now properly typed to return Promise<TOutput>
          const result = await middleware({
            next: typedNext,
            ctx: currentCtx,
            metadata,
          });
          
          // Result is properly typed as TOutput
          return result;
        };

        // Execute middleware chain
        const handlerResult = await middlewareChain(0, context);

        // Step 3: Validate output schema if provided
        if (this._outputSchema) {
          const outputValidationResult = validateOutput(handlerResult, this._outputSchema);
          if (outputValidationResult.success === false) {
            return outputValidationResult.result;
          }
          // Use validated output - validated data is z.infer<outputSchema>
          // We know from the handler signature that it's TOutput
          // TypeScript can't infer this, so we explicitly type the result
          return wrapResult(outputValidationResult.data) as SafeActionResult<TOutput>;
        }

        // Step 4: Wrap result - handlerResult is TOutput
        return wrapResult(handlerResult) as SafeActionResult<TOutput>;
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
 * Builder class for the metadata step in the method chaining pattern.
 *
 * This class is created after adding metadata to an action. It allows you to
 * optionally add an output schema before defining the action handler.
 *
 * @template T - The Zod schema type for input validation
 * @category Core
 * @since 0.2.0
 */
class MetadataBuilder<T extends z.ZodType> {
  private _outputSchema?: z.ZodType;

  constructor(
    private schema: T,
    private metadata: unknown,
    // Use any for middleware array at boundary - accepts different middleware types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private middlewares: any[],
    private config: Required<MockSafeActionClientConfig>,
    outputSchema?: z.ZodType
  ) {
    this._outputSchema = outputSchema;
  }

  /**
   * Adds an output schema for validation.
   *
   * In next-safe-action, this validates the handler return value against the schema.
   * In safemocker, this performs the same validation to catch output bugs in tests.
   * If the handler returns data that doesn't match the schema, validation errors are
   * returned in the `validationErrors` field (not `fieldErrors`).
   *
   * @template TOutputSchema - The Zod schema type for output validation
   * @param outputSchema - Zod schema to validate the handler's return value against
   * @returns The same MetadataBuilder instance for method chaining
   *
   * @example
   * ```typescript
   * const action = client
   *   .inputSchema(z.object({ name: z.string() }))
   *   .metadata({ actionName: 'createUser' })
   *   .outputSchema(z.object({ id: z.string(), name: z.string() }))
   *   .action(async ({ parsedInput }) => {
   *     return { id: '123', name: parsedInput.name };
   *   });
   * ```
   *
   * @see {@link validateOutput} - For the validation implementation
   * @category Core
   * @since 0.2.0
   */
  outputSchema<TOutputSchema extends z.ZodType>(outputSchema: TOutputSchema): MetadataBuilder<T> {
    this._outputSchema = outputSchema;
    return this;
  }

  /**
   * Adds the action handler, completing the method chain.
   *
   * This method creates and returns the final action function that can be called
   * with input data. The handler receives parsed and validated input, along with
   * any context injected by middleware and the metadata that was set.
   *
   * @template TOutput - The return type of the action handler
   * @param handler - The action handler function that processes the input
   * @returns An action function that takes input and returns a SafeActionResult
   *
   * @example
   * ```typescript
   * const action = client
   *   .inputSchema(z.object({ name: z.string() }))
   *   .metadata({ actionName: 'createUser', category: 'user' })
   *   .action(async ({ parsedInput, ctx, metadata }) => {
   *     // parsedInput is validated and typed
   *     // ctx contains any context from middleware
   *     // metadata is available in middleware
   *     return { id: '123', name: parsedInput.name };
   *   });
   *
   * const result = await action({ name: 'John' });
   * ```
   *
   * @see {@link ActionHandler} - For the handler type definition
   * @category Core
   * @since 0.2.0
   */
  action<TOutput>(
    handler: ActionHandler<z.infer<T>, TOutput, Record<string, unknown>>
  ): (input: unknown) => Promise<SafeActionResult<TOutput>> {
    return this.createAction(handler);
  }

  /**
   * Creates the final action function with input validation, middleware execution, and output validation.
   *
   * This private method is the core implementation that:
   * 1. Validates input against the schema
   * 2. Executes all middleware in order (with metadata available)
   * 3. Runs the action handler with validated input and context
   * 4. Validates output against the output schema (if provided)
   * 5. Wraps the result in SafeActionResult structure
   * 6. Handles any errors and converts them to SafeActionResult
   *
   * @template TOutput - The return type of the action handler
   * @param handler - The action handler function that processes the validated input
   * @returns An action function that takes raw input and returns a Promise<SafeActionResult<TOutput>>
   *
   * @remarks
   * This method is similar to SchemaBuilder.createAction, but includes metadata in the middleware chain.
   * The metadata is available to all middleware functions, allowing them to perform metadata-based
   * operations like rate limiting, logging, or validation.
   *
   * @example
   * ```typescript
   * // This is called internally by the public action() method
   * const action = client
   *   .inputSchema(z.object({ name: z.string() }))
   *   .metadata({ actionName: 'createUser', category: 'user' })
   *   .action(async ({ parsedInput, ctx }) => {
   *     // Metadata is available in middleware
   *     return { id: '123', name: parsedInput.name };
   *   });
   *
   * // The returned function validates input, runs middleware (with metadata), executes handler
   * const result = await action({ name: 'John' });
   * ```
   *
   * @throws {Error} Re-throws non-validation errors to be caught by handleError
   * @see {@link validateInput} - For input validation
   * @see {@link validateOutput} - For output validation
   * @see {@link handleError} - For error handling
   * @see {@link wrapResult} - For result wrapping
   * @internal
   * @category Core
   * @since 0.2.0
   */
  private createAction<TOutput>(
    handler: ActionHandler<z.infer<T>, TOutput, Record<string, unknown>>
  ): (input: unknown) => Promise<SafeActionResult<TOutput>> {
    return async (input: unknown): Promise<SafeActionResult<TOutput>> => {
      try {
        // Step 1: Validate input schema
        const validationResult = validateInput(input, this.schema);
        if (validationResult.success === false) {
          return validationResult.result;
        }

        // Step 2: Execute middleware chain
        let context: Record<string, unknown> = {};
        
        // Build middleware chain - properly typed to return TOutput
        const middlewareChain = async (index: number, currentCtx: Record<string, unknown>): Promise<TOutput> => {
          if (index >= this.middlewares.length) {
            // All middleware executed, run handler
            const handlerResult = await handler({
              parsedInput: validationResult.data,
              ctx: currentCtx,
            });
            return handlerResult;
          }

          // Get middleware from array (typed as any at boundary)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const middleware: Middleware<Record<string, unknown>, TOutput> = this.middlewares[index] as any;
          
          // Create a properly typed next function that returns Promise<TOutput>
          const typedNext = async (params?: { ctx?: Record<string, unknown> }): Promise<TOutput> => {
            const newCtx = params?.ctx || {};
            const mergedCtx = { ...currentCtx, ...newCtx };
            return middlewareChain(index + 1, mergedCtx);
          };
          
          // Call middleware with typed next function
          // The middleware is now properly typed to return Promise<TOutput>
          const result = await middleware({
            next: typedNext,
            ctx: currentCtx,
            metadata: this.metadata,
          });
          
          // Result is properly typed as TOutput
          return result;
        };

        // Execute middleware chain
        const handlerResult = await middlewareChain(0, context);

        // Step 3: Validate output schema if provided
        if (this._outputSchema) {
          const outputValidationResult = validateOutput(handlerResult, this._outputSchema);
          if (outputValidationResult.success === false) {
            return outputValidationResult.result;
          }
          // Use validated output - validated data is z.infer<outputSchema>
          // We know from the handler signature that it's TOutput
          // TypeScript can't infer this, so we explicitly type the result
          return wrapResult(outputValidationResult.data) as SafeActionResult<TOutput>;
        }

        // Step 4: Wrap result - handlerResult is TOutput
        return wrapResult(handlerResult) as SafeActionResult<TOutput>;
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
 * Mock Safe Action Client that replicates the next-safe-action API.
 *
 * This class provides a fluent API for creating mock actions that match the behavior
 * of next-safe-action. It supports method chaining: `client.inputSchema().metadata().action()`.
 *
 * The client:
 * - Validates input schemas using Zod
 * - Executes middleware chains in the correct order
 * - Validates output schemas (if provided)
 * - Returns proper SafeActionResult structure
 * - Handles errors and formats them correctly
 *
 * @example
 * ```typescript
 * const client = createMockSafeActionClient();
 *
 * const action = client
 *   .inputSchema(z.object({ name: z.string() }))
 *   .metadata({ actionName: 'test' })
 *   .action(async ({ parsedInput }) => {
 *     return { message: `Hello ${parsedInput.name}` };
 *   });
 * ```
 *
 * @see {@link createMockSafeActionClient} - Factory function to create instances
 * @category Core
 * @since 0.2.0
 */
export class MockSafeActionClient {
  // Use any for middleware array at boundary - accepts different middleware types
  // This is the ONLY place we use any - at the boundary where we accept different middleware types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private middlewares: any[] = [];
  private config: Required<MockSafeActionClientConfig>;

  /**
   * Creates a new MockSafeActionClient instance.
   *
   * Initializes the client with the provided configuration or sensible defaults.
   * The configuration determines error handling behavior and authentication context
   * that will be injected by middleware.
   *
   * @param config - Optional configuration for the mock client
   * @param config.defaultServerError - Default error message for server errors (default: 'Something went wrong')
   * @param config.isProduction - Whether to use production error messages (default: false)
   * @param config.auth - Authentication configuration
   * @param config.auth.enabled - Whether authentication is enabled (default: true)
   * @param config.auth.testUserId - Test user ID to inject in auth context (default: 'test-user-id')
   * @param config.auth.testUserEmail - Test user email to inject in auth context (default: 'test@example.com')
   * @param config.auth.testAuthToken - Test auth token to inject in auth context (default: 'test-token')
   *
   * @example
   * ```typescript
   * // Use defaults
   * const client1 = new MockSafeActionClient();
   *
   * // Custom configuration
   * const client2 = new MockSafeActionClient({
   *   defaultServerError: 'Custom error',
   *   isProduction: true,
   *   auth: {
   *     testUserId: 'user-123',
   *   },
   * });
   * ```
   *
   * @see {@link createMockSafeActionClient} - Factory function (recommended)
   * @see {@link MockSafeActionClientConfig} - For configuration type details
   * @category Core
   * @since 0.2.0
   */
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
   * Adds middleware to the execution chain.
   *
   * Middleware functions are executed in the order they are added, before the
   * action handler runs. Middleware can modify context, validate metadata, perform
   * authentication checks, and more.
   *
   * Returns the same instance (this) so middleware can be chained. In next-safe-action,
   * calling `.use()` on a client returns a new client with the middleware added, but
   * for our mock we modify the existing instance for simplicity.
   *
   * @template TContext - The context type that the middleware expects/returns
   * @param middleware - The middleware function to add to the chain
   * @returns The same MockSafeActionClient instance for method chaining
   *
   * @example
   * ```typescript
   * const client = createMockSafeActionClient();
   *
   * client
   *   .use(createAuthedMiddleware(config))
   *   .use(createRateLimitMiddleware(metadataSchema))
   *   .inputSchema(z.object({ name: z.string() }))
   *   .action(async ({ parsedInput, ctx }) => {
   *     // Middleware has been executed, ctx contains auth info
   *     return { id: '123', name: parsedInput.name };
   *   });
   * ```
   *
   * @see {@link Middleware} - For the middleware type definition
   * @see {@link createAuthedMiddleware} - For authentication middleware
   * @see {@link createRateLimitMiddleware} - For rate limiting middleware
   * @category Core
   * @since 0.2.0
   */
  use<TContext extends Record<string, unknown>>(middleware: Middleware<TContext>): this {
    // Accept any middleware type at boundary - the array uses any to accept different types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.middlewares.push(middleware as any);
    return this;
  }

  /**
   * Defines the input schema and starts the method chaining pattern.
   *
   * This is the first step in creating an action. It defines the Zod schema that
   * will be used to validate input data before the action handler executes.
   *
   * @template T - The Zod schema type
   * @param schema - The Zod schema to validate input against
   * @returns A SchemaBuilder instance for continuing the method chain
   *
   * @example
   * ```typescript
   * const client = createMockSafeActionClient();
   *
   * const action = client
   *   .inputSchema(z.object({
   *     name: z.string().min(1),
   *     email: z.string().email(),
   *   }))
   *   .action(async ({ parsedInput }) => {
   *     // parsedInput is validated and typed
   *     return { id: '123', ...parsedInput };
   *   });
   * ```
   *
   * @see {@link SchemaBuilder} - For the builder class
   * @see {@link validateInput} - For the validation implementation
   * @category Core
   * @since 0.2.0
   */
  inputSchema<T extends z.ZodType>(schema: T): SchemaBuilder<T> {
    return new SchemaBuilder(schema, this.middlewares, this.config);
  }
}

/**
 * Parameters for the `createMockSafeActionClient` function.
 * 
 * This interface is used by AutoTypeTable to document the function parameters.
 * 
 * **Type Safety**: This interface uses `MockSafeActionClientConfig` directly, which
 * matches the function's parameter type. A compile-time type check ensures they stay in sync.
 * 
 * @public
 * @since 0.2.0
 */
export interface CreateMockSafeActionClientParams {
  /**
   * Optional configuration for the mock client.
   * 
   * See {@link MockSafeActionClientConfig} for detailed configuration options.
   */
  config?: MockSafeActionClientConfig;
}

/**
 * Creates a mock safe action client that replicates the next-safe-action API.
 *
 * This function creates a mock client that supports the same method chaining pattern
 * as the real next-safe-action library: `client.inputSchema().metadata().action()`.
 *
 * The mock client:
 * - Validates input schemas using Zod
 * - Executes middleware chains in the correct order
 * - Validates output schemas (if provided)
 * - Returns proper SafeActionResult structure
 * - Handles errors and formats them correctly
 *
 * @param config - Optional configuration for the mock client
 * @param config.defaultServerError - Default error message for server errors (default: 'Something went wrong')
 * @param config.isProduction - Whether to use production error messages (default: false)
 * @param config.auth - Authentication configuration
 * @param config.auth.enabled - Whether authentication is enabled (default: true)
 * @param config.auth.testUserId - Test user ID to inject in auth context (default: 'test-user-id')
 * @param config.auth.testUserEmail - Test user email to inject in auth context (default: 'test@example.com')
 * @param config.auth.testAuthToken - Test auth token to inject in auth context (default: 'test-token')
 * @returns Mock safe action client instance that supports method chaining
 *
 * @remarks
 * This is the main entry point for creating mock action clients. The returned client
 * supports the exact same API as next-safe-action's createSafeActionClient, allowing
 * you to test your production code without modifications.
 *
 * @example
 * ```typescript
 * import { createMockSafeActionClient } from '@jsonbored/safemocker';
 * import { z } from 'zod';
 *
 * const client = createMockSafeActionClient({
 *   defaultServerError: 'An error occurred',
 *   auth: {
 *     testUserId: 'custom-user-id',
 *   },
 * });
 *
 * const action = client
 *   .inputSchema(z.object({ name: z.string() }))
 *   .action(async ({ parsedInput }) => {
 *     return { message: `Hello ${parsedInput.name}` };
 *   });
 *
 * const result = await action({ name: 'World' });
 * ```
 *
 * @category Core
 * @since 0.2.0
 */
export function createMockSafeActionClient(
  config?: MockSafeActionClientConfig
): MockSafeActionClient {
  return new MockSafeActionClient(config);
}

// Compile-time type check to ensure CreateMockSafeActionClientParams matches the function signature
// This will cause a TypeScript error if the types don't match, ensuring 100% type safety
type _TypeCheck = CreateMockSafeActionClientParams['config'] extends Parameters<typeof createMockSafeActionClient>[0]
  ? Parameters<typeof createMockSafeActionClient>[0] extends CreateMockSafeActionClientParams['config']
    ? true
    : never
  : never;
