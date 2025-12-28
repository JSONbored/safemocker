/**
 * Complex Schemas Example
 *
 * This example demonstrates advanced Zod schema patterns:
 * discriminated unions, nested objects, arrays, and complex validation.
 *
 * **Framework Support:**
 * - **Jest**: Import from `@jsonbored/safemocker/jest`
 * - **Vitest**: Import from `@jsonbored/safemocker/vitest`
 *
 * Jest:
 * ```typescript
 * import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
 * ```
 *
 * Vitest:
 * ```typescript
 * import { createAuthedActionClient } from '@jsonbored/safemocker/vitest';
 * ```
 *
 * All other code remains identical between Jest and Vitest.
 *
 * @example
 * ```bash
 * # Run this example
 * npx tsx examples/complex-schemas.example.ts
 * ```
 */

import { createAuthedActionClient } from '@jsonbored/safemocker/jest';
import { z } from 'zod';
import type { InferSafeActionFnResult } from 'next-safe-action';

const authedAction = createAuthedActionClient();

// Example 1: Discriminated Union
const articleSchema = z.object({
  type: z.literal('article'),
  title: z.string().min(1),
  content: z.string().min(1),
  author: z.string().min(1),
});

const videoSchema = z.object({
  type: z.literal('video'),
  title: z.string().min(1),
  videoUrl: z.string().url(),
  duration: z.number().int().positive(),
});

const contentSchema = z.discriminatedUnion('type', [articleSchema, videoSchema]);

const createContent = authedAction
  .inputSchema(
    z.object({
      content: contentSchema,
      category: z.enum(['tech', 'business', 'lifestyle']),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    return {
      id: `content-${Date.now()}`,
      ...parsedInput.content,
      category: parsedInput.category,
      createdBy: ctx.userId,
    };
  });

// Example 2: Nested Objects
const createUserProfile = authedAction
  .inputSchema(
    z.object({
      personalInfo: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
      contactInfo: z.object({
        email: z.string().email(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      }),
      preferences: z.object({
        theme: z.enum(['light', 'dark', 'auto']),
        notifications: z.boolean(),
      }).optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    return {
      id: `profile-${Date.now()}`,
      ...parsedInput,
    };
  });

// Example 3: Complex Arrays
const createOrder = authedAction
  .inputSchema(
    z.object({
      items: z.array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().positive(),
          price: z.number().positive(),
        })
      ).min(1, 'At least one item is required').max(50, 'Maximum 50 items'),
      shippingAddress: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().length(2),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      }),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const total = parsedInput.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      orderId: `order-${Date.now()}`,
      items: parsedInput.items,
      shippingAddress: parsedInput.shippingAddress,
      total,
      userId: ctx.userId,
    };
  });

// Example 4: Array of Discriminated Unions
const notificationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    recipient: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
  }),
  z.object({
    type: z.literal('sms'),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    message: z.string().min(1).max(160),
  }),
  z.object({
    type: z.literal('push'),
    deviceToken: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
  }),
]);

const sendNotifications = authedAction
  .inputSchema(
    z.object({
      notifications: z.array(notificationSchema).min(1).max(100),
    })
  )
  .action(async ({ parsedInput }) => {
    return {
      sent: parsedInput.notifications.length,
      notifications: parsedInput.notifications.map((n, i) => ({
        id: `notif-${i}`,
        ...n,
      })),
    };
  });

// Example usage
async function main() {
  console.log('=== Complex Schemas Example ===\n');

  // Test 1: Discriminated Union - Article
  console.log('Test 1: Creating article content');
  const result1 = await createContent({
    content: {
      type: 'article',
      title: 'TypeScript Best Practices',
      content: 'This is a comprehensive guide to TypeScript.',
      author: 'John Doe',
    },
    category: 'tech',
  });

  type CreateContentResult = InferSafeActionFnResult<typeof createContent>;
  const typedResult1: CreateContentResult = result1;

  if (typedResult1.data) {
    console.log('✅ Article created:', typedResult1.data);
  }

  // Test 2: Discriminated Union - Video
  console.log('\nTest 2: Creating video content');
  const result2 = await createContent({
    content: {
      type: 'video',
      title: 'Introduction to React',
      videoUrl: 'https://example.com/video.mp4',
      duration: 300,
    },
    category: 'tech',
  });

  const typedResult2: CreateContentResult = result2;
  if (typedResult2.data) {
    console.log('✅ Video created:', typedResult2.data);
  }

  // Test 3: Nested Objects
  console.log('\nTest 3: Creating user profile with nested objects');
  const result3 = await createUserProfile({
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
  const typedResult3: CreateUserProfileResult = result3;

  if (typedResult3.data) {
    console.log('✅ Profile created:', typedResult3.data);
  }

  // Test 4: Complex Arrays
  console.log('\nTest 4: Creating order with complex arrays');
  const result4 = await createOrder({
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
  const typedResult4: CreateOrderResult = result4;

  if (typedResult4.data) {
    console.log('✅ Order created:');
    console.log(`   - Order ID: ${typedResult4.data.orderId}`);
    console.log(`   - Items: ${typedResult4.data.items.length}`);
    console.log(`   - Total: $${typedResult4.data.total.toFixed(2)}`);
  }

  // Test 5: Array of Discriminated Unions
  console.log('\nTest 5: Sending multiple notification types');
  const result5 = await sendNotifications({
    notifications: [
      { type: 'email', recipient: 'user@example.com', subject: 'Hello', body: 'Test email' },
      { type: 'sms', phoneNumber: '+1234567890', message: 'Test SMS' },
      { type: 'push', deviceToken: 'token123', title: 'Push', body: 'Test push' },
    ],
  });

  type SendNotificationsResult = InferSafeActionFnResult<typeof sendNotifications>;
  const typedResult5: SendNotificationsResult = result5;

  if (typedResult5.data) {
    console.log('✅ Notifications sent:', typedResult5.data.sent);
  }

  console.log('\n=== Example Complete ===');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createContent, createUserProfile, createOrder, sendNotifications };

