/**
 * Tests for complex-schemas.example.ts
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
import { createContent, createUserProfile, createOrder, sendNotifications } from './complex-schemas.example';
import type { InferSafeActionFnResult } from 'next-safe-action';

describe('complex-schemas.example', () => {
  describe('createContent', () => {
    it('should create article content', async () => {
      const result = await createContent({
        content: {
          type: 'article',
          title: 'TypeScript Best Practices',
          content: 'This is a comprehensive guide to TypeScript.',
          author: 'John Doe',
        },
        category: 'tech',
      });

      type CreateContentResult = InferSafeActionFnResult<typeof createContent>;
      const typedResult: CreateContentResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.type).toBe('article');
      expect(typedResult.data?.title).toBe('TypeScript Best Practices');
    });

    it('should create video content', async () => {
      const result = await createContent({
        content: {
          type: 'video',
          title: 'Introduction to React',
          videoUrl: 'https://example.com/video.mp4',
          duration: 300,
        },
        category: 'tech',
      });

      type CreateContentResult = InferSafeActionFnResult<typeof createContent>;
      const typedResult: CreateContentResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.type).toBe('video');
      expect(typedResult.data?.videoUrl).toBe('https://example.com/video.mp4');
    });
  });

  describe('createUserProfile', () => {
    it('should create user profile with nested objects', async () => {
      const result = await createUserProfile({
        personalInfo: {
          firstName: 'Jane',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
        },
        contactInfo: {
          email: 'jane@example.com',
          phone: '+1234567890',
        },
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      });

      type CreateUserProfileResult = InferSafeActionFnResult<typeof createUserProfile>;
      const typedResult: CreateUserProfileResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.personalInfo.firstName).toBe('Jane');
      expect(typedResult.data?.contactInfo.email).toBe('jane@example.com');
    });
  });

  describe('createOrder', () => {
    it('should create order with complex arrays', async () => {
      const result = await createOrder({
        items: [
          { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2, price: 29.99 },
          { productId: '223e4567-e89b-12d3-a456-426614174001', quantity: 1, price: 49.99 },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
      });

      type CreateOrderResult = InferSafeActionFnResult<typeof createOrder>;
      const typedResult: CreateOrderResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.items.length).toBe(2);
      expect(typedResult.data?.total).toBe(109.97);
    });
  });

  describe('sendNotifications', () => {
    it('should send multiple notification types', async () => {
      const result = await sendNotifications({
        notifications: [
          { type: 'email', recipient: 'user@example.com', subject: 'Hello', body: 'Test email' },
          { type: 'sms', phoneNumber: '+1234567890', message: 'Test SMS' },
          { type: 'push', deviceToken: 'token123', title: 'Push', body: 'Test push' },
        ],
      });

      type SendNotificationsResult = InferSafeActionFnResult<typeof sendNotifications>;
      const typedResult: SendNotificationsResult = result;

      expect(typedResult.data).toBeDefined();
      expect(typedResult.data?.sent).toBe(3);
      expect(typedResult.data?.notifications.length).toBe(3);
    });
  });
});

