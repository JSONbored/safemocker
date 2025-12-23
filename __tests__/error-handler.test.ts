import { describe, expect, it } from '@jest/globals';
import { handleError } from '../src/error-handler';
import type { SafeActionResult } from '../src/types';

describe('error-handler', () => {
  describe('handleError', () => {
    it('should handle Error objects in development mode', () => {
      const error = new Error('Test error message');
      const config = {
        defaultServerError: 'Something went wrong',
        isProduction: false,
      };

      const result = handleError(error, config);

      expect(result).toEqual({
        serverError: 'Test error message',
      });
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
      expect(result.validationErrors).toBeUndefined();
    });

    it('should use default message in production mode', () => {
      const error = new Error('Detailed error message');
      const config = {
        defaultServerError: 'Something went wrong',
        isProduction: true,
      };

      const result = handleError(error, config);

      expect(result).toEqual({
        serverError: 'Something went wrong',
      });
    });

    it('should use default message when error has no message in development', () => {
      const error = new Error('');
      const config = {
        defaultServerError: 'Something went wrong',
        isProduction: false,
      };

      const result = handleError(error, config);

      expect(result).toEqual({
        serverError: 'Something went wrong',
      });
    });

    it('should handle non-Error types', () => {
      const config = {
        defaultServerError: 'Something went wrong',
        isProduction: false,
      };

      expect(handleError('string error', config)).toEqual({
        serverError: 'Something went wrong',
      });

      expect(handleError(42, config)).toEqual({
        serverError: 'Something went wrong',
      });

      expect(handleError(null, config)).toEqual({
        serverError: 'Something went wrong',
      });

      expect(handleError(undefined, config)).toEqual({
        serverError: 'Something went wrong',
      });
    });

    it('should handle custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      const config = {
        defaultServerError: 'Something went wrong',
        isProduction: false,
      };

      const result = handleError(error, config);

      expect(result).toEqual({
        serverError: 'Custom error message',
      });
    });

    it('should prioritize error message over default in development', () => {
      const error = new Error('Specific error');
      const config = {
        defaultServerError: 'Generic error',
        isProduction: false,
      };

      const result = handleError(error, config);

      expect(result.serverError).toBe('Specific error');
    });

    it('should always use default in production regardless of error message', () => {
      const error = new Error('Sensitive error details');
      const config = {
        defaultServerError: 'Something went wrong',
        isProduction: true,
      };

      const result = handleError(error, config);

      expect(result.serverError).toBe('Something went wrong');
      expect(result.serverError).not.toBe('Sensitive error details');
    });
  });
});

