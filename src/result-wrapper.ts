import type { SafeActionResult } from './types';

/**
 * Wraps handler result in SafeActionResult structure
 * Always includes all properties for consistency with real next-safe-action API
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
 * Wraps error in SafeActionResult structure
 * Always includes all properties for consistency with real next-safe-action API
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
 * Wraps validation errors in SafeActionResult structure
 * Always includes all properties for consistency with real next-safe-action API
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

