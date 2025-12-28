/**
 * Tests for validation.example.ts
 *
 * This example demonstrates testing with Jest. For Vitest, simply change the import:
 *
 * Jest:
 * ```typescript
 * import { describe, expect, it } from '@jest/globals';
 * ```
 *
 * Vitest:
 * ```typescript
 * import { describe, expect, it } from 'vitest';
 * ```
 *
 * All other code remains identical between Jest and Vitest.
 */

import { describe, expect, it } from '@jest/globals';
import { updateProfile, createUser, updateSettings } from './validation.example';
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('validation.example', () => {
  describe('updateProfile', () => {
    it('should return validation errors for invalid input', async () => {
      const result = await updateProfile({
        name: '',
        email: 'not-an-email',
        age: 15,
      });

      type UpdateProfileResult = InferSafeActionFnResult<typeof updateProfile>;
      const typedResult: UpdateProfileResult = result;

      expect(typedResult.fieldErrors).toBeDefined();
      expect(typedResult.fieldErrors?.name).toBeDefined();
      expect(typedResult.fieldErrors?.email).toBeDefined();
      expect(typedResult.fieldErrors?.age).toBeDefined();
    });

    it('should succeed with valid input', async () => {
      const result = await updateProfile({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });

      type UpdateProfileResult = InferSafeActionFnResult<typeof updateProfile>;
      const typedResult: UpdateProfileResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.success).toBe(true);
    });
  });

  describe('createUser', () => {
    it('should create user with validated output', async () => {
      const result = await createUser({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      type CreateUserResult = InferSafeActionFnResult<typeof createUser>;
      const typedResult: CreateUserResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.id).toBeDefined();
      expect(typedResult.data?.name).toBe('Jane Doe');
      expect(typedResult.data?.email).toBe('jane@example.com');
    });
  });

  describe('updateSettings', () => {
    it('should update settings with nested object validation', async () => {
      const result = await updateSettings({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        settings: {
          theme: 'dark',
          notifications: true,
          language: 'en',
        },
      });

      type UpdateSettingsResult = InferSafeActionFnResult<typeof updateSettings>;
      const typedResult: UpdateSettingsResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.updated).toBe(true);
      expect(typedResult.data?.settings.theme).toBe('dark');
    });
  });
});

