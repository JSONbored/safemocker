/**
 * Example user actions using the real safe-action.ts
 *
 * These actions demonstrate real-world usage patterns that safemocker can test.
 */

import { z } from 'zod';
import { authedAction, optionalAuthAction } from './safe-action';

/**
 * Create user action (requires authentication)
 */
export const createUser = authedAction
  .inputSchema(
    z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email address'),
      role: z.enum(['user', 'admin']).optional(),
    })
  )
  .metadata({ actionName: 'createUser', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    // Verify context is available
    if (!ctx.userId) {
      throw new Error('User ID not available');
    }

    return {
      id: 'new-user-id',
      name: parsedInput.name,
      email: parsedInput.email,
      role: parsedInput.role || 'user',
      createdBy: ctx.userId,
      createdAt: new Date().toISOString(),
    };
  });

/**
 * Get user profile (optional authentication)
 */
export const getUserProfile = optionalAuthAction
  .inputSchema(
    z.object({
      userId: z.string().uuid(),
    })
  )
  .metadata({ actionName: 'getUserProfile', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return {
      id: parsedInput.userId,
      name: 'John Doe',
      email: 'john@example.com',
      isOwnProfile: ctx.userId === parsedInput.userId,
      viewerId: ctx.userId,
      user: ctx.user, // Include user object from optional auth context
    };
  });

/**
 * Update user settings (requires authentication)
 */
export const updateUserSettings = authedAction
  .inputSchema(
    z.object({
      theme: z.enum(['light', 'dark', 'auto']).optional(),
      notifications: z.boolean().optional(),
    })
  )
  .metadata({ actionName: 'updateUserSettings', category: 'user' })
  .action(async ({ parsedInput, ctx }) => {
    return {
      userId: ctx.userId,
      settings: {
        theme: parsedInput.theme || 'auto',
        notifications: parsedInput.notifications ?? true,
      },
      updatedAt: new Date().toISOString(),
    };
  });

/**
 * Delete user (requires authentication, admin only)
 */
export const deleteUser = authedAction
  .inputSchema(
    z.object({
      userId: z.string().uuid(),
    })
  )
  .metadata({ actionName: 'deleteUser', category: 'admin' })
  .action(async ({ parsedInput, ctx }) => {
    // In real usage, would check if user is admin
    return {
      deleted: true,
      userId: parsedInput.userId,
      deletedBy: ctx.userId,
      deletedAt: new Date().toISOString(),
    };
  });

