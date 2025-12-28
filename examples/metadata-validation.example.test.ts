/**
 * Tests for metadata-validation.example.ts
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
import { createUser, updateUser } from './metadata-validation.example';
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('metadata-validation.example', () => {
  describe('createUser', () => {
    it('should create user with valid metadata', async () => {
      const result = await createUser({
        name: 'John Doe',
        email: 'john@example.com',
      });

      type CreateUserResult = InferSafeActionFnResult<typeof createUser>;
      const typedResult: CreateUserResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.id).toBeDefined();
      expect(typedResult.data?.name).toBe('John Doe');
    });
  });

  describe('updateUser', () => {
    it('should update user with minimal metadata', async () => {
      const result = await updateUser({
        userId: 'user-123',
        name: 'Jane Doe',
      });

      type UpdateUserResult = InferSafeActionFnResult<typeof updateUser>;
      const typedResult: UpdateUserResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.id).toBe('user-123');
      expect(typedResult.data?.updated).toBe(true);
    });
  });
});

