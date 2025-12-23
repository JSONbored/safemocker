import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { validateInput } from '../src/validation';
import type { SafeActionResult } from '../src/types';

describe('validation', () => {
  describe('validateInput', () => {
    it('should validate valid input against schema', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().int().positive(),
      });

      const input = { name: 'John', age: 30 };
      const result = validateInput(input, schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John', age: 30 });
      }
    });

    it('should return validation errors for invalid input', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const input = { email: 'invalid-email', password: 'short' };
      const result = validateInput(input, schema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.result.fieldErrors).toBeDefined();
        expect(result.result.fieldErrors?.email).toBeDefined();
        expect(result.result.fieldErrors?.password).toBeDefined();
        expect(result.result.data).toBeUndefined();
        expect(result.result.serverError).toBeUndefined();
      }
    });

    it('should handle nested validation errors', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
          profile: z.object({
            name: z.string().min(1),
          }),
        }),
      });

      const input = { user: { email: 'invalid', profile: { name: '' } } };
      const result = validateInput(input, schema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.result.fieldErrors).toBeDefined();
        expect(result.result.fieldErrors?.['user.email']).toBeDefined();
        expect(result.result.fieldErrors?.['user.profile.name']).toBeDefined();
      }
    });

    it('should handle array validation errors', () => {
      const schema = z.object({
        tags: z.array(z.string().min(1)).min(1),
      });

      const input = { tags: [] };
      const result = validateInput(input, schema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.result.fieldErrors).toBeDefined();
        expect(result.result.fieldErrors?.tags).toBeDefined();
      }
    });

    it('should handle optional fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email().optional(),
      });

      const input = { name: 'John' };
      const result = validateInput(input, schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John' });
      }
    });

    it('should handle union types', () => {
      const schema = z.union([
        z.object({ type: z.literal('user'), name: z.string() }),
        z.object({ type: z.literal('admin'), role: z.string() }),
      ]);

      const validInput = { type: 'user', name: 'John' };
      const validResult = validateInput(validInput, schema);
      expect(validResult.success).toBe(true);

      const invalidInput = { type: 'user' };
      const invalidResult = validateInput(invalidInput, schema);
      expect(invalidResult.success).toBe(false);
    });

    it('should aggregate multiple errors for same field', () => {
      const schema = z.object({
        password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
      });

      const input = { password: 'short' };
      const result = validateInput(input, schema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.result.fieldErrors?.password).toBeDefined();
        expect(Array.isArray(result.result.fieldErrors?.password)).toBe(true);
        expect((result.result.fieldErrors?.password?.length ?? 0) > 0).toBe(true);
      }
    });

    it('should throw non-Zod errors', () => {
      const schema = z.string();
      
      // Create a schema that will throw a non-Zod error
      const throwingSchema = {
        parse: () => {
          throw new Error('Non-Zod error');
        },
      } as unknown as z.ZodType;

      expect(() => {
        validateInput('test', throwingSchema);
      }).toThrow('Non-Zod error');
    });
  });
});

