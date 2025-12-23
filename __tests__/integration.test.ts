import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { createCompleteActionClient } from '../src/helpers';
import type { SafeActionResult } from '../src/types';

/**
 * Integration tests that verify safemocker works end-to-end
 * with realistic usage patterns matching real next-safe-action usage
 */
describe('integration', () => {
  describe('complete action client workflow', () => {
    const metadataSchema = z.object({
      actionName: z.string().min(1),
      category: z
        .enum(['analytics', 'form', 'content', 'user', 'admin', 'reputation', 'mfa'])
        .optional(),
    });

    it('should work with authedAction pattern', async () => {
      const { authedAction } = createCompleteActionClient(metadataSchema, {
        auth: {
          testUserId: 'user-123',
          testUserEmail: 'user@example.com',
          testAuthToken: 'token-123',
        },
      });

      const inputSchema = z.object({
        jobId: z.string().uuid(),
        status: z.enum(['draft', 'published', 'archived']),
      });

      const action = authedAction
        .inputSchema(inputSchema)
        .metadata({ actionName: 'updateJobStatus', category: 'user' })
        .action(async ({ parsedInput, ctx }) => {
          // Verify context is injected
          expect(ctx.userId).toBe('user-123');
          expect(ctx.userEmail).toBe('user@example.com');
          expect(ctx.authToken).toBe('token-123');

          return {
            jobId: parsedInput.jobId,
            status: parsedInput.status,
            updatedBy: ctx.userId,
          };
        });

      const result = await action({
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'published',
      });

      expect(result.data).toEqual({
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'published',
        updatedBy: 'user-123',
      });
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should handle validation errors correctly', async () => {
      const { authedAction } = createCompleteActionClient(metadataSchema);

      const inputSchema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const action = authedAction
        .inputSchema(inputSchema)
        .metadata({ actionName: 'createUser' })
        .action(async ({ parsedInput }) => {
          return { email: parsedInput.email };
        });

      const result = await action({
        email: 'invalid-email',
        password: 'short',
      });

      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.email).toBeDefined();
      expect(result.fieldErrors?.password).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should handle handler errors correctly', async () => {
      const { authedAction } = createCompleteActionClient(metadataSchema, {
        defaultServerError: 'Something went wrong',
        isProduction: false,
      });

      const inputSchema = z.object({ id: z.string() });

      const action = authedAction
        .inputSchema(inputSchema)
        .metadata({ actionName: 'deleteItem' })
        .action(async () => {
          throw new Error('Item not found');
        });

      const result = await action({ id: 'test-id' });

      expect(result.serverError).toBe('Item not found');
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should use default error in production mode', async () => {
      const { authedAction } = createCompleteActionClient(metadataSchema, {
        defaultServerError: 'Something went wrong',
        isProduction: true,
      });

      const inputSchema = z.object({ id: z.string() });

      const action = authedAction
        .inputSchema(inputSchema)
        .metadata({ actionName: 'sensitiveOperation' })
        .action(async () => {
          throw new Error('Sensitive error details');
        });

      const result = await action({ id: 'test-id' });

      expect(result.serverError).toBe('Something went wrong');
      expect(result.serverError).not.toBe('Sensitive error details');
    });

    it('should work with optionalAuthAction', async () => {
      const { optionalAuthAction } = createCompleteActionClient(metadataSchema, {
        auth: {
          testUserId: 'user-123',
          testUserEmail: 'user@example.com',
        },
      });

      const inputSchema = z.object({ query: z.string() });

      const action = optionalAuthAction
        .inputSchema(inputSchema)
        .metadata({ actionName: 'search' })
        .action(async ({ parsedInput, ctx }) => {
          return {
            query: parsedInput.query,
            userId: ctx.userId,
            user: ctx.user,
          };
        });

      const result = await action({ query: 'test' });

      expect(result.data).toEqual({
        query: 'test',
        userId: 'user-123',
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      });
    });

    it('should support method chaining without metadata', async () => {
      const { authedAction } = createCompleteActionClient(metadataSchema);

      const inputSchema = z.object({ value: z.number() });

      const action = authedAction
        .inputSchema(inputSchema)
        .action(async ({ parsedInput, ctx }) => {
          return {
            value: parsedInput.value,
            userId: ctx.userId,
          };
        });

      const result = await action({ value: 42 });

      expect(result.data).toEqual({
        value: 42,
        userId: 'test-user-id',
      });
    });

    it('should handle multiple middleware layers', async () => {
      const { authedAction } = createCompleteActionClient(metadataSchema);

      const executionOrder: string[] = [];

      // Add custom middleware
      authedAction.use(async ({ next, ctx }) => {
        executionOrder.push('custom-middleware');
        // next-safe-action v8 API: next() accepts { ctx: ... }
        return next({ ctx: { ...ctx, custom: 'value' } });
      });

      const inputSchema = z.object({ id: z.string() });

      const action = authedAction
        .inputSchema(inputSchema)
        .metadata({ actionName: 'test' })
        .action(async ({ parsedInput, ctx }) => {
          executionOrder.push('handler');
          return {
            id: parsedInput.id,
            custom: ctx.custom,
            userId: ctx.userId,
          };
        });

      const result = await action({ id: 'test-id' });

      expect(result.data).toEqual({
        id: 'test-id',
        custom: 'value',
        userId: 'test-user-id',
      });

      // Verify middleware execution order
      expect(executionOrder).toContain('custom-middleware');
      expect(executionOrder).toContain('handler');
      expect(executionOrder.indexOf('custom-middleware')).toBeLessThan(
        executionOrder.indexOf('handler')
      );
    });
  });

  describe('real-world usage patterns', () => {
    it('should replicate jobs-crud test pattern', async () => {
      const metadataSchema = z.object({
        actionName: z.string(),
      });

      const { authedAction } = createCompleteActionClient(metadataSchema, {
        auth: {
          testUserId: 'test-user-id',
          testUserEmail: 'test@example.com',
          testAuthToken: 'test-token',
        },
      });

      const createJobSchema = z.object({
        title: z.string().min(1),
        description: z.string(),
        company_id: z.string().uuid(),
      });

      const createJob = authedAction
        .inputSchema(createJobSchema)
        .metadata({ actionName: 'createJob' })
        .action(async ({ parsedInput, ctx }) => {
          return {
            id: 'new-job-id',
            title: parsedInput.title,
            description: parsedInput.description,
            company_id: parsedInput.company_id,
            created_by: ctx.userId,
          };
        });

      const result = await createJob({
        title: 'Software Engineer',
        description: 'Build amazing products',
        company_id: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.data).toEqual({
        id: 'new-job-id',
        title: 'Software Engineer',
        description: 'Build amazing products',
        company_id: '123e4567-e89b-12d3-a456-426614174000',
        created_by: 'test-user-id',
      });
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should handle complex nested validation', async () => {
      const { authedAction } = createCompleteActionClient(
        z.object({ actionName: z.string() })
      );

      const complexSchema = z.object({
        user: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          preferences: z.object({
            theme: z.enum(['light', 'dark']),
            notifications: z.boolean(),
          }),
        }),
        tags: z.array(z.string().min(1)).min(1),
      });

      const action = authedAction
        .inputSchema(complexSchema)
        .metadata({ actionName: 'updateProfile' })
        .action(async ({ parsedInput }) => {
          return { success: true, data: parsedInput };
        });

      // Valid input
      const validResult = await action({
        user: {
          name: 'John',
          email: 'john@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        tags: ['developer', 'typescript'],
      });

      expect(validResult.data).toBeDefined();
      expect(validResult.fieldErrors).toBeUndefined();

      // Invalid input
      const invalidResult = await action({
        user: {
          name: '',
          email: 'invalid-email',
          preferences: {
            theme: 'invalid',
            notifications: 'not-boolean',
          },
        },
        tags: [],
      });

      expect(invalidResult.fieldErrors).toBeDefined();
      expect(invalidResult.data).toBeUndefined();
    });
  });
});

