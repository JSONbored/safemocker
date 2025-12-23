/**
 * Real Integration Test
 *
 * This test verifies that safemocker works with REAL next-safe-action usage.
 * It uses the actual safe-action.ts and action files from the examples/ directory,
 * which import next-safe-action. The mock in __mocks__/next-safe-action.ts
 * intercepts these imports, allowing Jest to test the real code.
 *
 * This is the ultimate validation - if this passes, safemocker is production-ready.
 */

import { describe, expect, it, beforeEach } from '@jest/globals';
import { z } from 'zod';
import { createUser, getUserProfile, updateUserSettings, deleteUser } from '../examples/user-actions';
import type { SafeActionResult } from '../src/types';

describe('Real Integration Test - Using Actual safe-action.ts', () => {
  beforeEach(() => {
    // Clear any mocks between tests
    jest.clearAllMocks();
  });

  describe('createUser action', () => {
    it('should create user successfully with valid input', async () => {
      const result = await createUser({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      });

      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('new-user-id');
      expect(result.data?.name).toBe('John Doe');
      expect(result.data?.email).toBe('john@example.com');
      expect(result.data?.role).toBe('user');
      expect(result.data?.createdBy).toBe('test-user-id'); // From mock auth context
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should return validation errors for invalid input', async () => {
      const result = await createUser({
        name: '', // Invalid: min length
        email: 'invalid-email', // Invalid: not an email
        role: 'invalid-role' as any, // Invalid: not in enum
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.fieldErrors?.email).toBeDefined();
      expect(result.fieldErrors?.role).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should handle missing optional fields', async () => {
      const result = await createUser({
        name: 'Jane Doe',
        email: 'jane@example.com',
        // role is optional
      });

      expect(result.data).toBeDefined();
      expect(result.data?.role).toBe('user'); // Default value
    });
  });

  describe('getUserProfile action', () => {
    it('should return user profile with optional auth', async () => {
      const result = await getUserProfile({
        userId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data?.name).toBe('John Doe');
      expect(result.data?.viewerId).toBe('test-user-id'); // From mock auth context
      expect(result.data?.isOwnProfile).toBe(false);
    });

    it('should handle validation errors', async () => {
      const result = await getUserProfile({
        userId: 'invalid-uuid',
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.userId).toBeDefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe('updateUserSettings action', () => {
    it('should update settings successfully', async () => {
      const result = await updateUserSettings({
        theme: 'dark',
        notifications: false,
      });

      expect(result.data).toBeDefined();
      expect(result.data?.userId).toBe('test-user-id');
      expect(result.data?.settings.theme).toBe('dark');
      expect(result.data?.settings.notifications).toBe(false);
    });

    it('should use default values for optional fields', async () => {
      const result = await updateUserSettings({});

      expect(result.data).toBeDefined();
      expect(result.data?.settings.theme).toBe('auto'); // Default
      expect(result.data?.settings.notifications).toBe(true); // Default
    });

    it('should validate enum values', async () => {
      const result = await updateUserSettings({
        theme: 'invalid-theme' as any,
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.theme).toBeDefined();
    });
  });

  describe('deleteUser action', () => {
    it('should delete user successfully', async () => {
      const result = await deleteUser({
        userId: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.data).toBeDefined();
      expect(result.data?.deleted).toBe(true);
      expect(result.data?.deletedBy).toBe('test-user-id');
    });
  });

  describe('SafeActionResult structure', () => {
    it('should always return proper SafeActionResult structure', async () => {
      const result = await createUser({
        name: 'Test User',
        email: 'test@example.com',
      });

      // Verify structure matches SafeActionResult interface
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('serverError');
      expect(result).toHaveProperty('fieldErrors');
      expect(result).toHaveProperty('validationErrors');

      // Type check
      const typedResult: SafeActionResult<typeof result.data> = result;
      expect(typedResult).toBeDefined();
    });

    it('should return serverError on handler errors', async () => {
      // Create an action that throws an error
      const { authedAction } = await import('../examples/safe-action');
      const errorAction = authedAction
        .inputSchema(z.object({ id: z.string() }))
        .metadata({ actionName: 'errorTest' })
        .action(async () => {
          throw new Error('Test error');
        });

      const result = await errorAction({ id: 'test-id' });

      expect(result.serverError).toBeDefined();
      expect(result.serverError).toBe('Test error');
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });
  });

  describe('Context injection', () => {
    it('should inject auth context in authedAction', async () => {
      const result = await createUser({
        name: 'Test',
        email: 'test@example.com',
      });

      // Verify auth context was injected (createdBy should be test-user-id)
      expect(result.data?.createdBy).toBe('test-user-id');
    });

    it('should inject optional auth context in optionalAuthAction', async () => {
      const result = await getUserProfile({
        userId: '123e4567-e89b-12d3-a456-426614174000',
      });

      // Verify optional auth context was injected
      expect(result.data?.viewerId).toBe('test-user-id');
      expect(result.data?.user).toBeDefined();
    });
  });

  describe('Metadata validation', () => {
    it('should work with valid metadata', async () => {
      const result = await createUser({
        name: 'Test',
        email: 'test@example.com',
      });

      // Should succeed with valid metadata
      expect(result.data).toBeDefined();
    });
  });
});
