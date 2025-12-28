import type { z } from 'zod';

/**
 * SafeActionResult structure returned by next-safe-action.
 *
 * This interface matches the exact structure returned by the real next-safe-action library.
 * In tests, safemocker ensures this structure is always returned, making it type-safe to access
 * all properties without type assertions.
 *
 * @template TData - The type of data returned on success. This is typically inferred from
 *   the output schema or the handler's return type. Can be any type including primitives,
 *   objects, arrays, or complex nested structures.
 *
 * @remarks
 * Unlike the real next-safe-action library, safemocker explicitly includes `fieldErrors` in the
 * type definition, ensuring 100% type safety in tests. You can access `fieldErrors` without
 * type assertions or type guards, making tests cleaner and more reliable.
 *
 * **Mutual Exclusivity**: Only one of `data`, `fieldErrors`, or `serverError` will be defined
 * in a result. If validation fails, `fieldErrors` is set. If the handler throws, `serverError`
 * is set. If everything succeeds, `data` is set.
 *
 * @example
 * ```typescript
 * // Simple result with primitive data
 * const result1: SafeActionResult<string> = await myAction({});
 * if (result1.data) {
 *   console.log(result1.data); // string
 * }
 *
 * // Result with object data
 * const result2: SafeActionResult<{ id: string; name: string }> = await myAction({});
 * if (result2.data) {
 *   console.log(result2.data.id); // string
 *   console.log(result2.data.name); // string
 * }
 *
 * // Handling validation errors
 * if (result2.fieldErrors) {
 *   // Type-safe access to field errors
 *   const nameErrors = result2.fieldErrors.name; // string[] | undefined
 *   if (nameErrors) {
 *     console.log('Name errors:', nameErrors);
 *   }
 * }
 *
 * // Handling server errors
 * if (result2.serverError) {
 *   console.error('Server error:', result2.serverError);
 * }
 * ```
 *
 * @see {@link InferSafeActionFnResult} - For inferring this type from action functions
 * @see {@link wrapResult} - For wrapping successful results
 * @see {@link wrapError} - For wrapping error results
 * @see {@link wrapValidationErrors} - For wrapping validation error results
 * @category Types
 * @since 0.2.0
 */
export interface SafeActionResult<TData> {
  /** 
   * Success data returned by the action handler. 
   * 
   * Only defined when the action succeeds. The type `TData` is inferred from the handler's
   * return type or the output schema. This is the primary success path - when `data` is
   * present, the action completed successfully.
   * 
   * @example
   * ```typescript
   * const result = await myAction({ name: 'John' });
   * if (result.data) {
   *   console.log('Success:', result.data); // TData
   * }
   * ```
   */
  data?: TData;
  /** 
   * Server error message if the action threw an error. 
   * 
   * Only defined when an unhandled error occurs. This represents server-side errors like
   * database failures, network issues, or unexpected exceptions. The message format
   * depends on `isProduction` config - production mode uses generic messages.
   * 
   * @example
   * ```typescript
   * const result = await myAction({ name: 'John' });
   * if (result.serverError) {
   *   console.error('Server error:', result.serverError); // string
   * }
   * ```
   * 
   * @see {@link handleError} - For error handling implementation
   */
  serverError?: string;
  /** 
   * Validation errors by field name (from input schema validation). 
   * 
   * Only defined when validation fails. The keys are field names (or dot-notation paths
   * for nested fields), and values are arrays of error messages for that field. This
   * allows displaying field-specific validation errors to users.
   * 
   * @example
   * ```typescript
   * const result = await myAction({ name: '', email: 'invalid' });
   * if (result.fieldErrors) {
   *   // { name: ['String must contain at least 1 character(s)'], email: ['Invalid email'] }
   *   console.log('Name errors:', result.fieldErrors.name); // string[] | undefined
   *   console.log('Email errors:', result.fieldErrors.email); // string[] | undefined
   * }
   * ```
   * 
   * @see {@link validateInput} - For input validation implementation
   */
  fieldErrors?: Record<string, string[]>;
  /** 
   * General validation errors (legacy field, same as fieldErrors). 
   * 
   * Maintained for compatibility with older code. In practice, this is the same as
   * `fieldErrors` and is populated with the same data. Prefer using `fieldErrors`
   * for new code.
   * 
   * @deprecated Use `fieldErrors` instead. This field is maintained for backward compatibility.
   * 
   * @see {@link fieldErrors} - For the preferred field
   */
  validationErrors?: Record<string, string[]>;
}

