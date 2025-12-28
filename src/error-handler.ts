import type { SafeActionResult } from './types';
import { wrapError } from './result-wrapper';

/**
 * Handles errors and converts them to SafeActionResult.
 *
 * Processes errors based on the environment (production vs development). In production,
 * always uses the default error message to avoid exposing internal error details. In
 * development, uses the error message if available, otherwise falls back to the default.
 *
 * @param error - The error that occurred (can be Error, string, or any value)
 * @param config - Error handling configuration
 * @param config.defaultServerError - Default error message to use
 * @param config.isProduction - Whether to use production error handling (always use default message)
 * @returns A SafeActionResult with serverError set appropriately
 *
 * @remarks
 * This function is used internally by the mock client to handle errors thrown by action handlers.
 * The production/development distinction allows tests to verify error handling behavior in both
 * environments. In production mode, all errors are sanitized to prevent information leakage.
 *
 * **Error Types**:
 * - `Error` instances: In development, uses `error.message` if available. In production, always uses default.
 * - Non-Error types: Always uses default message regardless of environment.
 *
 * **Security**: Production mode ensures sensitive error details (database connection strings, API keys,
 * stack traces, etc.) are never exposed to clients. This matches real next-safe-action behavior.
 *
 * **Testing**: Use `isProduction: false` in tests to see actual error messages for debugging, but
 * also test with `isProduction: true` to verify error sanitization works correctly.
 *
 * @example
 * ```typescript
 * import { handleError } from '@jsonbored/safemocker';
 *
 * // Development mode - uses error message
 * const result1 = handleError(
 *   new Error('Database connection failed'),
 *   { defaultServerError: 'Something went wrong', isProduction: false }
 * );
 * // result1.serverError === 'Database connection failed'
 * // result1.data === undefined
 * // result1.fieldErrors === undefined
 *
 * // Production mode - always uses default (sanitizes errors)
 * const result2 = handleError(
 *   new Error('Database connection failed'),
 *   { defaultServerError: 'Something went wrong', isProduction: true }
 * );
 * // result2.serverError === 'Something went wrong'
 * // Error details are hidden in production
 * ```
 *
 * @example
 * ```typescript
 * // Error without message - uses default
 * const result1 = handleError(
 *   new Error(),
 *   { defaultServerError: 'An error occurred', isProduction: false }
 * );
 * // result1.serverError === 'An error occurred'
 *
 * // Non-Error type - always uses default
 * const result2 = handleError(
 *   'String error',
 *   { defaultServerError: 'An error occurred', isProduction: false }
 * );
 * // result2.serverError === 'An error occurred'
 *
 * // Null/undefined - always uses default
 * const result3 = handleError(
 *   null,
 *   { defaultServerError: 'An error occurred', isProduction: false }
 * );
 * // result3.serverError === 'An error occurred'
 * ```
 *
 * @example
 * ```typescript
 * // Testing error handling in different modes
 * const testError = new Error('Sensitive database error: connection string exposed');
 *
 * // Development - shows actual error
 * const devResult = handleError(testError, {
 *   defaultServerError: 'Something went wrong',
 *   isProduction: false,
 * });
 * // devResult.serverError === 'Sensitive database error: connection string exposed'
 *
 * // Production - sanitized
 * const prodResult = handleError(testError, {
 *   defaultServerError: 'Something went wrong',
 *   isProduction: true,
 * });
 * // prodResult.serverError === 'Something went wrong'
 * // Sensitive information is hidden
 * ```
 *
 * @internal
 * @see {@link wrapError} - For basic error wrapping without environment handling
 * @category Error Handling
 * @since 0.2.0
 */
export function handleError(
  error: unknown,
  config: { defaultServerError: string; isProduction: boolean }
): SafeActionResult<never> {
  if (error instanceof Error) {
    // In production, always use default message
    // In development, use error message if available, otherwise use default
    const message = config.isProduction
      ? config.defaultServerError
      : error.message || config.defaultServerError;
    return wrapError(new Error(message), message);
  }
  // For non-Error types, always use default message
  return wrapError(error, config.defaultServerError);
}

