import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { createMockSafeActionClient } from '../src/client';
import type { SafeActionResult } from '../src/types';

describe('client', () => {
  describe('createMockSafeActionClient', () => {
    it('should create a client instance', () => {
      const client = createMockSafeActionClient();
      expect(client).toBeDefined();
      expect(typeof client.inputSchema).toBe('function');
      expect(typeof client.use).toBe('function');
    });

    it('should accept configuration', () => {
      const client = createMockSafeActionClient({
        defaultServerError: 'Custom error',
        isProduction: true,
        auth: {
          enabled: true,
          testUserId: 'custom-user-id',
          testUserEmail: 'custom@example.com',
          testAuthToken: 'custom-token',
        },
      });
      expect(client).toBeDefined();
    });
  });

  describe('inputSchema', () => {
    it('should return a builder with metadata and action methods', () => {
      const client = createMockSafeActionClient();
      const schema = z.object({ name: z.string() });
      const builder = client.inputSchema(schema);

      expect(builder).toBeDefined();
      expect(typeof builder.metadata).toBe('function');
      expect(typeof builder.action).toBe('function');
    });

    it('should validate input and return fieldErrors on invalid input', async () => {
      const client = createMockSafeActionClient();
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().int().positive(),
      });

      const action = client
        .inputSchema(schema)
        .action(async ({ parsedInput }) => {
          return { success: true, data: parsedInput };
        });

      const result = await action({ name: '', age: -1 });

      expect(result.fieldErrors).toBeDefined();
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });

    it('should execute handler with validated input', async () => {
      const client = createMockSafeActionClient();
      const schema = z.object({ name: z.string() });

      const action = client
        .inputSchema(schema)
        .action(async ({ parsedInput }) => {
          return { message: `Hello, ${parsedInput.name}!` };
        });

      const result = await action({ name: 'World' });

      expect(result.data).toEqual({ message: 'Hello, World!' });
      expect(result.serverError).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should handle errors and return serverError', async () => {
      const client = createMockSafeActionClient({
        defaultServerError: 'Something went wrong',
        isProduction: false,
      });
      const schema = z.object({ name: z.string() });

      const action = client
        .inputSchema(schema)
        .action(async () => {
          throw new Error('Handler error');
        });

      const result = await action({ name: 'Test' });

      expect(result.serverError).toBe('Handler error');
      expect(result.data).toBeUndefined();
      expect(result.fieldErrors).toBeUndefined();
    });

    it('should use default error message in production', async () => {
      const client = createMockSafeActionClient({
        defaultServerError: 'Something went wrong',
        isProduction: true,
      });
      const schema = z.object({ name: z.string() });

      const action = client
        .inputSchema(schema)
        .action(async () => {
          throw new Error('Detailed error message');
        });

      const result = await action({ name: 'Test' });

      expect(result.serverError).toBe('Something went wrong');
      expect(result.data).toBeUndefined();
    });
  });

  describe('metadata', () => {
    it('should accept metadata and return action builder', () => {
      const client = createMockSafeActionClient();
      const schema = z.object({ name: z.string() });
      const builder = client.inputSchema(schema).metadata({ actionName: 'test' });

      expect(builder).toBeDefined();
      expect(typeof builder.action).toBe('function');
    });

    it('should pass metadata to middleware', async () => {
      const client = createMockSafeActionClient();
      const schema = z.object({ name: z.string() });

      let receivedMetadata: any;
      client.use(async ({ next, metadata }) => {
        receivedMetadata = metadata;
        return next();
      });

      const action = client
        .inputSchema(schema)
        .metadata({ actionName: 'testAction', category: 'user' })
        .action(async ({ parsedInput }) => {
          return { name: parsedInput.name };
        });

      await action({ name: 'Test' });

      expect(receivedMetadata).toEqual({ actionName: 'testAction', category: 'user' });
    });
  });

  describe('middleware chain', () => {
    it('should execute middleware in order', async () => {
      const client = createMockSafeActionClient();
      const schema = z.object({ value: z.number() });

      const executionOrder: string[] = [];

      client
        .use(async ({ next }) => {
          executionOrder.push('middleware1');
          return next();
        })
        .use(async ({ next }) => {
          executionOrder.push('middleware2');
          return next();
        });

      const action = client
        .inputSchema(schema)
        .action(async ({ parsedInput }) => {
          executionOrder.push('handler');
          return { value: parsedInput.value * 2 };
        });

      await action({ value: 5 });

      expect(executionOrder).toEqual(['middleware1', 'middleware2', 'handler']);
    });

    it('should pass context through middleware chain', async () => {
      const client = createMockSafeActionClient();
      const schema = z.object({ value: z.number() });

      client
        .use(async ({ next }) => {
          // next-safe-action v8 API: next() accepts { ctx: ... }
          return next({ ctx: { step1: 'done' } });
        })
        .use(async ({ next, ctx }) => {
          // next-safe-action v8 API: next() accepts { ctx: ... }
          return next({ ctx: { ...ctx, step2: 'done' } });
        });

      const action = client
        .inputSchema(schema)
        .action(async ({ parsedInput, ctx }) => {
          return {
            value: parsedInput.value,
            context: ctx,
          };
        });

      const result = await action({ value: 10 });

      expect(result.data).toEqual({
        value: 10,
        context: { step1: 'done', step2: 'done' },
      });
    });

    it('should handle middleware errors', async () => {
      const client = createMockSafeActionClient({
        defaultServerError: 'Middleware error',
        isProduction: false,
      });
      const schema = z.object({ value: z.number() });

      client.use(async () => {
        throw new Error('Middleware failed');
      });

      const action = client
        .inputSchema(schema)
        .action(async ({ parsedInput }) => {
          return { value: parsedInput.value };
        });

      const result = await action({ value: 5 });

      expect(result.serverError).toBe('Middleware failed');
      expect(result.data).toBeUndefined();
    });

    it('should allow middleware to modify context', async () => {
      const client = createMockSafeActionClient();
      const schema = z.object({ id: z.string() });

      client.use(async ({ next, ctx }) => {
        // next-safe-action v8 API: next() accepts { ctx: ... }
        return next({ ctx: { ...ctx, userId: 'user-123' } });
      });

      const action = client
        .inputSchema(schema)
        .action(async ({ parsedInput, ctx }) => {
          return {
            id: parsedInput.id,
            userId: ctx.userId,
          };
        });

      const result = await action({ id: 'test-id' });

      expect(result.data).toEqual({
        id: 'test-id',
        userId: 'user-123',
      });
    });
  });

  describe('method chaining', () => {
    it('should support inputSchema().action() pattern', async () => {
      const client = createMockSafeActionClient();
      const schema = z.object({ name: z.string() });

      const action = client.inputSchema(schema).action(async ({ parsedInput }) => {
        return { name: parsedInput.name };
      });

      const result = await action({ name: 'Test' });
      expect(result.data).toEqual({ name: 'Test' });
    });

    it('should support inputSchema().metadata().action() pattern', async () => {
      const client = createMockSafeActionClient();
      const schema = z.object({ name: z.string() });

      const action = client
        .inputSchema(schema)
        .metadata({ actionName: 'test' })
        .action(async ({ parsedInput }) => {
          return { name: parsedInput.name };
        });

      const result = await action({ name: 'Test' });
      expect(result.data).toEqual({ name: 'Test' });
    });
  });
});