/**
 * Wrapper interface for documenting SafeActionResult with AutoTypeTable.
 * 
 * This interface demonstrates a concrete example of SafeActionResult using
 * `{ id: string; name: string }` as the data type. The actual `SafeActionResult`
 * type is generic and can accept any data type.
 * 
 * **Note**: The actual `SafeActionResult` type is generic:
 * ```typescript
 * interface SafeActionResult<TData>
 * ```
 * 
 * This interface uses a concrete data type (`{ id: string; name: string }`) to provide
 * a complete, type-safe example of the result structure. In practice, `TData` can be
 * any type including primitives, objects, arrays, or complex nested structures.
 * 
 * @internal
 * @see {@link SafeActionResult} - For the actual generic interface
 */
export interface SafeActionResultType {
  /**
   * Success data returned by the action handler.
   * 
   * Only defined when the action succeeds. In the generic `SafeActionResult<TData>` type,
   * this is `TData` which is inferred from the handler's return type or the output schema.
   * 
   * This example uses `{ id: string; name: string }` as a concrete demonstration.
   * 
   * @example
   * ```typescript
   * const result: SafeActionResult<{ id: string; name: string }> = await myAction({});
   * if (result.data) {
   *   console.log(result.data.id); // string
   *   console.log(result.data.name); // string
   * }
   * ```
   */
  data?: { id: string; name: string };
  /**
   * Server error message if the action threw an error.
   * 
   * Only defined when an unhandled error occurs. This represents server-side errors like
   * database failures, network issues, or unexpected exceptions. The message format
   * depends on `isProduction` config - production mode uses generic messages.
   * 
   * @example
   * ```typescript
   * const result = await myAction({ name: 'John' });
   * if (result.serverError) {
   *   console.error('Server error:', result.serverError); // string
   * }
   * ```
   */
  serverError?: string;
  /**
   * Validation errors by field name (from input schema validation).
   * 
   * Only defined when validation fails. The keys are field names (or dot-notation paths
   * for nested fields), and values are arrays of error messages for that field. This
   * allows displaying field-specific validation errors to users.
   * 
   * @example
   * ```typescript
   * const result = await myAction({ name: '', email: 'invalid' });
   * if (result.fieldErrors) {
   *   // { name: ['String must contain at least 1 character(s)'], email: ['Invalid email'] }
   *   console.log('Name errors:', result.fieldErrors.name); // string[] | undefined
   *   console.log('Email errors:', result.fieldErrors.email); // string[] | undefined
   * }
   * ```
   */
  fieldErrors?: Record<string, string[]>;
  /**
   * General validation errors (legacy field, same as fieldErrors).
   * 
   * Maintained for compatibility with older code. In practice, this is the same as
   * `fieldErrors` and is populated with the same data. Prefer using `fieldErrors`
   * for new code.
   * 
   * @deprecated Use `fieldErrors` instead. This field is maintained for backward compatibility.
   */
  validationErrors?: Record<string, string[]>;
}

