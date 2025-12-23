import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import {
  createAuthedActionClient,
  createOptionalAuthActionClient,
  createRateLimitedActionClient,
  createMetadataValidatedActionClient,
  createCompleteActionClient,
} from '../src/helpers';

describe('helpers', () => {
  describe('createAuthedActionClient', () => {
    it('should create client with authentication middleware', async () => {
      const client = createAuthedActionClient({
        auth: {
          testUserId: 'custom-user-id',
          testUserEmail: 'custom@example.com',
        },
      });

      const schema = z.object({ id: z.string() });
      const action = client
        .inputSchema(schema)
        .action(async ({ parsedInput, ctx }) => {
          return {
            id: parsedInput.id,
            userId: ctx.userId,
            userEmail: ctx.userEmail,
          };
        });

      const result = await action({ id: 'test-id' });

      expect(result.data).toEqual({
        id: 'test-id',
        userId: 'custom-user-id',
        userEmail: 'custom@example.com',
      });
    });
  });

  describe('createOptionalAuthActionClient', () => {
    it('should create client with optional authentication middleware', async () => {
      const client = createOptionalAuthActionClient({
        auth: {
          testUserId: 'custom-user-id',
        },
      });

      const schema = z.object({ id: z.string() });
      const action = client
        .inputSchema(schema)
        .action(async ({ parsedInput, ctx }) => {
          return {
            id: parsedInput.id,
            user: ctx.user,
            userId: ctx.userId,
          };
        });

      const result = await action({ id: 'test-id' });

      expect(result.data).toEqual({
        id: 'test-id',
        user: {
          id: 'custom-user-id',
          email: 'test@example.com',
        },
        userId: 'custom-user-id',
      });
    });
  });

  describe('createRateLimitedActionClient', () => {
    it('should create client with rate limiting middleware', async () => {
      const metadataSchema = z.object({
        actionName: z.string(),
      });

      const client = createRateLimitedActionClient(metadataSchema);

      const schema = z.object({ value: z.number() });
      const action = client
        .inputSchema(schema)
        .metadata({ actionName: 'test' })
        .action(async ({ parsedInput }) => {
          return { value: parsedInput.value };
        });

      const result = await action({ value: 42 });
      expect(result.data).toEqual({ value: 42 });
    });
  });

  describe('createMetadataValidatedActionClient', () => {
    it('should create client with metadata validation', async () => {
      const metadataSchema = z.object({
        actionName: z.string(),
        category: z.string().optional(),
      });

      const client = createMetadataValidatedActionClient(metadataSchema);

      const schema = z.object({ id: z.string() });
      const action = client
        .inputSchema(schema)
        .metadata({ actionName: 'test', category: 'user' })
        .action(async ({ parsedInput }) => {
          return { id: parsedInput.id };
        });

      const result = await action({ id: 'test-id' });
      expect(result.data).toEqual({ id: 'test-id' });
    });
  });

  describe('createCompleteActionClient', () => {
    it('should create all action client variants', () => {
      const metadataSchema = z.object({
        actionName: z.string(),
        category: z.string().optional(),
      });

      const clients = createCompleteActionClient(metadataSchema);

      expect(clients.actionClient).toBeDefined();
      expect(clients.loggedAction).toBeDefined();
      expect(clients.rateLimitedAction).toBeDefined();
      expect(clients.authedAction).toBeDefined();
      expect(clients.optionalAuthAction).toBeDefined();
    });

    it('should work with authedAction', async () => {
      const metadataSchema = z.object({
        actionName: z.string(),
      });

      const { authedAction } = createCompleteActionClient(metadataSchema, {
        auth: {
          testUserId: 'test-user',
          testUserEmail: 'test@example.com',
        },
      });

      const schema = z.object({ id: z.string() });
      const action = authedAction
        .inputSchema(schema)
        .metadata({ actionName: 'test' })
        .action(async ({ parsedInput, ctx }) => {
          return {
            id: parsedInput.id,
            userId: ctx.userId,
          };
        });

      const result = await action({ id: 'test-id' });

      expect(result.data).toEqual({
        id: 'test-id',
        userId: 'test-user',
      });
    });

    it('should work with optionalAuthAction', async () => {
      const metadataSchema = z.object({
        actionName: z.string(),
      });

      const { optionalAuthAction } = createCompleteActionClient(metadataSchema);

      const schema = z.object({ id: z.string() });
      const action = optionalAuthAction
        .inputSchema(schema)
        .metadata({ actionName: 'test' })
        .action(async ({ parsedInput, ctx }) => {
          return {
            id: parsedInput.id,
            user: ctx.user,
          };
        });

      const result = await action({ id: 'test-id' });

      expect(result.data).toEqual({
        id: 'test-id',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      });
    });
  });
});

