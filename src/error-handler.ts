import type { SafeActionResult } from './types';
import { wrapError } from './result-wrapper';

/**
 * Handles errors and converts to SafeActionResult
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

