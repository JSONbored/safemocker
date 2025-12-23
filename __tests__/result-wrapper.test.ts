import { describe, expect, it } from '@jest/globals';
import { wrapResult, wrapError, wrapValidationErrors } from '../src/result-wrapper';
import type { SafeActionResult } from '../src/types';

describe('result-wrapper', () => {
  describe('wrapResult', () => {
    it('should wrap data in SafeActionResult structure', () => {
      const data = { id: '123', name: 'Test' };
      const result = wrapResult(data);

      expect(result).toEqual({
        data: { id: '123', name: 'Test' },
      });
      expect(result.data).toBe(data);
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
      expect(result.validationErrors).toBeUndefined();
    });

    it('should handle null data', () => {
      const result = wrapResult(null);

      expect(result).toEqual({ data: null });
      expect(result.data).toBeNull();
    });

    it('should handle undefined data', () => {
      const result = wrapResult(undefined);

      expect(result).toEqual({ data: undefined });
      expect(result.data).toBeUndefined();
    });

    it('should handle primitive types', () => {
      expect(wrapResult('string')).toEqual({ data: 'string' });
      expect(wrapResult(42)).toEqual({ data: 42 });
      expect(wrapResult(true)).toEqual({ data: true });
    });
  });

  describe('wrapError', () => {
    it('should wrap Error in SafeActionResult structure', () => {
      const error = new Error('Test error');
      const result = wrapError(error, 'Default error');

      expect(result).toEqual({
        serverError: 'Test error',
      });
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBe('Test error');
      expect(result.fieldErrors).toBeUndefined();
      expect(result.validationErrors).toBeUndefined();
    });

    it('should use default message when error has no message', () => {
      const error = new Error('');
      const result = wrapError(error, 'Default error');

      expect(result).toEqual({
        serverError: 'Default error',
      });
    });

    it('should use default message for non-Error types', () => {
      const result = wrapError('string error', 'Default error');

      expect(result).toEqual({
        serverError: 'Default error',
      });
    });

    it('should handle null/undefined errors', () => {
      expect(wrapError(null, 'Default error')).toEqual({
        serverError: 'Default error',
      });
      expect(wrapError(undefined, 'Default error')).toEqual({
        serverError: 'Default error',
      });
    });
  });

  describe('wrapValidationErrors', () => {
    it('should wrap field errors in SafeActionResult structure', () => {
      const fieldErrors = {
        email: ['Invalid email format'],
        password: ['Password too short', 'Password must contain numbers'],
      };
      const result = wrapValidationErrors(fieldErrors);

      expect(result).toEqual({
        fieldErrors: {
          email: ['Invalid email format'],
          password: ['Password too short', 'Password must contain numbers'],
        },
      });
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toEqual(fieldErrors);
      expect(result.validationErrors).toBeUndefined();
    });

    it('should handle empty field errors', () => {
      const result = wrapValidationErrors({});

      expect(result).toEqual({
        fieldErrors: {},
      });
    });

    it('should handle nested field paths', () => {
      const fieldErrors = {
        'user.email': ['Invalid email'],
        'user.profile.name': ['Name is required'],
      };
      const result = wrapValidationErrors(fieldErrors);

      expect(result).toEqual({
        fieldErrors: {
          'user.email': ['Invalid email'],
          'user.profile.name': ['Name is required'],
        },
      });
    });
  });
});

