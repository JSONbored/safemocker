import type { SafeActionResult } from './types';

/**
 * Wraps a successful handler result in SafeActionResult structure.
 *
 * This function ensures all SafeActionResult properties are present, even if undefined,
 * for consistency with the real next-safe-action API. This allows type-safe access to
 * all properties without type assertions.
 *
 * @template TData - The type of data returned by the action handler
 * @param data - The successful result data from the action handler
 * @returns A SafeActionResult with the data property set and all other properties undefined
 *
 * @example
 * ```typescript
 * import { wrapResult } from '@jsonbored/safemocker';
 *
 * // Object data
 * const result1 = wrapResult({ id: '123', name: 'Test' });
 * // result1.data === { id: '123', name: 'Test' }
 * // result1.serverError === undefined
 * // result1.fieldErrors === undefined
 * // result1.validationErrors === undefined
 *
 * // Primitive data
 * const result2 = wrapResult('success');
 * // result2.data === 'success'
 *
 * // Array data
 * const result3 = wrapResult([1, 2, 3]);
 * // result3.data === [1, 2, 3]
 *
 * // Null/undefined data
 * const result4 = wrapResult(null);
 * // result4.data === null
 * ```
 *
 * @example
 * ```typescript
 * // Type inference
 * const result = wrapResult({ id: '123', count: 456 });
 * // result.data is typed as { id: string; count: number }
 * if (result.data) {
 *   const id: string = result.data.id;
 *   const count: number = result.data.count;
 * }
 * ```
 *
 * @internal
 * @category Core
 * @since 0.2.0
 */
export function wrapResult<TData>(data: TData): SafeActionResult<TData> {
  return {
    data,
    serverError: undefined,
    fieldErrors: undefined,
    validationErrors: undefined,
  };
}

/**
 * Wraps an error in SafeActionResult structure.
 *
 * Converts any error (Error instance, string, or other value) into a SafeActionResult
 * with the serverError property set. For Error instances, uses the error message if
 * available; otherwise uses the default message. For non-Error types, always uses
 * the default message.
 *
 * @param error - The error that occurred (can be Error, string, or any value)
 * @param defaultMessage - Default error message to use if error doesn't have a message
 * @returns A SafeActionResult with serverError set and all other properties undefined
 *
 * @example
 * ```typescript
 * import { wrapError } from '@jsonbored/safemocker';
 *
 * // Error instance with message
 * const result1 = wrapError(new Error('Custom error'), 'Default error');
 * // result1.serverError === 'Custom error'
 * // result1.data === undefined
 * // result1.fieldErrors === undefined
 *
 * // Error instance without message
 * const result2 = wrapError(new Error(), 'Default error');
 * // result2.serverError === 'Default error'
 *
 * // Non-Error value (string)
 * const result3 = wrapError('String error', 'Default error');
 * // result3.serverError === 'Default error'
 *
 * // Non-Error value (number)
 * const result4 = wrapError(500, 'Default error');
 * // result4.serverError === 'Default error'
 *
 * // Null/undefined
 * const result5 = wrapError(null, 'Default error');
 * // result5.serverError === 'Default error'
 * ```
 *
 * @example
 * ```typescript
 * // Type safety
 * const result = wrapError(new Error('Something failed'), 'An error occurred');
 * // result is SafeActionResult<never>
 * // result.data is never (always undefined)
 * // result.serverError is string | undefined
 * if (result.serverError) {
 *   console.error(result.serverError); // string
 * }
 * ```
 *
 * @internal
 * @see {@link handleError} - For production/development error message handling
 * @category Core
 * @since 0.2.0
 */
export function wrapError(error: unknown, defaultMessage: string): SafeActionResult<never> {
  // For Error instances, use the error message if available, otherwise use default
  // For non-Error types, always use default message
  const message = error instanceof Error && error.message ? error.message : defaultMessage;
  return {
    data: undefined as never,
    serverError: message,
    fieldErrors: undefined,
    validationErrors: undefined,
  };
}

/**
 * Wraps validation errors in SafeActionResult structure.
 *
 * Creates a SafeActionResult for input validation failures. The fieldErrors parameter
 * should be a record mapping field names (or paths) to arrays of error messages.
 * This matches the structure returned by Zod validation errors.
 *
 * @param fieldErrors - Record mapping field names/paths to arrays of error messages
 * @returns A SafeActionResult with fieldErrors set and all other properties undefined
 *
 * @example
 * ```typescript
 * import { wrapValidationErrors } from '@jsonbored/safemocker';
 *
 * // Single field with multiple errors
 * const result1 = wrapValidationErrors({
 *   name: ['Name is required', 'Name must be at least 3 characters'],
 * });
 * // result1.fieldErrors === { name: ['Name is required', 'Name must be at least 3 characters'] }
 * // result1.data === undefined
 * // result1.serverError === undefined
 *
 * // Multiple fields
 * const result2 = wrapValidationErrors({
 *   name: ['Name is required'],
 *   email: ['Invalid email format'],
 *   age: ['Age must be at least 18'],
 * });
 * // result2.fieldErrors === { name: [...], email: [...], age: [...] }
 *
 * // Nested field paths (dot notation)
 * const result3 = wrapValidationErrors({
 *   'user.name': ['Name is required'],
 *   'user.email': ['Invalid email'],
 *   'tags.0': ['Tag cannot be empty'],
 * });
 * // result3.fieldErrors uses dot notation for nested fields
 * ```
 *
 * @example
 * ```typescript
 * // Type safety
 * const result = wrapValidationErrors({
 *   email: ['Invalid email'],
 * });
 * // result is SafeActionResult<never>
 * // result.data is never (always undefined)
 * // result.fieldErrors is Record<string, string[]> | undefined
 * if (result.fieldErrors) {
 *   const emailErrors = result.fieldErrors.email; // string[] | undefined
 *   if (emailErrors) {
 *     console.log('Email errors:', emailErrors);
 *   }
 * }
 * ```
 *
 * @internal
 * @see {@link validateInput} - For input validation that produces these errors
 * @category Core
 * @since 0.2.0
 */
export function wrapValidationErrors(
  fieldErrors: Record<string, string[]>
): SafeActionResult<never> {
  return {
    data: undefined as never,
    serverError: undefined,
    fieldErrors,
    validationErrors: undefined,
  };
}

