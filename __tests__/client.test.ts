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

  describe('outputSchema', () => {
    it('should return MetadataBuilder instance for chaining', () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ value: z.number() });
      const outputSchema = z.object({
        success: z.boolean(),
        data: z.object({ value: z.number() }),
      });

      // Test that outputSchema returns the builder for chaining
      // Explicitly capture the return value to ensure line 146 is tracked
      const builder1 = client.inputSchema(inputSchema);
      const builder2 = builder1.outputSchema(outputSchema);
      
      // Verify the return value is the same instance (ensures return this is tracked)
      expect(builder2).toBe(builder1);
      expect(builder2).toBeDefined();
      expect(typeof builder2.metadata).toBe('function');
      expect(typeof builder2.action).toBe('function');
      
      // Also test chaining directly to ensure coverage
      const chained = client.inputSchema(inputSchema).outputSchema(outputSchema);
      expect(chained).toBeDefined();
    });
    
    it('should return builder instance when outputSchema is called (explicit return coverage)', () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ id: z.string() });
      const outputSchema = z.object({ result: z.string() });
      
      // Create builder and call outputSchema, explicitly capturing return
      const builder = client.inputSchema(inputSchema);
      
      // Call outputSchema and verify it returns the builder (line 146)
      const returnedBuilder = builder.outputSchema(outputSchema);
      
      // Force coverage of return statement by using the returned value
      expect(returnedBuilder).toBe(builder);
      expect(returnedBuilder).toHaveProperty('_outputSchema', outputSchema);
      
      // Call it again to ensure coverage
      const returnedBuilder2 = returnedBuilder.outputSchema(outputSchema);
      expect(returnedBuilder2).toBe(returnedBuilder);
    });

    it('should validate output against schema and return data on success', async () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ value: z.number() });
      const outputSchema = z.object({
        success: z.boolean(),
        data: z.object({ value: z.number() }),
      });

      const action = client
        .inputSchema(inputSchema)
        .outputSchema(outputSchema)
        .action(async ({ parsedInput }) => {
          return {
            success: true,
            data: { value: parsedInput.value * 2 },
          };
        });

      const result = await action({ value: 5 });

      expect(result.data).toEqual({
        success: true,
        data: { value: 10 },
      });
      expect(result.serverError).toBeUndefined();
      expect(result.validationErrors).toBeUndefined();
    });

    it('should return validationErrors when output does not match schema', async () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ value: z.number() });
      const outputSchema = z.object({
        success: z.boolean(),
        data: z.object({ value: z.number() }),
      });

      const action = client
        .inputSchema(inputSchema)
        .outputSchema(outputSchema)
        .action(async ({ parsedInput }) => {
          // Return invalid output (missing 'data' field)
          return {
            success: true,
            // Missing 'data' field
          };
        });

      const result = await action({ value: 5 });

      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.data).toBeDefined();
      expect(Array.isArray(result.validationErrors?.data)).toBe(true);
    });

    it('should return validationErrors immediately when output validation fails (explicit return path)', async () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ id: z.string() });
      const outputSchema = z.object({
        id: z.string(),
        name: z.string().min(1),
      });

      const action = client
        .inputSchema(inputSchema)
        .outputSchema(outputSchema)
        .action(async ({ parsedInput }) => {
          // Return output that fails validation (name is empty string)
          return {
            id: parsedInput.id,
            name: '', // Fails min(1) validation
          };
        });

      const result = await action({ id: 'test-id' });

      // Verify the return path on line 205-206 is hit
      // This should trigger the return statement on line 205
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.name).toBeDefined();
      expect(Array.isArray(result.validationErrors?.name)).toBe(true);
      
      // Verify it's the exact result from validateOutput (ensures line 205 return is tracked)
      expect(result).toHaveProperty('validationErrors');
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
    });
    
    it('should return validationErrors when output type is wrong (explicit return path coverage)', async () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ id: z.string() });
      const outputSchema = z.object({
        id: z.string(),
        count: z.number().positive(),
      });

      const action = client
        .inputSchema(inputSchema)
        .outputSchema(outputSchema)
        .action(async ({ parsedInput }) => {
          // Return output with wrong type (count is string instead of number)
          return {
            id: parsedInput.id,
            count: 'not-a-number' as any, // Wrong type - triggers line 205 return
          };
        });

      const result = await action({ id: 'test-id' });

      // This should trigger the return statement on line 205
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.count).toBeDefined();
      expect(Array.isArray(result.validationErrors?.count)).toBe(true);
    });
    
    it('should return validationErrors when output is missing required fields (explicit return path coverage)', async () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ id: z.string() });
      const outputSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      });

      const action = client
        .inputSchema(inputSchema)
        .outputSchema(outputSchema)
        .action(async ({ parsedInput }) => {
          // Return output missing required fields - triggers line 205 return
          return {
            id: parsedInput.id,
            // Missing 'name' and 'email' fields
          };
        });

      const result = await action({ id: 'test-id' });

      // This should trigger the return statement on line 205
      expect(result.data).toBeUndefined();
      expect(result.serverError).toBeUndefined();
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.name).toBeDefined();
      expect(result.validationErrors?.email).toBeDefined();
    });

    it('should support outputSchema with metadata', async () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ name: z.string() });
      const outputSchema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const action = client
        .inputSchema(inputSchema)
        .outputSchema(outputSchema)
        .metadata({ actionName: 'createUser' })
        .action(async ({ parsedInput }) => {
          return {
            id: 'user-123',
            name: parsedInput.name,
          };
        });

      const result = await action({ name: 'John' });

      expect(result.data).toEqual({
        id: 'user-123',
        name: 'John',
      });
      expect(result.serverError).toBeUndefined();
    });

    it('should support outputSchema before metadata', async () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ name: z.string() });
      const outputSchema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const action = client
        .inputSchema(inputSchema)
        .outputSchema(outputSchema)
        .metadata({ actionName: 'createUser' })
        .action(async ({ parsedInput }) => {
          return {
            id: 'user-123',
            name: parsedInput.name,
          };
        });

      const result = await action({ name: 'John' });

      expect(result.data).toEqual({
        id: 'user-123',
        name: 'John',
      });
    });

    it('should return validationErrors with field paths for nested objects', async () => {
      const client = createMockSafeActionClient();
      const inputSchema = z.object({ value: z.number() });
      const outputSchema = z.object({
        success: z.boolean(),
        data: z.object({
          id: z.string(),
          value: z.number(),
        }),
      });

      const action = client
        .inputSchema(inputSchema)
        .outputSchema(outputSchema)
        .action(async ({ parsedInput }) => {
          // Return invalid output (missing 'id' in nested 'data' object)
          return {
            success: true,
            data: {
              // Missing 'id' field
              value: parsedInput.value,
            },
          };
        });

      const result = await action({ value: 5 });

      expect(result.data).toBeUndefined();
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors?.['data.id']).toBeDefined();
      expect(Array.isArray(result.validationErrors?.['data.id'])).toBe(true);
    });
  });
});

