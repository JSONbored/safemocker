/**
 * Tests for basic-usage.example.ts
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
 *
 * @example
 * ```bash
 * # Run with Jest
 * npm test
 *
 * # Run with Vitest
 * npm test
 * ```
 */

import { describe, expect, it } from '@jest/globals';
import { createUserProfile } from './basic-usage.example';
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('basic-usage.example', () => {
  it('should create user profile with valid input', async () => {
    const result = await createUserProfile({
      name: 'John Doe',
      bio: 'This is a valid bio with enough characters.',
    });

    type CreateUserProfileResult = InferSafeActionFnResult<typeof createUserProfile>;
    const typedResult: CreateUserProfileResult = result;

    expect(typedResult.data).toBeDefined();
    expect(typedResult.data?.name).toBe('John Doe');
    expect(typedResult.data?.userId).toBe('example-user-id');
    expect(typedResult.fieldErrors).toBeUndefined();
    expect(typedResult.serverError).toBeUndefined();
  });

  it('should return validation errors for invalid input', async () => {
    const result = await createUserProfile({
      name: '',
      bio: 'short',
    });

    type CreateUserProfileResult = InferSafeActionFnResult<typeof createUserProfile>;
    const typedResult: CreateUserProfileResult = result;

    expect(typedResult.fieldErrors).toBeDefined();
    expect(typedResult.fieldErrors?.name).toBeDefined();
    expect(typedResult.fieldErrors?.bio).toBeDefined();
    expect(typedResult.data).toBeUndefined();
  });
});

