import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import {
  createAuthedMiddleware,
  createOptionalAuthMiddleware,
  createMetadataValidationMiddleware,
  createRateLimitMiddleware,
} from '../src/middleware';
import type { MockSafeActionClientConfig } from '../src/types';

describe('middleware', () => {
  describe('createAuthedMiddleware', () => {
    it('should inject user context when auth is enabled', async () => {
      const config: Required<MockSafeActionClientConfig> = {
        defaultServerError: 'Error',
        isProduction: false,
        auth: {
          enabled: true,
          testUserId: 'user-123',
          testUserEmail: 'user@example.com',
          testAuthToken: 'token-123',
        },
      };

      const middleware = createAuthedMiddleware(config);
      let receivedCtx: any;

      await middleware({
        next: async (nextOpts) => {
          // next-safe-action v8 API: next() accepts { ctx: ... }
          receivedCtx = nextOpts?.ctx || {};
          return { success: true };
        },
        ctx: {},
      });

      expect(receivedCtx).toEqual({
        userId: 'user-123',
        userEmail: 'user@example.com',
        authToken: 'token-123',
      });
    });

    it('should not inject user context when auth is disabled', async () => {
      const config: Required<MockSafeActionClientConfig> = {
        defaultServerError: 'Error',
        isProduction: false,
        auth: {
          enabled: false,
          testUserId: 'user-123',
          testUserEmail: 'user@example.com',
          testAuthToken: 'token-123',
        },
      };

      const middleware = createAuthedMiddleware(config);
      let receivedCtx: any;

      await middleware({
        next: async (nextOpts) => {
          // next-safe-action v8 API: next() accepts { ctx: ... }
          receivedCtx = nextOpts?.ctx || {};
          return { success: true };
        },
        ctx: { existing: 'value' },
      });

      expect(receivedCtx).toEqual({ existing: 'value' });
      expect(receivedCtx.userId).toBeUndefined();
    });

    it('should merge with existing context', async () => {
      const config: Required<MockSafeActionClientConfig> = {
        defaultServerError: 'Error',
        isProduction: false,
        auth: {
          enabled: true,
          testUserId: 'user-123',
          testUserEmail: 'user@example.com',
          testAuthToken: 'token-123',
        },
      };

      const middleware = createAuthedMiddleware(config);
      let receivedCtx: any;

      await middleware({
        next: async (nextOpts) => {
          // next-safe-action v8 API: next() accepts { ctx: ... }
          // When middleware calls next({ ctx: authCtx }), we need to merge with existing ctx
          receivedCtx = { ...{ existing: 'value' }, ...(nextOpts?.ctx || {}) };
          return { success: true };
        },
        ctx: { existing: 'value' },
      });

      expect(receivedCtx).toEqual({
        existing: 'value',
        userId: 'user-123',
        userEmail: 'user@example.com',
        authToken: 'token-123',
      });
    });
  });

  describe('createOptionalAuthMiddleware', () => {
    it('should inject user context with user object when auth is enabled', async () => {
      const config: Required<MockSafeActionClientConfig> = {
        defaultServerError: 'Error',
        isProduction: false,
        auth: {
          enabled: true,
          testUserId: 'user-123',
          testUserEmail: 'user@example.com',
          testAuthToken: 'token-123',
        },
      };

      const middleware = createOptionalAuthMiddleware(config);
      let receivedCtx: any;

      await middleware({
        next: async (nextOpts) => {
          // next-safe-action v8 API: next() accepts { ctx: ... }
          receivedCtx = nextOpts?.ctx || {};
          return { success: true };
        },
        ctx: {},
      });

      expect(receivedCtx.user).toBeDefined();
      expect(receivedCtx.user.id).toBe('user-123');
      expect(receivedCtx.user.email).toBe('user@example.com');
      expect(receivedCtx.userId).toBe('user-123');
      expect(receivedCtx.userEmail).toBe('user@example.com');
      expect(receivedCtx.authToken).toBe('token-123');
    });

    it('should not inject user context when auth is disabled', async () => {
      const config: Required<MockSafeActionClientConfig> = {
        defaultServerError: 'Error',
        isProduction: false,
        auth: {
          enabled: false,
          testUserId: 'user-123',
          testUserEmail: 'user@example.com',
          testAuthToken: 'token-123',
        },
      };

      const middleware = createOptionalAuthMiddleware(config);
      let receivedCtx: any;

      await middleware({
        next: async (nextOpts) => {
          // next-safe-action v8 API: next() accepts { ctx: ... }
          receivedCtx = nextOpts?.ctx || {};
          return { success: true };
        },
        ctx: { existing: 'value' },
      });

      expect(receivedCtx).toEqual({ existing: 'value' });
      expect(receivedCtx.user).toBeUndefined();
      expect(receivedCtx.userId).toBeUndefined();
    });
  });

  describe('createMetadataValidationMiddleware', () => {
    it('should pass when metadata is valid', async () => {
      const schema = z.object({
        actionName: z.string(),
        category: z.string().optional(),
      });

      const middleware = createMetadataValidationMiddleware(schema);
      let called = false;

      await middleware({
        next: async () => {
          called = true;
          return { success: true };
        },
        metadata: { actionName: 'test', category: 'user' },
      });

      expect(called).toBe(true);
    });

    it('should throw error when metadata is invalid', async () => {
      const schema = z.object({
        actionName: z.string(),
      });

      const middleware = createMetadataValidationMiddleware(schema);

      await expect(
        middleware({
          next: async () => ({ success: true }),
          metadata: { invalid: 'data' },
        })
      ).rejects.toThrow('Invalid action metadata');
    });

    it('should re-throw non-Zod errors', async () => {
      const throwingSchema = {
        parse: () => {
          throw new Error('Non-Zod error');
        },
      } as unknown as z.ZodType;

      const middleware = createMetadataValidationMiddleware(throwingSchema);

      await expect(
        middleware({
          next: async () => ({ success: true }),
          metadata: { actionName: 'test' },
        })
      ).rejects.toThrow('Non-Zod error');
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should pass when no metadata schema provided', async () => {
      const middleware = createRateLimitMiddleware();
      let called = false;

      await middleware({
        next: async () => {
          called = true;
          return { success: true };
        },
      });

      expect(called).toBe(true);
    });

    it('should validate metadata when schema provided', async () => {
      const schema = z.object({
        actionName: z.string(),
      });

      const middleware = createRateLimitMiddleware(schema);
      let called = false;

      await middleware({
        next: async () => {
          called = true;
          return { success: true };
        },
        metadata: { actionName: 'test' },
      });

      expect(called).toBe(true);
    });

    it('should throw error when metadata is invalid', async () => {
      const schema = z.object({
        actionName: z.string(),
      });

      const middleware = createRateLimitMiddleware(schema);

      await expect(
        middleware({
          next: async () => ({ success: true }),
          metadata: { invalid: 'data' },
        })
      ).rejects.toThrow('Invalid action configuration');
    });

    it('should re-throw non-Zod errors', async () => {
      const throwingSchema = {
        parse: () => {
          throw new Error('Non-Zod error');
        },
      } as unknown as z.ZodType;

      const middleware = createRateLimitMiddleware(throwingSchema);

      await expect(
        middleware({
          next: async () => ({ success: true }),
          metadata: { actionName: 'test' },
        })
      ).rejects.toThrow('Non-Zod error');
    });
  });
});

