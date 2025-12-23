import { z } from 'zod';
import type { SafeActionResult } from './types';
import { wrapValidationErrors } from './result-wrapper';

/**
 * Validates input against Zod schema
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

