import { z } from 'zod';
import type { SafeActionResult } from './types';
import { wrapValidationErrors } from './result-wrapper';

/**
 * Validates input against a Zod schema.
 *
 * Parses and validates input data against the provided Zod schema. If validation
 * succeeds, returns the parsed data. If validation fails, returns a SafeActionResult
 * with fieldErrors populated from the Zod validation errors.
 *
 * @template T - The Zod schema type
 * @param input - The input data to validate (can be any value)
 * @param schema - The Zod schema to validate against
 * @returns Either a success result with parsed data, or a failure result with validation errors
 *
 * @remarks
 * This function is used internally by the mock client to validate input before executing
 * the action handler. Validation errors are formatted as fieldErrors, with field paths
 * (including nested paths) as keys and arrays of error messages as values.
 *
 * **Field Path Format**: Nested fields use dot notation (e.g., `'user.email'` for `{ user: { email: '...' } }`).
 * Array indices are included in paths (e.g., `'tags.0'` for the first element in a tags array).
 *
 * **Error Messages**: Each field can have multiple error messages (array), allowing comprehensive
 * validation feedback. For example, a field might have both 'Required' and 'Invalid format' errors.
 *
 * **Type Safety**: The return type uses a discriminated union, allowing TypeScript to narrow the
 * type based on the `success` property. When `success` is `true`, `data` is available and typed
 * as `z.infer<T>`. When `success` is `false`, `result` is available and typed as `SafeActionResult<never>`.
 *
 * @example
 * ```typescript
 * import { validateInput } from '@jsonbored/safemocker';
 * import { z } from 'zod';
 *
 * const schema = z.object({
 *   name: z.string().min(3),
 *   age: z.number().min(18),
 * });
 *
 * // Valid input
 * const result1 = validateInput({ name: 'John', age: 25 }, schema);
 * if (result1.success) {
 *   console.log(result1.data); // { name: 'John', age: 25 }
 *   // TypeScript knows result1.data is z.infer<typeof schema>
 * }
 *
 * // Invalid input - multiple fields
 * const result2 = validateInput({ name: 'Jo', age: 15 }, schema);
 * if (!result2.success) {
 *   console.log(result2.result.fieldErrors);
 *   // {
 *   //   name: ['String must contain at least 3 character(s)'],
 *   //   age: ['Number must be greater than or equal to 18']
 *   // }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Nested object validation
 * const nestedSchema = z.object({
 *   user: z.object({
 *     name: z.string().min(1),
 *     email: z.string().email(),
 *   }),
 *   tags: z.array(z.string().min(1)),
 * });
 *
 * const result = validateInput({
 *   user: { name: '', email: 'invalid' },
 *   tags: ['', 'valid'],
 * }, nestedSchema);
 *
 * if (!result.success) {
 *   console.log(result.result.fieldErrors);
 *   // {
 *   //   'user.name': ['String must contain at least 1 character(s)'],
 *   //   'user.email': ['Invalid email'],
 *   //   'tags.0': ['String must contain at least 1 character(s)']
 *   // }
 *   // Note: Nested paths use dot notation
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Type inference
 * const schema = z.object({ id: z.string().uuid() });
 * const result = validateInput({ id: '123' }, schema);
 *
 * if (result.success) {
 *   // result.data is typed as { id: string }
 *   const id: string = result.data.id;
 * } else {
 *   // result.result is SafeActionResult<never>
 *   const errors = result.result.fieldErrors;
 * }
 * ```
 *
 * @internal
 * @throws {Error} Re-throws non-ZodError exceptions (should not happen in normal usage)
 * @see {@link validateOutput} - For output validation
 * @see {@link wrapValidationErrors} - For creating validation error results
 * @category Validation
 * @since 0.2.0
 */
export function validateInput<T extends z.ZodType>(
  input: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; result: SafeActionResult<never> } {
  try {
    const parsed = schema.parse(input);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      // Zod v4 uses 'issues' instead of 'errors'
      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      });
      return { success: false, result: wrapValidationErrors(fieldErrors) };
    }
    throw error;
  }
}