/**
 * Configuration options for creating a mock safe action client.
 *
 * This configuration allows you to customize the behavior of the mock client to match
 * your testing needs. All fields are optional and have sensible defaults.
 *
 * @example
 * ```typescript
 * // Minimal configuration (uses all defaults)
 * const client1 = createMockSafeActionClient();
 *
 * // Custom error message
 * const client2 = createMockSafeActionClient({
 *   defaultServerError: 'Custom error message',
 * });
 *
 * // Production mode (generic errors)
 * const client3 = createMockSafeActionClient({
 *   isProduction: true,
 * });
 *
 * // Full configuration with auth
 * const config: MockSafeActionClientConfig = {
 *   defaultServerError: 'An error occurred',
 *   isProduction: false,
 *   auth: {
 *     enabled: true,
 *     testUserId: 'user-123',
 *     testUserEmail: 'user@example.com',
 *     testAuthToken: 'custom-token',
 *   },
 * };
 * const client4 = createMockSafeActionClient(config);
 * ```
 *
 * @see {@link createMockSafeActionClient} - For creating a client with this configuration
 * @see {@link MockSafeActionClient} - For the client class that uses this configuration
 * @category Types
 * @since 0.2.0
 */
export interface MockSafeActionClientConfig {
  /** 
   * Default error message for server errors when an unhandled exception occurs.
   * 
   * @default 'Something went wrong'
   */
  defaultServerError?: string;
  /** 
   * Whether to use production error messages (generic vs detailed).
   * 
   * When `true`, error messages are generic to avoid leaking implementation details.
   * When `false`, error messages include more detail for debugging.
   * 
   * @default false
   */
  isProduction?: boolean;
  /** 
   * Authentication configuration for testing authenticated actions.
   * 
   * When enabled, the mock client will inject auth context into action handlers,
   * allowing you to test actions that require authentication without setting up
   * a real auth system.
   */
  auth?: {
    /** 
     * Whether authentication is enabled. When enabled, auth context is automatically
     * injected into action handlers.
     * 
     * @default true
     */
    enabled?: boolean;
    /** 
     * Test user ID to inject in auth context. This will be available as `ctx.userId`
     * in action handlers.
     * 
     * @default 'test-user-id'
     */
    testUserId?: string;
    /** 
     * Test user email to inject in auth context. This will be available as `ctx.userEmail`
     * in action handlers.
     * 
     * @default 'test@example.com'
     */
    testUserEmail?: string;
    /** 
     * Test auth token to inject in auth context. This will be available as `ctx.authToken`
     * in action handlers.
     * 
     * @default 'test-token'
     */
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
 *
 * @template TContext - The context type that the middleware expects/returns. Must extend `Record<string, unknown>`.
 *   Defaults to `Record<string, unknown>` for middleware that doesn't require specific context types.
 *   The context type determines what properties are available in `ctx` and what can be passed to `next({ ctx })`.
 * @template TReturn - The return type of the middleware chain. This is typically inferred from the action handler's
 *   return type. Defaults to `unknown` but should match the handler's output type for proper type inference.
 *
 * @remarks
 * Middleware functions are executed in the order they are added using `.use()`. Each middleware can:
 * - Modify the context by calling `next({ ctx: newContext })`, which merges the new context with existing context
 * - Access and validate metadata
 * - Perform side effects (logging, rate limiting, etc.)
 * - Throw errors that will be caught and converted to SafeActionResult
 *
 * The `next` function returns a Promise that resolves to the final handler result, allowing middleware to:
 * - Transform the result before returning
 * - Add logging or monitoring
 * - Handle errors
 *
 * @example
 * ```typescript
 * // Simple middleware without context
 * const loggingMiddleware: Middleware = async ({ next }) => {
 *   console.log('Action called');
 *   return next();
 * };
 *
 * // Middleware with typed context
 * interface AuthContext {
 *   userId: string;
 *   userEmail: string;
 * }
 *
 * const authMiddleware: Middleware<AuthContext> = async ({ next, ctx }) => {
 *   const newCtx: AuthContext = {
 *     userId: 'user-123',
 *     userEmail: 'user@example.com',
 *   };
 *   return next({ ctx: newCtx });
 * };
 *
 * // Middleware that transforms the result
 * const transformMiddleware: Middleware<Record<string, unknown>, { id: string }> = async ({ next }) => {
 *   const result = await next();
 *   return { id: result.id.toUpperCase() };
 * };
 * ```
 *
 * @see {@link createAuthedMiddleware} - For creating authentication middleware
 * @see {@link createRateLimitMiddleware} - For creating rate limiting middleware
 * @see {@link createMetadataValidationMiddleware} - For creating metadata validation middleware
 * @see {@link ActionHandler} - For the handler type that receives the context
 * @category Types
 * @since 0.2.0
 */
export type Middleware<TContext extends Record<string, unknown> = Record<string, unknown>, TReturn = unknown> = (params: {
  next: (params?: { ctx?: Record<string, unknown> }) => Promise<TReturn>;
  ctx?: TContext;
  metadata?: unknown;
}) => Promise<TReturn>;

/**
 * Wrapper interface for documenting Middleware function type with AutoTypeTable.
 * 
 * This interface exposes the Middleware function parameters as object properties,
 * allowing AutoTypeTable to properly extract and document the function signature.
 * Uses concrete types to demonstrate the full type signature while maintaining
 * type safety through the generic Middleware type.
 * 
 * **Note**: The actual `Middleware` type is generic:
 * ```typescript
 * type Middleware<TContext extends Record<string, unknown> = Record<string, unknown>, TReturn = unknown>
 * ```
 * 
 * This interface uses concrete types (`Record<string, unknown>` for context and
 * `SafeActionResult<{ id: string }>` for return type) to provide a complete,
 * type-safe example of the middleware signature.
 * 
 * @internal
 * @see {@link Middleware} - For the actual generic function type
 */
export interface MiddlewareType {
  /**
   * Function to call the next middleware in the chain or the action handler.
   * 
   * Accepts an optional context object that will be merged with the current context.
   * Returns a Promise that resolves to the final handler result.
   * 
   * In the generic `Middleware` type, this returns `Promise<TReturn>` where `TReturn`
   * is the return type of the middleware chain (typically `SafeActionResult<TData>`).
   */
  next: (params?: { ctx?: Record<string, unknown> }) => Promise<SafeActionResult<{ id: string }>>;
  /**
   * Current context from previous middleware (may be undefined initially).
   * 
   * This is the merged context from all middleware executed before this one.
   * 
   * In the generic `Middleware` type, this is `TContext` which extends `Record<string, unknown>`.
   * The default is `Record<string, unknown>`, but middleware can extend this with
   * specific context types (e.g., `{ userId: string; userEmail: string }`).
   */
  ctx?: Record<string, unknown>;
  /**
   * Optional action metadata.
   * 
   * Metadata can include actionName, category, and other cross-cutting concerns.
   * The type is `unknown` to allow any metadata structure (object, string, number, etc.).
   */
  metadata?: unknown;
}

/**
 * Action handler function type
 *
 * This type defines the signature for action handler functions that process validated input
 * and return output data. The handler receives parsed and validated input along with context
 * from middleware, and should return data matching the output schema (if defined).
 *
 * @template TInput - The validated input type (from inputSchema). This is the inferred type
 *   from the Zod input schema (`z.infer<InputSchema>`), so it's already validated and type-safe.
 *   The input has been validated against the schema before reaching the handler.
 * @template TOutput - The return type of the handler. This should match the output schema
 *   (if one is defined) for full type safety. The handler's return value will be validated
 *   against the output schema if provided.
 * @template TContext - The context type (from middleware). Must extend `Record<string, unknown>`.
 *   Defaults to `Record<string, unknown>` but can be extended by middleware to include
 *   auth data (userId, userEmail, authToken), request metadata, etc.
 *
 * @remarks
 * The handler is the core business logic of an action. It receives:
 * - `parsedInput`: Already validated and typed input data
 * - `ctx`: Context merged from all middleware in the chain
 *
 * The handler should:
 * - Perform the business logic
 * - Return data matching the output schema (if defined)
 * - Throw errors for exceptional cases (will be caught and converted to SafeActionResult)
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import type { ActionHandler } from '@jsonbored/safemocker';
 *
 * // Define input/output types
 * const inputSchema = z.object({
 *   name: z.string().min(1),
 *   age: z.number().int().positive(),
 * });
 *
 * type Input = z.infer<typeof inputSchema>;
 * type Output = { id: string; name: string; age: number };
 *
 * // Handler with typed context
 * interface MyContext {
 *   userId: string;
 *   userEmail: string;
 * }
 *
 * const handler: ActionHandler<Input, Output, MyContext> = async ({
 *   parsedInput,
 *   ctx,
 * }) => {
 *   // parsedInput is type-safe: { name: string; age: number }
 *   // ctx is type-safe: { userId: string; userEmail: string }
 *   return {
 *     id: ctx.userId,
 *     name: parsedInput.name,
 *     age: parsedInput.age,
 *   };
 * };
 *
 * // Handler without specific context type
 * const simpleHandler: ActionHandler<Input, Output> = async ({
 *   parsedInput,
 * }) => {
 *   // ctx is Record<string, unknown>
 *   return {
 *     id: '123',
 *     name: parsedInput.name,
 *     age: parsedInput.age,
 *   };
 * };
 * ```
 *
 * @see {@link SafeActionResult} - For the result structure returned by actions
 * @see {@link Middleware} - For middleware that provides context
 * @see {@link MockSafeActionClient.inputSchema} - For creating actions with handlers
 * @category Types
 * @since 0.2.0
 */
export type ActionHandler<TInput, TOutput, TContext extends Record<string, unknown> = Record<string, unknown>> = (params: {
  parsedInput: TInput;
  ctx: TContext;
}) => Promise<TOutput>;

/**
 * Wrapper interface for documenting ActionHandler function type with AutoTypeTable.
 * 
 * This interface exposes the ActionHandler function parameters as object properties,
 * allowing AutoTypeTable to properly extract and document the function signature.
 * Uses concrete types to demonstrate the full type signature while maintaining
 * type safety through the generic ActionHandler type.
 * 
 * **Note**: The actual `ActionHandler` type is generic:
 * ```typescript
 * type ActionHandler<TInput, TOutput, TContext extends Record<string, unknown> = Record<string, unknown>>
 * ```
 * 
 * This interface uses concrete types (`{ name: string }` for input, `{ id: string }` for output,
 * and `Record<string, unknown>` for context) to provide a complete, type-safe example
 * of the handler signature.
 * 
 * @internal
 * @see {@link ActionHandler} - For the actual generic function type
 */
export interface ActionHandlerType {
  /**
   * Already validated and typed input data from the inputSchema.
   * 
   * This input has been validated against the Zod schema before reaching the handler,
   * so it's guaranteed to match the schema type.
   * 
   * In the generic `ActionHandler` type, this is `TInput` which is inferred from
   * the input schema using `z.infer<InputSchema>`. The input is already validated
   * and type-safe when it reaches the handler.
   * 
   * @example
   * ```typescript
   * // If inputSchema is z.object({ name: z.string() })
   * // Then parsedInput will be { name: string }
   * ```
   */
  parsedInput: { name: string };
  /**
   * Context merged from all middleware in the chain.
   * 
   * This context is built up by each middleware calling `next({ ctx: newContext })`,
   * with each middleware's context merged into the final context object.
   * 
   * In the generic `ActionHandler` type, this is `TContext` which extends `Record<string, unknown>`.
   * The default is `Record<string, unknown>`, but middleware can extend this with
   * specific context types (e.g., `{ userId: string; userEmail: string }`).
   * 
   * @example
   * ```typescript
   * // If middleware provides { userId: string }
   * // Then ctx will be { userId: string } (and any other merged context)
   * ```
   */
  ctx: Record<string, unknown>;
}