/**
 * Validates output (handler return value) against a Zod schema.
 *
 * Validates the return value from an action handler against the output schema.
 * This helps catch bugs in tests by ensuring handlers return data matching the
 * expected schema. Validation errors are placed in validationErrors (not
 * fieldErrors) to distinguish them from input validation errors.
 *
 * @template T - The Zod schema type
 * @param output - The output data from the action handler to validate
 * @param schema - The Zod schema to validate against
 * @returns Either a success result with validated data, or a failure result with validation errors
 *
 * @remarks
 * Output validation is particularly useful in tests to catch bugs where handlers return
 * data that doesn't match the declared output schema. This helps ensure type safety
 * and catch regressions early. The distinction between fieldErrors (input) and
 * validationErrors (output) helps identify where validation failed.
 *
 * **Error Field**: Output validation errors are placed in `validationErrors` (not `fieldErrors`)
 * to distinguish them from input validation errors. This allows clients to handle input vs output
 * validation errors differently if needed.
 *
 * **Field Path Format**: Like input validation, nested fields use dot notation and array indices
 * are included in paths.
 *
 * **Type Safety**: The return type uses a discriminated union, allowing TypeScript to narrow the
 * type based on the `success` property. When `success` is `true`, `data` is available and typed
 * as `z.infer<T>`. When `success` is `false`, `result` is available and typed as `SafeActionResult<never>`.
 *
 * @example
 * ```typescript
 * import { validateOutput } from '@jsonbored/safemocker';
 * import { z } from 'zod';
 *
 * const outputSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 * });
 *
 * // Valid output
 * const result1 = validateOutput({ id: '123', name: 'Test' }, outputSchema);
 * if (result1.success) {
 *   console.log(result1.data); // { id: '123', name: 'Test' }
 *   // TypeScript knows result1.data is z.infer<typeof outputSchema>
 * }
 *
 * // Invalid output - missing field
 * const result2 = validateOutput({ id: '123' }, outputSchema);
 * if (!result2.success) {
 *   console.log(result2.result.validationErrors);
 *   // { name: ['Required'] }
 *   // Note: Uses validationErrors, not fieldErrors
 * }
 *
 * // Invalid output - wrong type
 * const result3 = validateOutput({ id: 123, name: 'Test' }, outputSchema);
 * if (!result3.success) {
 *   console.log(result3.result.validationErrors);
 *   // { id: ['Expected string, received number'] }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Output validation in action handler
 * const outputSchema = z.object({
 *   id: z.string(),
 *   createdAt: z.string(),
 * });
 *
 * // Handler returns wrong shape
 * const handlerResult = { id: '123' }; // Missing createdAt
 * const result = validateOutput(handlerResult, outputSchema);
 *
 * if (!result.success) {
 *   // This would be returned as validationErrors in SafeActionResult
 *   console.log(result.result.validationErrors);
 *   // { createdAt: ['Required'] }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Type inference
 * const outputSchema = z.object({ count: z.number() });
 * const result = validateOutput({ count: 42 }, outputSchema);
 *
 * if (result.success) {
 *   // result.data is typed as { count: number }
 *   const count: number = result.data.count;
 * } else {
 *   // result.result is SafeActionResult<never>
 *   const errors = result.result.validationErrors;
 * }
 * ```
 *
 * @internal
 * @throws {Error} Re-throws non-ZodError exceptions (should not happen in normal usage)
 * @see {@link validateInput} - For input validation
 * @category Validation
 * @since 0.2.0
 */
export function validateOutput<T extends z.ZodType>(
  output: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; result: SafeActionResult<never> } {
  try {
    const parsed = schema.parse(output);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      // Zod v4 uses 'issues' instead of 'errors'
      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        fieldErrors[path] = fieldErrors[path] || [];
        fieldErrors[path].push(issue.message);
      });
      // For output validation errors, we use validationErrors instead of fieldErrors
      // to distinguish from input validation errors
      return {
        success: false,
        result: {
          data: undefined as never,
          serverError: undefined,
          fieldErrors: undefined,
          validationErrors: fieldErrors,
        },
      };
    }
    throw error;
  }
}

